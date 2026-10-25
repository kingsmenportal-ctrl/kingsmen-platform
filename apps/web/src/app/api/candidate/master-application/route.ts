import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const PATHWAYS = new Set([
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP", "INTERNSHIP",
  "APPRENTICESHIP", "EMPLOYMENT", "FUNDING", "ACCOMMODATION", "WIL"
]);

function config() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Candidate workspace is not configured.");
  return { base, key };
}

async function candidateRequest(request: Request, path: string, init: RequestInit = {}) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  }
  let cfg: ReturnType<typeof config>;
  try { cfg = config(); } catch {
    return Response.json({ ok: false, error: "CANDIDATE_WORKSPACE_NOT_CONFIGURED" }, { status: 503 });
  }
  const auth = await fetch(`${cfg.base}/auth/v1/user`, {
    headers: { apikey: cfg.key, Authorization: authorization },
    cache: "no-store"
  });
  if (!auth.ok) return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const user = await auth.json() as { id?: string };
  if (!user.id) return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });

  const response = await fetch(`${cfg.base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: authorization,
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  const raw = await response.text();
  let data: unknown = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: "Invalid backend response" }; }
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status >= 500 ? 502 : 400;
    return Response.json({ ok: false, error: "PERSISTENCE_REQUEST_FAILED", detail: status === 400 ? data : undefined }, { status });
  }
  return { user, data };
}

export async function GET(request: Request) {
  const profile = await candidateRequest(
    request,
    "candidate_master_profiles?select=profile_data,pathway_preferences,consent_version,consent_at,updated_at&limit=1"
  );
  if (profile instanceof Response) return profile;
  const targets = await candidateRequest(
    request,
    "candidate_master_application_targets?select=id,target_key,pathway_type,provider_name,programme_or_role,provider_application_url,source_reference,source_confidence,planning_status,created_at,updated_at&order=created_at.desc"
  );
  if (targets instanceof Response) return targets;
  return Response.json({
    ok: true,
    profile: Array.isArray(profile.data) ? profile.data[0] ?? null : null,
    targets: Array.isArray(targets.data) ? targets.data : [],
    boundary: "Candidate-owned persisted profile and planning targets; no provider submission implied."
  });
}

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch {
    return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }
  if (!body || typeof body.profileData !== "object" || body.profileData === null || Array.isArray(body.profileData)) {
    return Response.json({ ok: false, error: "PROFILE_DATA_REQUIRED" }, { status: 400 });
  }
  if (!Array.isArray(body.pathwayPreferences) || body.pathwayPreferences.some((x: unknown) => typeof x !== "string" || !PATHWAYS.has(x))) {
    return Response.json({ ok: false, error: "INVALID_PATHWAY_PREFERENCES" }, { status: 400 });
  }
  if (body.consent !== true) return Response.json({ ok: false, error: "EXPLICIT_CONSENT_REQUIRED" }, { status: 400 });
  if (!Array.isArray(body.targets) || body.targets.length > 25) {
    return Response.json({ ok: false, error: "TARGET_LIMIT_EXCEEDED" }, { status: 400 });
  }
  const targets = [];
  for (const target of body.targets) {
    if (!target || typeof target !== "object" ||
        typeof target.providerName !== "string" || !target.providerName.trim() ||
        typeof target.programmeOrRole !== "string" || !target.programmeOrRole.trim() ||
        typeof target.pathwayType !== "string" || !PATHWAYS.has(target.pathwayType)) {
      return Response.json({ ok: false, error: "INVALID_TARGET" }, { status: 400 });
    }
    const url = typeof target.providerApplicationUrl === "string" && target.providerApplicationUrl.trim()
      ? target.providerApplicationUrl.trim() : null;
    if (url && (!url.startsWith("https://") || url.length > 2048)) {
      return Response.json({ ok: false, error: "TARGET_URL_MUST_BE_HTTPS" }, { status: 400 });
    }
    targets.push({
      target_key: typeof target.targetKey === "string" && target.targetKey.trim()
        ? target.targetKey.trim().slice(0, 120) : randomUUID(),
      pathway_type: target.pathwayType,
      provider_name: target.providerName.trim().slice(0, 180),
      programme_or_role: target.programmeOrRole.trim().slice(0, 240),
      provider_application_url: url,
      source_reference: typeof target.sourceReference === "string" ? target.sourceReference.trim().slice(0, 500) : null
    });
  }
  const idempotencyKey = typeof body.idempotencyKey === "string" &&
    /^[a-zA-Z0-9._:-]{16,120}$/.test(body.idempotencyKey) ? body.idempotencyKey : null;
  if (!idempotencyKey) return Response.json({ ok: false, error: "VALID_IDEMPOTENCY_KEY_REQUIRED" }, { status: 400 });

  const result = await candidateRequest(request, "rpc/save_candidate_master_application", {
    method: "POST",
    body: JSON.stringify({
      p_profile_data: body.profileData,
      p_pathway_preferences: body.pathwayPreferences,
      p_consent_version: "kingsmen-master-application-v1",
      p_idempotency_key: idempotencyKey,
      p_targets: targets
    })
  });
  if (result instanceof Response) return result;
  return Response.json({
    ok: true,
    result: result.data,
    message: "Your reusable profile and planning targets were saved. Provider applications have not been submitted."
  });
}
