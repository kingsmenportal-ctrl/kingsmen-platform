import { randomUUID } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });
type Row = Record<string, unknown>;

async function rows(cfg: Parameters<typeof supabaseAdminFetch>[0], table: string, params: URLSearchParams): Promise<Row[]> {
  const response = await supabaseAdminFetch(cfg, `/rest/v1/${table}?${params}`);
  if (!response.ok) throw new Error(`${table} query failed`);
  const data = await response.json().catch(() => null);
  if (!Array.isArray(data)) throw new Error(`${table} response invalid`);
  return data as Row[];
}

async function audit(cfg: Parameters<typeof supabaseAdminFetch>[0], userId: string, candidateId: string, trackerId: string, eventType: string, message: string) {
  const response = await supabaseAdminFetch(cfg, "/rest/v1/audit_events", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({
      event_id: randomUUID(),
      event_type: eventType,
      severity: "INFO",
      correlation_id: randomUUID(),
      actor_id: userId,
      candidate_id: candidateId,
      application_id: null,
      message,
      metadata: { source: "candidate_portal_application_tracker", tracker_id: trackerId }
    })
  }).catch(() => null);
  return Boolean(response?.ok);
}

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  try {
    const [tracker, existing] = await Promise.all([
      rows(auth.config, "candidate_route_applications", new URLSearchParams({ select: "id,source_kind,route_programme_id,organisation_listing_id,status,candidate_submission_reference,candidate_submission_note,candidate_reported_submitted_at,created_at,updated_at", user_id: `eq.${auth.session.userId}`, order: "updated_at.desc", limit: "200" })),
      rows(auth.config, "applications", new URLSearchParams({ select: "id,route_type,route_name,institution_or_provider,current_state,source_confidence_band,portal_health,map_fallback_required,last_evidence_ref,created_at,updated_at", candidate_id: `eq.${auth.session.candidateId}`, order: "updated_at.desc", limit: "200" }))
    ]);
    return json({ ok: true, tracker, existingApplications: existing, authority: { candidateCanReportOwnSubmission: true, candidateCanSetProviderDecision: false, acceptedOrRejectedRequiresAuthorisedEvidence: true } });
  } catch {
    return json({ ok: false, code: "APPLICATION_TRACKER_QUERY_FAILED", error: "Application tracking records could not be loaded. Check the connected schema." }, 502);
  }
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { kind?: unknown; sourceId?: unknown; note?: unknown } | null;
  const kind = body?.kind === "route" ? "route" : body?.kind === "listing" ? "listing" : "";
  const sourceId = typeof body?.sourceId === "string" ? body.sourceId : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!kind || !sourceId || note.length > 2000) return json({ ok: false, code: "INVALID_APPLICATION_REQUEST", error: "Choose a verified route or listing and an optional note under 2,000 characters." }, 400);
  try {
    const now = new Date().toISOString();
    let sourceKind: string, routeId: string | null = null, listingId: string | null = null;
    if (kind === "listing") {
      const p = new URLSearchParams({ select: "id,organisation_id,status,source_verified_at,closes_at", id: `eq.${sourceId}`, status: "eq.PUBLISHED", source_verified_at: "not.is.null", limit: "1" });
      p.set("or", `(closes_at.is.null,closes_at.gte.${now})`);
      const found = await rows(auth.config, "organisation_listings", p);
      if (found.length !== 1) return json({ ok: false, code: "LISTING_NOT_PUBLIC", error: "Only a currently published, source-verified listing can be tracked." }, 409);
      const orgs = await rows(auth.config, "organisations", new URLSearchParams({ select: "id", id: `eq.${String(found[0].organisation_id)}`, verification_status: "eq.VERIFIED", limit: "1" }));
      if (orgs.length !== 1) return json({ ok: false, code: "ORGANISATION_NOT_VERIFIED", error: "The listing organisation is not verified." }, 409);
      sourceKind = "PARTNER_LISTING"; listingId = sourceId;
    } else {
      const p = new URLSearchParams({ select: "id,provider_id,route_status,availability_status,source_confidence_band,updated_at", id: `eq.${sourceId}`, route_status: "eq.VERIFIED", availability_status: "in.(OPEN,FUTURE)", source_confidence_band: "in.(A,B)", updated_at: `gte.${new Date(Date.now() - 90 * 86400000).toISOString()}`, limit: "1" });
      const found = await rows(auth.config, "route_programmes", p);
      if (found.length !== 1) return json({ ok: false, code: "ROUTE_NOT_PUBLIC", error: "Only a currently verified and open route can be tracked." }, 409);
      const providers = await rows(auth.config, "route_providers", new URLSearchParams({ select: "id", id: `eq.${String(found[0].provider_id)}`, verification_status: "eq.VERIFIED", public_safe: "eq.true", default_confidence_band: "in.(A,B)", limit: "1" }));
      if (providers.length !== 1) return json({ ok: false, code: "PROVIDER_NOT_VERIFIED", error: "The route provider is not verified for public use." }, 409);
      sourceKind = "ROUTE_PROGRAMME"; routeId = sourceId;
    }

    const existing = await rows(auth.config, "candidate_route_applications", new URLSearchParams({
      select: "id,source_kind,route_programme_id,organisation_listing_id,status,candidate_submission_reference,candidate_submission_note,created_at,updated_at",
      user_id: `eq.${auth.session.userId}`,
      ...(routeId ? { route_programme_id: `eq.${routeId}` } : { organisation_listing_id: `eq.${listingId}` }),
      limit: "1"
    }));
    if (existing.length) return json({ ok: true, unchanged: true, tracker: existing[0], message: "This opportunity is already in your application tracker." });
    const id = randomUUID();
    const response = await supabaseAdminFetch(auth.config, "/rest/v1/candidate_route_applications", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({ id, user_id: auth.session.userId, source_kind: sourceKind, route_programme_id: routeId, organisation_listing_id: listingId, status: "PLANNING", candidate_submission_note: note })
    });
    if (!response.ok) return json({ ok: false, code: "APPLICATION_TRACKER_WRITE_FAILED", error: "The opportunity could not be added to your tracker." }, 502);
    const inserted = await response.json().catch(() => []);
    if (!Array.isArray(inserted) || inserted.length !== 1) return json({ ok: false, code: "APPLICATION_TRACKER_WRITE_UNCONFIRMED", error: "The database did not confirm the application tracker record." }, 502);
    const auditLogged = await audit(auth.config, auth.session.userId, auth.session.candidateId, id, "candidate.application.tracker.created", "Candidate added a verified opportunity to the application tracker.");
    return json({ ok: true, tracker: inserted[0], auditLogged, message: auditLogged ? "Opportunity added to your application tracker." : "Tracker record saved, but audit logging failed. Contact support before relying on this event as an audit trail." }, 201);
  } catch {
    return json({ ok: false, code: "APPLICATION_TRACKER_STORE_UNAVAILABLE", error: "The application tracker could not be reached." }, 503);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { trackerId?: unknown; status?: unknown; reference?: unknown; note?: unknown } | null;
  const trackerId = typeof body?.trackerId === "string" ? body.trackerId : "";
  const status = typeof body?.status === "string" ? body.status : "";
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const allowed = new Set(["PLANNING", "PREPARING", "READY_FOR_EXTERNAL_PORTAL", "EXTERNAL_PORTAL_OPENED", "CANDIDATE_REPORTED_SUBMITTED"]);
  if (!trackerId || !allowed.has(status) || note.length > 2000 || (status === "CANDIDATE_REPORTED_SUBMITTED" && reference.length < 3)) {
    return json({ ok: false, code: "INVALID_TRACKER_UPDATE", error: "Use a candidate-controlled status; reported submission requires a reference of at least three characters." }, 400);
  }
  const url = new URL(`${auth.config.url}/rest/v1/candidate_route_applications`);
  url.searchParams.set("id", `eq.${trackerId}`);
  url.searchParams.set("user_id", `eq.${auth.session.userId}`);
  url.searchParams.set("status", "in.(PLANNING,PREPARING,READY_FOR_EXTERNAL_PORTAL,EXTERNAL_PORTAL_OPENED,CANDIDATE_REPORTED_SUBMITTED)");
  const payload: Record<string, unknown> = { status, candidate_submission_note: note, updated_at: new Date().toISOString() };
  if (status === "CANDIDATE_REPORTED_SUBMITTED") {
    payload.candidate_submission_reference = reference;
    payload.candidate_reported_submitted_at = new Date().toISOString();
  } else {
    payload.candidate_submission_reference = null;
    payload.candidate_reported_submitted_at = null;
  }
  const response = await supabaseAdminFetch(auth.config, `/rest/v1/candidate_route_applications?${url.searchParams}`, {
    method: "PATCH", headers: { "content-type": "application/json", prefer: "return=representation" }, body: JSON.stringify(payload)
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "TRACKER_UPDATE_UNAVAILABLE", error: "The tracker update could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "TRACKER_UPDATE_FAILED", error: "The tracker update could not be saved." }, 502);
  const updated = await response.json().catch(() => []);
  if (!Array.isArray(updated) || updated.length !== 1) return json({ ok: false, code: "TRACKER_NOT_FOUND", error: "No candidate-owned tracker record matched this update." }, 404);
  const auditLogged = await audit(auth.config, auth.session.userId, auth.session.candidateId, trackerId, "candidate.application.tracker.updated", `Candidate reported tracker status ${status}.`);
  return json({ ok: true, tracker: updated[0], auditLogged, message: auditLogged ? "Tracker updated. Provider outcomes remain restricted to authorised evidence." : "Tracker updated, but audit logging failed. Contact support." });
}
