import { randomUUID } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";

const PROFILE_FIELDS = [
  "displayName", "preferredName", "phone", "email", "address", "city", "province",
  "postalCode", "dateOfBirth", "idNumber", "legalName", "highestGrade",
  "qualificationSummary", "academicResults", "bankName", "bankAccount"
] as const;

type ProfileField = typeof PROFILE_FIELDS[number];

async function audit(
  config: Parameters<typeof supabaseAdminFetch>[0],
  candidateId: string,
  actorId: string,
  action: "PROFILE_VIEW" | "IDENTITY_VIEW" | "CORRECTION_REQUEST" | "CORRECTION_LIST_VIEW",
  resourceType: string,
  resourceRef?: string
): Promise<boolean> {
  try {
    const response = await supabaseAdminFetch(config, "/rest/v1/candidate_profile_access_audit", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        candidate_id: candidateId, actor_auth_user_id: actorId, action,
        resource_type: resourceType, resource_ref: resourceRef || null,
        outcome: "RECORDED", correlation_id: randomUUID()
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

function jsonError(status: number, code: string, error: string) {
  return Response.json({ ok: false, productionReady: false, code, error }, {
    status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" }
  });
}

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return jsonError(auth.status, auth.code, auth.message);
  const audited = await audit(auth.config, auth.session.candidateId, auth.session.userId, "PROFILE_VIEW", "candidate_profile");
  if (!audited) return jsonError(503, "PROFILE_AUDIT_UNAVAILABLE", "Privacy access evidence could not be recorded. Profile data was not returned.");

  const fieldsUrl = new URL(`${auth.config.url}/rest/v1/candidate_profile_field_sources`);
  fieldsUrl.searchParams.set("select", "id,field_name,proposed_value,value_summary,source_type,source_ref,source_evidence_ref,confidence_band,candidate_confirmed,operator_review_required,accepted_into_profile,created_at,reviewed_at");
  fieldsUrl.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  fieldsUrl.searchParams.set("order", "created_at.desc");
  fieldsUrl.searchParams.set("limit", "200");
  const requestsUrl = new URL(`${auth.config.url}/rest/v1/candidate_profile_change_requests`);
  requestsUrl.searchParams.set("select", "id,field_name,requested_value,reason,sensitivity,status,requested_at,decided_at,decision_notes,source_evidence_ref");
  requestsUrl.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  requestsUrl.searchParams.set("order", "requested_at.desc");
  requestsUrl.searchParams.set("limit", "100");

  try {
    const [fieldsResponse, requestsResponse] = await Promise.all([
      supabaseAdminFetch(auth.config, `/rest/v1/candidate_profile_field_sources?${fieldsUrl.searchParams}`),
      supabaseAdminFetch(auth.config, `/rest/v1/candidate_profile_change_requests?${requestsUrl.searchParams}`)
    ]);
    if (!fieldsResponse.ok || !requestsResponse.ok) return jsonError(502, "PROFILE_QUERY_FAILED", "Profile records could not be loaded. Confirm the N04 schema migration is applied.");
    const [fields, requests] = await Promise.all([fieldsResponse.json(), requestsResponse.json()]);
    if (!Array.isArray(fields) || !Array.isArray(requests)) return jsonError(502, "PROFILE_RESPONSE_INVALID", "The profile store returned an invalid response.");
    return Response.json({
      ok: true, productionReady: false, candidateId: auth.session.candidateId,
      fields, correctionRequests: requests, editableFields: PROFILE_FIELDS,
      rules: { candidateCanDirectlyOverwriteTruth: false, sensitiveCorrectionsRequireOperatorReview: true, officialOutcomesAndPaymentStatusEditable: false, sourceConfidenceEditable: false }
    }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch {
    return jsonError(503, "PROFILE_STORE_UNAVAILABLE", "Profile services are temporarily unavailable.");
  }
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return jsonError(auth.status, auth.code, auth.message);
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "INVALID_JSON", "Send a valid JSON correction request."); }
  if (!body || typeof body !== "object") return jsonError(400, "INVALID_REQUEST", "Correction request must be an object.");
  const input = body as Record<string, unknown>;
  const fieldName = typeof input.fieldName === "string" ? input.fieldName.trim() : "";
  const requestedValue = typeof input.requestedValue === "string" ? input.requestedValue.trim() : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!PROFILE_FIELDS.includes(fieldName as ProfileField)) return jsonError(400, "FIELD_NOT_ALLOWED", "Choose a supported profile field.");
  if (!requestedValue || requestedValue.length > 2000) return jsonError(400, "INVALID_VALUE", "The proposed value must be between 1 and 2,000 characters.");
  if (!reason || reason.length < 8 || reason.length > 1000) return jsonError(400, "REASON_REQUIRED", "Explain the correction in 8 to 1,000 characters.");

  const legalIdentity = fieldName === "idNumber" || fieldName === "legalName";
  const sensitive = legalIdentity || ["email", "phone", "dateOfBirth", "bankAccount", "bankName", "academicResults", "highestGrade", "qualificationSummary"].includes(fieldName);
  const sensitivity = legalIdentity ? "LEGAL_IDENTITY" : sensitive ? (["bankAccount", "bankName"].includes(fieldName) ? "FINANCE" : ["academicResults", "highestGrade", "qualificationSummary"].includes(fieldName) ? "ACADEMIC" : "SENSITIVE") : "NORMAL";
  const evidenceRef = `candidate-correction:${randomUUID()}`;
  const audited = await audit(auth.config, auth.session.candidateId, auth.session.userId, "CORRECTION_REQUEST", "candidate_profile_change_request", evidenceRef);
  if (!audited) return jsonError(503, "PROFILE_AUDIT_UNAVAILABLE", "Privacy access evidence could not be recorded. The correction was not submitted.");

  const insert = await supabaseAdminFetch(auth.config, "/rest/v1/candidate_profile_change_requests", {
    method: "POST",
    headers: { "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      candidate_id: auth.session.candidateId, field_name: fieldName, requested_value: requestedValue,
      reason, source_evidence_ref: evidenceRef, sensitivity, status: "PENDING"
    })
  });
  if (!insert.ok) return jsonError(502, "CORRECTION_REQUEST_FAILED", "The correction request could not be saved. No profile value was overwritten.");
  const rows = await insert.json().catch(() => null);
  if (!Array.isArray(rows) || !rows[0]?.id) return jsonError(502, "CORRECTION_RECORD_UNCONFIRMED", "The correction request could not be confirmed.");
  return Response.json({
    ok: true, productionReady: false, correctionRequest: rows[0], requiresOperatorReview: sensitive,
    message: sensitive ? "Correction submitted for authorised review. Your current profile remains unchanged." : "Correction request recorded. Your current profile remains unchanged."
  }, { status: 201, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

export async function PATCH() {
  return jsonError(405, "DIRECT_PROFILE_MUTATION_DISABLED", "Profile fields cannot be directly overwritten. Submit a correction request instead.");
}
