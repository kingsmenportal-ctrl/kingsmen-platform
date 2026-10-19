import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const [queueResponse, candidateResponse] = await Promise.all([
    supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/get_candidate_identity_link_queue", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ p_limit: 100 })
    }).catch(() => null),
    supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/candidates?select=id,public_ref,display_name,email,current_state,is_active&is_active=eq.true&order=created_at.desc&limit=500").catch(() => null)
  ]);
  if (!queueResponse || !candidateResponse) return json({ ok: false, code: "IDENTITY_QUEUE_UNAVAILABLE", error: "The identity review queue could not be reached." }, 503);
  if (!queueResponse.ok || !candidateResponse.ok) return json({ ok: false, code: "IDENTITY_QUEUE_QUERY_FAILED", error: "Founder/operator access or identity migrations are missing. No identity decision was made." }, queueResponse.status === 401 || queueResponse.status === 403 ? queueResponse.status : 503);
  const [queue, candidates] = await Promise.all([queueResponse.json().catch(() => null), candidateResponse.json().catch(() => null)]);
  if (!queue || queue.ok !== true || !Array.isArray(queue.requests) || !Array.isArray(candidates)) return json({ ok: false, code: "IDENTITY_QUEUE_INVALID", error: "The identity queue returned invalid data." }, 502);
  return json({ ok: true, requests: queue.requests, candidates });
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { requestId?: unknown; decision?: unknown; candidateId?: unknown; evidenceUrls?: unknown; notes?: unknown } | null;
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const decision = body?.decision === "APPROVE" ? "APPROVE" : body?.decision === "REJECT" ? "REJECT" : "";
  const candidateId = typeof body?.candidateId === "string" ? body.candidateId : null;
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  const evidenceUrls = Array.isArray(body?.evidenceUrls) ? body.evidenceUrls.filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean) : [];
  if (!requestId || !decision || evidenceUrls.length > 10 || (decision === "APPROVE" && (!candidateId || evidenceUrls.length === 0))) {
    return json({ ok: false, code: "INVALID_IDENTITY_REVIEW", error: "Approval requires a candidate selection and independent HTTPS evidence. Up to ten evidence URLs are allowed." }, 400);
  }
  for (const value of evidenceUrls) {
    try { const u = new URL(value); if (u.protocol !== "https:" || u.username || u.password || value.length > 2048) throw new Error(); }
    catch { return json({ ok: false, code: "INVALID_EVIDENCE_URL", error: "Evidence URLs must use HTTPS and cannot include embedded credentials." }, 400); }
  }
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/review_candidate_identity_link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_request_id: requestId, p_decision: decision, p_candidate_id: candidateId, p_evidence_urls: evidenceUrls, p_notes: notes })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "IDENTITY_REVIEW_UNAVAILABLE", error: "The identity review action could not be reached." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 409;
    return json({ ok: false, code: "IDENTITY_REVIEW_REJECTED", error: status === 403 || status === 401 ? "Founder/operator permission is required." : "The identity decision was rejected. Confirm migrations 0059, 0061 and 0062, account state, and unique link constraints." }, status);
  }
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "IDENTITY_REVIEW_UNCONFIRMED", error: "The database did not confirm the identity review transaction." }, 502);
  return json({ ok: true, result, message: "Identity review, account binding and audit event committed in one database transaction." });
}
