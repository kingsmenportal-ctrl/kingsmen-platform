import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const orgUrl = new URL(`${auth.config.url}/rest/v1/organisations`);
  orgUrl.searchParams.set("select", "id,display_name,organisation_type,official_website,contact_email,province,verification_status,verification_evidence,created_by,created_at");
  orgUrl.searchParams.set("verification_status", "eq.PENDING_REVIEW");
  orgUrl.searchParams.set("order", "created_at.asc");
  orgUrl.searchParams.set("limit", "200");
  const listingUrl = new URL(`${auth.config.url}/rest/v1/organisation_listings`);
  listingUrl.searchParams.set("select", "id,organisation_id,listing_type,title,description,province,location_text,official_source_url,application_url,application_method,eligibility,opens_at,closes_at,status,source_verified_at,evidence_refs,created_by,created_at,review_notes");
  listingUrl.searchParams.set("status", "eq.PENDING_REVIEW");
  listingUrl.searchParams.set("order", "created_at.asc");
  listingUrl.searchParams.set("limit", "300");
  const [orgResponse, listingResponse] = await Promise.all([
    supabaseUserFetch(auth.config, auth.user.accessToken, `/rest/v1/organisations?${orgUrl.searchParams}`).catch(() => null),
    supabaseUserFetch(auth.config, auth.user.accessToken, `/rest/v1/organisation_listings?${listingUrl.searchParams}`).catch(() => null)
  ]);
  if (!orgResponse || !listingResponse) return json({ ok: false, code: "REVIEW_QUEUE_UNAVAILABLE", error: "The marketplace review queue could not be reached." }, 503);
  if (!orgResponse.ok || !listingResponse.ok) return json({ ok: false, code: "REVIEW_QUEUE_QUERY_FAILED", error: "The review queue could not be loaded. Confirm reviewer access and connected schema." }, 502);
  const [organisations, listings] = await Promise.all([orgResponse.json().catch(() => null), listingResponse.json().catch(() => null)]);
  if (!Array.isArray(organisations) || !Array.isArray(listings)) return json({ ok: false, code: "REVIEW_QUEUE_INVALID", error: "The review queue returned invalid data." }, 502);
  return json({ ok: true, organisations, listings, counts: { organisations: organisations.length, listings: listings.length } });
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { entityKind?: unknown; entityId?: unknown; decision?: unknown; evidenceUrls?: unknown; notes?: unknown } | null;
  const entityKind = body?.entityKind === "ORGANISATION" ? "ORGANISATION" : body?.entityKind === "LISTING" ? "LISTING" : "";
  const entityId = typeof body?.entityId === "string" ? body.entityId : "";
  const decision = typeof body?.decision === "string" ? body.decision : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  const evidenceUrls = Array.isArray(body?.evidenceUrls) ? body.evidenceUrls.filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean) : [];
  if (!entityKind || !entityId || !decision || evidenceUrls.length > 10) return json({ ok: false, code: "INVALID_REVIEW_ACTION", error: "A review target, decision, and up to ten evidence URLs are required." }, 400);
  for (const value of evidenceUrls) {
    try { const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) throw new Error(); }
    catch { return json({ ok: false, code: "INVALID_EVIDENCE_URL", error: "Evidence links must be valid HTTPS URLs without embedded credentials." }, 400); }
  }
  if (["VERIFIED","PUBLISHED"].includes(decision) && evidenceUrls.length === 0) return json({ ok: false, code: "EVIDENCE_REQUIRED", error: "Verification and publication require at least one evidence URL." }, 400);

  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/review_marketplace_entity", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_entity_kind: entityKind, p_entity_id: entityId, p_decision: decision, p_evidence_urls: evidenceUrls, p_notes: notes })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "REVIEW_ACTION_UNAVAILABLE", error: "The review action could not be reached." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 409;
    return json({ ok: false, code: "REVIEW_ACTION_REJECTED", error: status === 403 || status === 401 ? "Founder/operator permission is required." : "The review action was rejected. Confirm migration 0060, decision policy, and evidence requirements." }, status);
  }
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "REVIEW_ACTION_UNCONFIRMED", error: "The database did not confirm the audited review transaction." }, 502);
  return json({ ok: true, result, message: "Review decision and evidence audit were committed in the same database transaction." });
}
