import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);
function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}
const taskIds = new Set(["profile", "id", "results", "route"]);
const pathwayIds = new Set(["", "higher-education", "tvet", "seta", "internships", "apprenticeships", "employment"]);

function response(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return response(403, { error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin"
      }
    });
  }
  if (req.method !== "POST") return response(405, { error: "Method not allowed." }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return response(503, { error: "Workspace persistence service is not configured." }, origin);
  }

  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return response(401, { error: "A signed-in account is required." }, origin);
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(bearer[1]);
  if (authError || !authData.user) return response(401, { error: "Your session is invalid or expired. Sign in again." }, origin);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return response(400, { error: "Request body must be valid JSON." }, origin); }
  const action = payload.action;
  if (action !== "load" && action !== "save") return response(400, { error: "Action must be load or save." }, origin);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: link, error: linkError } = await admin
    .from("candidate_auth_identity_links")
    .select("candidate_id")
    .eq("supabase_user_id", authData.user.id)
    .eq("link_status", "VERIFIED")
    .not("verified_at", "is", null)
    .limit(1)
    .maybeSingle();
  if (linkError) {
    console.error("workspace identity lookup failed", linkError.code ?? "unknown");
    return response(503, { error: "Could not verify candidate access. Try again later." }, origin);
  }
  if (!link?.candidate_id) {
    return response(403, {
      code: "IDENTITY_NOT_VERIFIED",
      error: "Candidate workspace data remains locked until an authorised reviewer verifies your identity link."
    }, origin);
  }

  if (action === "load") {
    const { data, error } = await admin
      .from("candidate_workspace_readiness")
      .select("completed_tasks,priority_pathway,revision,updated_at")
      .eq("candidate_id", link.candidate_id)
      .maybeSingle();
    if (error) {
      console.error("workspace readiness read failed", error.code ?? "unknown");
      return response(503, { error: "Could not load saved preparation progress." }, origin);
    }
    return response(200, {
      ready: true,
      completed_tasks: Array.isArray(data?.completed_tasks) ? data.completed_tasks.filter((id: unknown) => typeof id === "string" && taskIds.has(id)) : [],
      priority_pathway: typeof data?.priority_pathway === "string" && pathwayIds.has(data.priority_pathway) ? data.priority_pathway : "",
      revision: typeof data?.revision === "number" ? data.revision : 0,
      updated_at: data?.updated_at ?? null
    }, origin);
  }

  const completedTasks = payload.completed_tasks;
  const priorityPathway = typeof payload.priority_pathway === "string" ? payload.priority_pathway : "";
  if (!Array.isArray(completedTasks) || completedTasks.length > taskIds.size ||
      completedTasks.some((id: unknown) => typeof id !== "string" || !taskIds.has(id)) ||
      !pathwayIds.has(priorityPathway)) {
    return response(400, { error: "Preparation progress contains an unsupported task or pathway." }, origin);
  }
  const { data: current, error: currentError } = await admin
    .from("candidate_workspace_readiness")
    .select("revision")
    .eq("candidate_id", link.candidate_id)
    .maybeSingle();
  if (currentError) {
    console.error("workspace readiness revision lookup failed", currentError.code ?? "unknown");
    return response(503, { error: "Could not save preparation progress. Try again later." }, origin);
  }
  const now = new Date().toISOString();
  const { data: saved, error: saveError } = await admin
    .from("candidate_workspace_readiness")
    .upsert({
      candidate_id: link.candidate_id,
      completed_tasks: [...new Set(completedTasks as string[])],
      priority_pathway: priorityPathway,
      revision: (typeof current?.revision === "number" ? current.revision : 0) + 1,
      updated_at: now
    }, { onConflict: "candidate_id" })
    .select("completed_tasks,priority_pathway,revision,updated_at")
    .single();
  if (saveError || !saved) {
    console.error("workspace readiness save failed", saveError?.code ?? "unknown");
    return response(503, { error: "Could not save preparation progress. Try again later." }, origin);
  }
  return response(200, {
    ready: true,
    completed_tasks: saved.completed_tasks,
    priority_pathway: saved.priority_pathway,
    revision: saved.revision,
    updated_at: saved.updated_at,
    message: "Preparation progress saved to your verified candidate workspace."
  }, origin);
});
