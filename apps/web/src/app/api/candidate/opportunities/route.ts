import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });
type Row = Record<string, unknown>;
const inFilter = (ids: string[]) => `in.(${ids.map(id => `"${id.replace(/"/g, "\\\"")}"`).join(",")})`;

async function queryRows(cfg: Parameters<typeof supabaseAdminFetch>[0], table: string, params: URLSearchParams) {
  const response = await supabaseAdminFetch(cfg, `/rest/v1/${table}?${params}`);
  if (!response.ok) throw new Error(`${table} query failed`);
  const rows = await response.json().catch(() => null);
  if (!Array.isArray(rows)) throw new Error(`${table} returned invalid data`);
  return rows as Row[];
}

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  try {
    const now = new Date().toISOString();
    const listingParams = new URLSearchParams({
      select: "id,organisation_id,listing_type,title,description,province,location_text,official_source_url,application_url,application_method,eligibility,opens_at,closes_at,status,source_verified_at,source_verified_by,evidence_refs,created_at,updated_at",
      status: "eq.PUBLISHED",
      source_verified_at: "not.is.null",
      order: "updated_at.desc",
      limit: "200"
    });
    listingParams.set("or", `(closes_at.is.null,closes_at.gte.${now})`);
    const routeParams = new URLSearchParams({
      select: "id,provider_id,programme_key,programme_name,route_type,qualification_type,province,delivery_mode,application_method,source_url,source_confidence_band,route_status,availability_status,eligibility_summary,updated_at",
      route_status: "eq.VERIFIED",
      availability_status: "in.(OPEN,FUTURE)",
      source_confidence_band: "in.(A,B)",
      updated_at: `gte.${new Date(Date.now() - 90 * 86400000).toISOString()}`,
      order: "updated_at.desc",
      limit: "200"
    });
    const [rawListings, rawRoutes, savedListings, savedRoutes] = await Promise.all([
      queryRows(auth.config, "organisation_listings", listingParams),
      queryRows(auth.config, "route_programmes", routeParams),
      queryRows(auth.config, "candidate_saved_listings", new URLSearchParams({ select: "listing_id", user_id: `eq.${auth.session.userId}`, limit: "500" })),
      queryRows(auth.config, "candidate_saved_routes", new URLSearchParams({ select: "route_programme_id", user_id: `eq.${auth.session.userId}`, limit: "500" }))
    ]);
    const orgIds = [...new Set(rawListings.map(r => String(r.organisation_id || "")).filter(Boolean))];
    const providerIds = [...new Set(rawRoutes.map(r => String(r.provider_id || "")).filter(Boolean))];
    const [orgs, providers] = await Promise.all([
      orgIds.length ? queryRows(auth.config, "organisations", new URLSearchParams({ select: "id,display_name,verification_status,official_website", id: inFilter(orgIds), verification_status: "eq.VERIFIED", limit: "500" })) : Promise.resolve([]),
      providerIds.length ? queryRows(auth.config, "route_providers", new URLSearchParams({ select: "id,provider_name,provider_type,base_url,verification_status,public_safe,default_confidence_band", id: inFilter(providerIds), verification_status: "eq.VERIFIED", public_safe: "eq.true", default_confidence_band: "in.(A,B)", limit: "500" })) : Promise.resolve([])
    ]);
    const orgMap = new Map(orgs.map(row => [String(row.id), row]));
    const providerMap = new Map(providers.map(row => [String(row.id), row]));
    const listings = rawListings.filter(row => orgMap.has(String(row.organisation_id))).map(row => ({ ...row, organisation: orgMap.get(String(row.organisation_id)) }));
    const routes = rawRoutes.filter(row => providerMap.has(String(row.provider_id))).map(row => ({ ...row, provider: providerMap.get(String(row.provider_id)) }));
    return json({
      ok: true, listings, routes,
      savedListingIds: savedListings.map(row => String(row.listing_id)),
      savedRouteIds: savedRoutes.map(row => String(row.route_programme_id)),
      counts: { listings: listings.length, routes: routes.length },
      message: listings.length + routes.length === 0 ? "No currently verified opportunities were returned from the connected source records." : undefined
    });
  } catch {
    return json({ ok: false, code: "OPPORTUNITY_QUERY_FAILED", error: "Verified opportunities could not be loaded. Check the connected schema and service configuration." }, 502);
  }
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { kind?: unknown; id?: unknown; action?: unknown; note?: unknown } | null;
  const kind = body?.kind === "listing" ? "listing" : body?.kind === "route" ? "route" : "";
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action === "unsave" ? "unsave" : body?.action === "save" ? "save" : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!kind || !id || !action || note.length > 2000) return json({ ok: false, code: "INVALID_SAVE_REQUEST", error: "Choose a valid opportunity, save action, and note under 2,000 characters." }, 400);
  const table = kind === "listing" ? "candidate_saved_listings" : "candidate_saved_routes";
  const idField = kind === "listing" ? "listing_id" : "route_programme_id";
  const savedUrl = new URL(`${auth.config.url}/rest/v1/${table}`);
  savedUrl.searchParams.set("user_id", `eq.${auth.session.userId}`);
  savedUrl.searchParams.set(idField, `eq.${id}`);
  try {
    if (action === "unsave") {
      const response = await supabaseAdminFetch(auth.config, `/rest/v1/${table}?${savedUrl.searchParams}`, { method: "DELETE", headers: { prefer: "return=representation" } });
      if (!response.ok) return json({ ok: false, code: "UNSAVE_FAILED", error: "Saved opportunity could not be removed." }, 502);
      return json({ ok: true, saved: false });
    }

    const now = new Date().toISOString();
    if (kind === "listing") {
      const p = new URLSearchParams({ select: "id,organisation_id,status,source_verified_at,closes_at", id: `eq.${id}`, status: "eq.PUBLISHED", source_verified_at: "not.is.null", limit: "1" });
      p.set("or", `(closes_at.is.null,closes_at.gte.${now})`);
      const listings = await queryRows(auth.config, "organisation_listings", p);
      if (listings.length !== 1) return json({ ok: false, code: "LISTING_NOT_PUBLIC", error: "Only currently published, source-verified listings can be saved." }, 409);
      const orgs = await queryRows(auth.config, "organisations", new URLSearchParams({ select: "id", id: `eq.${String(listings[0].organisation_id)}`, verification_status: "eq.VERIFIED", limit: "1" }));
      if (orgs.length !== 1) return json({ ok: false, code: "ORGANISATION_NOT_VERIFIED", error: "The listing organisation is not verified." }, 409);
    } else {
      const p = new URLSearchParams({ select: "id,provider_id,route_status,availability_status,source_confidence_band,updated_at", id: `eq.${id}`, route_status: "eq.VERIFIED", availability_status: "in.(OPEN,FUTURE)", source_confidence_band: "in.(A,B)", updated_at: `gte.${new Date(Date.now() - 90 * 86400000).toISOString()}`, limit: "1" });
      const routes = await queryRows(auth.config, "route_programmes", p);
      if (routes.length !== 1) return json({ ok: false, code: "ROUTE_NOT_PUBLIC", error: "Only currently verified and open route programmes can be saved." }, 409);
      const providers = await queryRows(auth.config, "route_providers", new URLSearchParams({ select: "id", id: `eq.${String(routes[0].provider_id)}`, verification_status: "eq.VERIFIED", public_safe: "eq.true", default_confidence_band: "in.(A,B)", limit: "1" }));
      if (providers.length !== 1) return json({ ok: false, code: "PROVIDER_NOT_VERIFIED", error: "The route provider is not verified for public discovery." }, 409);
    }
    const existing = await queryRows(auth.config, table, new URLSearchParams({ select: "id,user_id", user_id: `eq.${auth.session.userId}`, [idField]: `eq.${id}`, limit: "1" }));
    if (existing.length) return json({ ok: true, saved: true, unchanged: true, record: existing[0] });
    const response = await supabaseAdminFetch(auth.config, `/rest/v1/${table}`, {
      method: "POST", headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({ user_id: auth.session.userId, [idField]: id, note })
    });
    if (!response.ok) return json({ ok: false, code: "SAVE_FAILED", error: "Opportunity could not be saved. Refresh and retry." }, 502);
    const rows = await response.json().catch(() => []);
    if (!Array.isArray(rows) || rows.length !== 1) return json({ ok: false, code: "SAVE_NOT_CONFIRMED", error: "The database did not confirm the saved opportunity." }, 502);
    return json({ ok: true, saved: true, record: rows[0] }, 201);
  } catch {
    return json({ ok: false, code: "SAVE_STORE_UNAVAILABLE", error: "The saved-opportunity store could not be reached." }, 503);
  }
}
