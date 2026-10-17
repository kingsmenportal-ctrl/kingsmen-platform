import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });

function bearer(request: Request) {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
}

async function userRpc(auth: { config: { url: string; anonKey: string } }, token: string, name: string, body: Record<string, unknown>) {
  return fetch(`${auth.config.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: auth.config.anonKey, authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
}

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  try {
    const [packagesResponse, applicationsResponse] = await Promise.all([
      supabaseAdminFetch(auth.config, `/rest/v1/candidate_manual_application_packages?select=id,map_ref,application_id,candidate_id,reason_code,reason_summary,source_links,required_documents,manual_steps,review_evidence_urls,status,review_notes,reviewed_at,delivered_at,delivery_confirmed_at,completion_evidence_ref,created_at,updated_at&candidate_id=eq.${auth.session.candidateId}&order=updated_at.desc&limit=100`),
      supabaseAdminFetch(auth.config, `/rest/v1/applications?select=id,route_type,route_name,institution_or_provider,portal_health,map_fallback_required,last_evidence_ref,current_state&candidate_id=eq.${auth.session.candidateId}&order=updated_at.desc&limit=200`)
    ]);
    if (!packagesResponse.ok || !applicationsResponse.ok) return json({ ok: false, code: "MAP_QUERY_FAILED", error: "Manual Application Packages could not be loaded. Confirm migration 0072 is deployed." }, 503);
    const [packages, applications] = await Promise.all([packagesResponse.json(), applicationsResponse.json()]);
    if (!Array.isArray(packages) || !Array.isArray(applications)) return json({ ok: false, code: "MAP_RESPONSE_INVALID", error: "The package service returned an invalid response." }, 502);
    const eligible = applications.filter((a: Record<string, unknown>) =>
      a.map_fallback_required === true || ["OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY", "SOURCE_REVIEW_REQUIRED"].includes(String(a.portal_health))
    );
    return json({ ok: true, packages, applications: eligible, authority: { candidateCanCreateDraft: true, candidateCanApproveOrVerify: false, providerSubmissionImplied: false } });
  } catch {
    return json({ ok: false, code: "MAP_QUERY_UNAVAILABLE", error: "Manual Application Package services are temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const token = bearer(request);
  const body = await request.json().catch(() => null) as {
    applicationId?: unknown; reasonCode?: unknown; reasonSummary?: unknown;
    sourceLinks?: unknown; requiredDocuments?: unknown;
  } | null;
  const applicationId = typeof body?.applicationId === "string" ? body.applicationId.trim() : "";
  const allowedReasons = new Set(["OTP_REQUIRED", "CAPTCHA_BLOCKED", "PORTAL_DOWN", "MANUAL_ONLY", "SOURCE_REVIEW_REQUIRED", "OTHER"]);
  const reasonCode = typeof body?.reasonCode === "string" ? body.reasonCode : "";
  const reasonSummary = typeof body?.reasonSummary === "string" ? body.reasonSummary.trim() : "";
  const sourceLinks = Array.isArray(body?.sourceLinks) ? body.sourceLinks.filter((v): v is string => typeof v === "string").map(v => v.trim()) : [];
  const requiredDocuments = Array.isArray(body?.requiredDocuments) ? body.requiredDocuments.filter((v): v is string => typeof v === "string").map(v => v.trim()) : [];
  if (!token || !applicationId || !allowedReasons.has(reasonCode) || reasonSummary.length < 5 || reasonSummary.length > 2000 ||
      sourceLinks.length < 1 || sourceLinks.length > 10 || requiredDocuments.length > 50 || requiredDocuments.some(v => !v || v.length > 180)) {
    return json({ ok: false, code: "INVALID_MAP_REQUEST", error: "Select an eligible application, provide a reason, at least one official HTTPS source URL, and document labels only when confirmed." }, 400);
  }
  for (const value of sourceLinks) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) throw new Error();
    } catch {
      return json({ ok: false, code: "INVALID_MAP_SOURCE", error: "Every source must be a valid HTTPS URL without embedded credentials." }, 400);
    }
  }
  const response = await userRpc(auth, token, "create_candidate_manual_application_package", {
    p_application_id: applicationId, p_reason_code: reasonCode, p_reason_summary: reasonSummary,
    p_source_links: sourceLinks, p_required_documents: requiredDocuments
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "MAP_CREATE_UNAVAILABLE", error: "The package could not be saved. Try again." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 409;
    return json({ ok: false, code: "MAP_CREATE_REJECTED", error: status === 503 ? "MAP migration 0072 is not deployed yet." : "The database rejected this package. Confirm application ownership, source URLs, and candidate identity." }, status);
  }
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true || !result.package?.id || result.package.status !== "DRAFT") {
    return json({ ok: false, code: "MAP_CREATE_UNCONFIRMED", error: "The database did not confirm a saved draft. No delivery is claimed." }, 502);
  }
  return json({ ok: true, ...result }, 201);
}

export async function PATCH(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const token = bearer(request);
  const body = await request.json().catch(() => null) as { packageId?: unknown; action?: unknown } | null;
  const packageId = typeof body?.packageId === "string" ? body.packageId : "";
  const action = body?.action === "CONFIRM_DELIVERY" ? "CONFIRM_DELIVERY" : body?.action === "START" ? "START" : "";
  if (!token || !packageId || !action) return json({ ok: false, code: "INVALID_MAP_ACTION", error: "Choose a package and a supported action." }, 400);
  const rpc = action === "CONFIRM_DELIVERY" ? "confirm_candidate_map_package_delivery" : "update_candidate_map_package_progress";
  const payload = action === "CONFIRM_DELIVERY" ? { p_package_id: packageId } : { p_package_id: packageId, p_status: "IN_PROGRESS" };
  const response = await userRpc(auth, token, rpc, payload).catch(() => null);
  if (!response) return json({ ok: false, code: "MAP_ACTION_UNAVAILABLE", error: "The package status could not be updated." }, 503);
  if (!response.ok) return json({ ok: false, code: "MAP_ACTION_REJECTED", error: "The package is not ready for this action, or the database migration is not deployed." }, response.status === 401 || response.status === 403 ? response.status : 409);
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "MAP_ACTION_UNCONFIRMED", error: "The database did not confirm the status change." }, 502);
  return json({ ok: true, ...result });
}
