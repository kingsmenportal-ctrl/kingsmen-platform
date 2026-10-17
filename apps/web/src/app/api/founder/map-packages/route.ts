import { requirePortalUser, supabaseUserFetch } from "../../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/get_founder_map_package_queue", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ p_limit: 100 })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "MAP_QUEUE_UNAVAILABLE", error: "The MAP review queue could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "MAP_QUEUE_REJECTED", error: "Founder/operator permission or migration 0072 is required." }, response.status === 401 || response.status === 403 ? response.status : 503);
  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true || !Array.isArray(data.packages)) return json({ ok: false, code: "MAP_QUEUE_INVALID", error: "The MAP queue returned invalid data." }, 502);
  return json(data);
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as {
    packageId?: unknown; decision?: unknown; evidenceUrls?: unknown; notes?: unknown; completionEvidenceRef?: unknown;
  } | null;
  const packageId = typeof body?.packageId === "string" ? body.packageId : "";
  const decision = body?.decision === "APPROVE" ? "APPROVE" : body?.decision === "REJECT" ? "REJECT" : body?.decision === "VERIFY_COMPLETION" ? "VERIFY_COMPLETION" : "";
  const evidenceUrls = Array.isArray(body?.evidenceUrls) ? body.evidenceUrls.filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean) : [];
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const completionEvidenceRef = typeof body?.completionEvidenceRef === "string" ? body.completionEvidenceRef.trim() : "";
  if (!packageId || !decision || notes.length < 8 || notes.length > 2000 || evidenceUrls.length > 10 ||
      (decision === "APPROVE" && evidenceUrls.length === 0) ||
      (decision === "VERIFY_COMPLETION" && (evidenceUrls.length === 0 || completionEvidenceRef.length < 3))) {
    return json({ ok: false, code: "INVALID_MAP_REVIEW", error: "Provide a package, a decision, a reason of at least eight characters, and HTTPS evidence for approval/completion." }, 400);
  }
  for (const value of evidenceUrls) {
    try { const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) throw new Error(); }
    catch { return json({ ok: false, code: "INVALID_MAP_EVIDENCE", error: "Evidence links must be HTTPS URLs without embedded credentials." }, 400); }
  }
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/review_candidate_manual_application_package", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      p_package_id: packageId, p_decision: decision, p_evidence_urls: evidenceUrls,
      p_notes: notes, p_completion_evidence_ref: completionEvidenceRef || null
    })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "MAP_REVIEW_UNAVAILABLE", error: "The review action could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "MAP_REVIEW_REJECTED", error: "The database rejected the review. Check reviewer authority, package status, and evidence." }, response.status === 401 || response.status === 403 ? response.status : 409);
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true || !result.package?.id) return json({ ok: false, code: "MAP_REVIEW_UNCONFIRMED", error: "The database did not confirm the review transaction." }, 502);
  return json({ ok: true, ...result });
}
