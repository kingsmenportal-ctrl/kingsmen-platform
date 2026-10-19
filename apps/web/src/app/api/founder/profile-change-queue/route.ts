import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/get_founder_profile_change_queue", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ p_limit: 100 })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "PROFILE_REVIEW_QUEUE_UNAVAILABLE", error: "Profile correction queue could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "PROFILE_REVIEW_QUEUE_FAILED", error: "Founder/operator access or migration 0069 is missing." }, response.status === 401 || response.status === 403 ? response.status : 503);
  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true || !Array.isArray(data.requests)) return json({ ok: false, code: "PROFILE_REVIEW_QUEUE_INVALID", error: "Profile correction queue returned invalid data." }, 502);
  return json(data);
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { requestId?: unknown; decision?: unknown; notes?: unknown } | null;
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const decision = body?.decision === "APPROVED" ? "APPROVED" : body?.decision === "REJECTED" ? "REJECTED" : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  if (!requestId || !decision || notes.length < 8) return json({ ok: false, code: "INVALID_PROFILE_REVIEW", error: "A request, decision and reason of at least eight characters are required." }, 400);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/review_candidate_profile_change", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_request_id: requestId, p_decision: decision, p_notes: notes })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "PROFILE_REVIEW_UNAVAILABLE", error: "Profile review action could not be reached." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 409;
    return json({ ok: false, code: "PROFILE_REVIEW_REJECTED", error: status === 403 || status === 401 ? "Founder/operator permission is required." : "Profile review was rejected. The current value may have changed or migration 0069 may be missing." }, status);
  }
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "PROFILE_REVIEW_UNCONFIRMED", error: "The database did not confirm the profile review." }, 502);
  return json(result);
}
