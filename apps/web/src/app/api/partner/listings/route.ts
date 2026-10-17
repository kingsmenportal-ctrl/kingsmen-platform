import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });
const listingTypes = new Set(["JOB","INTERNSHIP","LEARNERSHIP","APPRENTICESHIP","BURSARY","FUNDING","UNIVERSITY_COURSE","TVET_COURSE","TRAINING","ACCOMMODATION","SERVICE"]);
const methods = new Set(["EXTERNAL_PORTAL","EMAIL","INTERNAL_REVIEW","IN_PERSON","UNKNOWN"]);
function safeHttps(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && value.length <= 2048; } catch { return false; }
}

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const url = new URL(`${auth.config.url}/rest/v1/organisation_listings`);
  url.searchParams.set("select", "id,organisation_id,listing_type,title,description,province,location_text,official_source_url,application_url,application_method,eligibility,opens_at,closes_at,status,source_verified_at,created_at,updated_at,reviewed_at,review_notes");
  url.searchParams.set("created_by", `eq.${auth.user.id}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "200");
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, `/rest/v1/organisation_listings?${url.searchParams}`).catch(() => null);
  if (!response) return json({ ok: false, code: "LISTING_STORE_UNAVAILABLE", error: "Your listing records could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "LISTING_QUERY_FAILED", error: "Your listing records could not be loaded." }, 502);
  const listings = await response.json().catch(() => null);
  if (!Array.isArray(listings)) return json({ ok: false, code: "LISTING_RESPONSE_INVALID", error: "The listing service returned invalid data." }, 502);
  return json({ ok: true, listings });
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const organisationId = typeof body?.organisationId === "string" ? body.organisationId : "";
  const listingType = typeof body?.listingType === "string" ? body.listingType : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const officialSourceUrl = typeof body?.officialSourceUrl === "string" ? body.officialSourceUrl.trim() : "";
  const applicationUrl = typeof body?.applicationUrl === "string" ? body.applicationUrl.trim() : "";
  const applicationMethod = typeof body?.applicationMethod === "string" ? body.applicationMethod : "EXTERNAL_PORTAL";
  const province = typeof body?.province === "string" ? body.province.trim() : "";
  const locationText = typeof body?.locationText === "string" ? body.locationText.trim() : "";
  const opensAt = typeof body?.opensAt === "string" && body.opensAt ? body.opensAt : null;
  const closesAt = typeof body?.closesAt === "string" && body.closesAt ? body.closesAt : null;
  const eligibility = typeof body?.eligibility === "string" ? body.eligibility.trim() : "";
  if (!organisationId || !listingTypes.has(listingType) || title.length < 3 || title.length > 220 || description.length < 10 || description.length > 12000 || !safeHttps(officialSourceUrl) || (applicationUrl && !safeHttps(applicationUrl)) || !methods.has(applicationMethod)) {
    return json({ ok: false, code: "INVALID_LISTING", error: "Provide an owned organisation, supported listing type, valid title/description, HTTPS source and valid application method/URL." }, 400);
  }
  if (province.length > 100 || locationText.length > 300 || eligibility.length > 4000) return json({ ok: false, code: "LISTING_FIELD_TOO_LONG", error: "Province, location or eligibility text exceeds its limit." }, 400);
  if (opensAt && Number.isNaN(Date.parse(opensAt)) || closesAt && Number.isNaN(Date.parse(closesAt))) return json({ ok: false, code: "INVALID_LISTING_DATES", error: "Opening and closing dates must be valid dates." }, 400);
  if (opensAt && closesAt && Date.parse(closesAt) < Date.parse(opensAt)) return json({ ok: false, code: "INVALID_LISTING_WINDOW", error: "Closing date must not precede the opening date." }, 400);

  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/organisation_listings", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({
      organisation_id: organisationId,
      listing_type: listingType,
      title,
      description,
      province: province || null,
      location_text: locationText || null,
      official_source_url: officialSourceUrl,
      application_url: applicationUrl || null,
      application_method: applicationMethod,
      eligibility: eligibility ? { summary: eligibility } : {},
      opens_at: opensAt,
      closes_at: closesAt,
      status: "PENDING_REVIEW",
      source_verified_at: null,
      source_verified_by: null,
      evidence_refs: [],
      created_by: auth.user.id
    })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "LISTING_CREATE_UNAVAILABLE", error: "Listing submission could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "LISTING_CREATE_FAILED", error: "The connected database policy rejected this listing. Confirm organisation ownership; listings remain pending until review." }, 502);
  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length !== 1) return json({ ok: false, code: "LISTING_CREATE_UNCONFIRMED", error: "The database did not confirm the listing record." }, 502);
  return json({ ok: true, listing: rows[0], message: "Listing submitted for review. It is not public until a reviewer verifies the source and publishes it." }, 201);
}
