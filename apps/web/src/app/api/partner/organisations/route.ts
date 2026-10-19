import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });
const types = new Set(["EMPLOYER","RECRUITER","UNIVERSITY","TVET","PRIVATE_COLLEGE","TRAINING_PROVIDER","SETA","FUNDER","ACCOMMODATION_PROVIDER","COMMUNITY_PARTNER","OTHER"]);

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const url = new URL(`${auth.config.url}/rest/v1/organisations`);
  url.searchParams.set("select", "id,display_name,organisation_type,official_website,contact_email,province,verification_status,verification_evidence,created_at,updated_at,reviewed_at");
  url.searchParams.set("created_by", `eq.${auth.user.id}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "100");
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, `/rest/v1/organisations?${url.searchParams}`).catch(() => null);
  if (!response) return json({ ok: false, code: "ORGANISATION_STORE_UNAVAILABLE", error: "Your organisation records could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "ORGANISATION_QUERY_FAILED", error: "Your organisation records could not be loaded." }, 502);
  const organisations = await response.json().catch(() => null);
  if (!Array.isArray(organisations)) return json({ ok: false, code: "ORGANISATION_RESPONSE_INVALID", error: "The organisation service returned invalid data." }, 502);
  return json({ ok: true, organisations });
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { displayName?: unknown; organisationType?: unknown; website?: unknown; province?: unknown } | null;
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const organisationType = typeof body?.organisationType === "string" ? body.organisationType : "";
  const website = typeof body?.website === "string" ? body.website.trim() : "";
  const province = typeof body?.province === "string" ? body.province.trim() : "";
  if (displayName.length < 2 || displayName.length > 180 || !types.has(organisationType)) return json({ ok: false, code: "INVALID_ORGANISATION", error: "Enter an organisation name (2–180 characters) and a supported organisation type." }, 400);
  if (website) {
    try { const parsed = new URL(website); if (parsed.protocol !== "https:" || parsed.username || parsed.password || website.length > 2048) throw new Error(); }
    catch { return json({ ok: false, code: "INVALID_WEBSITE", error: "Organisation website must be a valid HTTPS URL without embedded credentials." }, 400); }
  }
  if (province.length > 100) return json({ ok: false, code: "INVALID_PROVINCE", error: "Province must be 100 characters or fewer." }, 400);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/organisations", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({
      display_name: displayName,
      organisation_type: organisationType,
      official_website: website || null,
      contact_email: auth.user.email,
      province: province || null,
      verification_status: "PENDING_REVIEW",
      verification_evidence: [],
      created_by: auth.user.id
    })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "ORGANISATION_CREATE_UNAVAILABLE", error: "Organisation onboarding could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "ORGANISATION_CREATE_FAILED", error: "Organisation onboarding was rejected by the connected policy or schema. Nothing is marked verified." }, 502);
  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length !== 1) return json({ ok: false, code: "ORGANISATION_CREATE_UNCONFIRMED", error: "The database did not confirm the organisation record." }, 502);
  return json({ ok: true, organisation: rows[0], message: "Organisation submitted for verification. It cannot publish listings until authorised review is complete." }, 201);
}
