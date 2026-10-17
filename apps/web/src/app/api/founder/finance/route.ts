import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/get_founder_finance_exceptions", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ p_limit: 100 })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "FINANCE_QUEUE_UNAVAILABLE", error: "Founder finance queue could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "FINANCE_QUEUE_QUERY_FAILED", error: "Founder/operator access or migration 0065 is missing." }, response.status === 401 || response.status === 403 ? response.status : 503);
  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true) return json({ ok: false, code: "FINANCE_QUEUE_INVALID", error: "The finance queue returned invalid data." }, 502);
  return json(data);
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { refundRequestId?: unknown; decision?: unknown; notes?: unknown; evidenceUrl?: unknown } | null;
  const refundRequestId = typeof body?.refundRequestId === "string" ? body.refundRequestId : "";
  const decision = body?.decision === "APPROVE" ? "APPROVE" : body?.decision === "REJECT" ? "REJECT" : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  const evidenceUrl = typeof body?.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
  if (!refundRequestId || !decision || (decision === "APPROVE" && (notes.length < 8 || !evidenceUrl))) {
    return json({ ok: false, code: "INVALID_REFUND_REVIEW", error: "Refund approval requires an evidence URL and at least eight characters of rationale." }, 400);
  }
  if (evidenceUrl) {
    try { const u = new URL(evidenceUrl); if (u.protocol !== "https:" || u.username || u.password || evidenceUrl.length > 2048) throw new Error(); }
    catch { return json({ ok: false, code: "INVALID_REFUND_EVIDENCE", error: "Refund evidence must be a valid HTTPS URL without embedded credentials." }, 400); }
  }
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/review_finance_refund_request", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_refund_request_id: refundRequestId, p_decision: decision, p_notes: notes, p_evidence_url: evidenceUrl || null })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "REFUND_REVIEW_UNAVAILABLE", error: "Refund review could not be reached." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 409;
    return json({ ok: false, code: "REFUND_REVIEW_REJECTED", error: status === 403 || status === 401 ? "Founder/operator permission is required." : "Refund review was rejected. Confirm migration 0065, payment verification and refund state." }, status);
  }
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "REFUND_REVIEW_UNCONFIRMED", error: "The database did not confirm the refund decision." }, 502);
  return json(result);
}
