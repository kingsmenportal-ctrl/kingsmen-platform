import { readLimitedJson } from "../../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;

function reply(body: unknown, status: number): Response {
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown>
    : { ok: false, error: "Invalid readiness service response." };
  return Response.json({
    ...payload,
    productionReady: false,
    candidateCanVerifySource: false,
    candidateCanMarkPaid: false,
    candidateCanMarkSubmitted: false,
    candidateCanVerifyOutcome: false,
    serviceRoleVisibleToBrowser: false
  }, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return reply({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to access saved preparation progress." }, 401);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return reply({ ok: false, code: "NOT_CONFIGURED", error: "Candidate preparation persistence is not configured for this deployment." }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await readLimitedJson(request, MAX_BODY_BYTES) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return reply({ ok: false, code, error: "The readiness request body is invalid." }, status);
  }

  const action = payload.action === "save" ? "save" : payload.action === "load" ? "load" : "load";
  if (action === "save") {
    const tasks = payload.completed_tasks;
    const pathway = payload.priority_pathway;
    const taskIds = new Set(["profile", "id", "results", "route"]);
    const pathwayIds = new Set(["", "higher-education", "tvet", "seta", "internships", "apprenticeships", "employment"]);
    if (!Array.isArray(tasks) || tasks.length > taskIds.size ||
      tasks.some((value) => typeof value !== "string" || !taskIds.has(value)) ||
      typeof pathway !== "string" || !pathwayIds.has(pathway)) {
      return reply({ ok: false, code: "READINESS_INPUT_INVALID", error: "Choose a supported pathway and checklist tasks." }, 400);
    }
  }

  let upstream: Response;
  try {
    const url = baseUrl.replace(/\/+$/, "");
    upstream = await fetch(`${url}/functions/v1/candidate-workspace-readiness`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(action === "save" ? {
        action,
        completed_tasks: payload.completed_tasks,
        priority_pathway: payload.priority_pathway
      } : { action }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
  } catch {
    return reply({ ok: false, code: "READINESS_SERVICE_UNAVAILABLE", error: "Saved preparation progress is temporarily unavailable." }, 503);
  }

  let data: unknown;
  try {
    const raw = await upstream.text();
    if (raw.length > 64 * 1024) return reply({ ok: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
    data = JSON.parse(raw);
  } catch {
    return reply({ ok: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
  }

  return reply(data, upstream.status);
}
