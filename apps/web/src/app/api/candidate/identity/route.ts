import { randomUUID } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return Response.json({ ok: false, productionReady: false, code: auth.code, error: auth.message }, { status: auth.status, headers: { "cache-control": "no-store" } });
  let auditOk = false;
  try {
    const auditResponse = await supabaseAdminFetch(auth.config, "/rest/v1/candidate_profile_access_audit", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        candidate_id: auth.session.candidateId,
        actor_auth_user_id: auth.session.userId,
        action: "IDENTITY_VIEW",
        resource_type: "candidate_identity",
        resource_ref: null,
        outcome: "RECORDED",
        correlation_id: randomUUID()
      })
    });
    auditOk = auditResponse.ok;
  } catch {
    auditOk = false;
  }
  if (!auditOk) return Response.json({ ok: false, productionReady: false, code: "IDENTITY_AUDIT_UNAVAILABLE", error: "Privacy access evidence could not be recorded. Identity data was not returned." }, { status: 503, headers: { "cache-control": "no-store" } });
  const url = new URL(`${auth.config.url}/rest/v1/candidate_accounts`);
  url.searchParams.set("select", "candidate_id,email,auth_user_id,auth_status,email_verified,account_recovery_required,device_trust_required,created_at,updated_at");
  url.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  url.searchParams.set("limit", "2");
  try {
    const response = await supabaseAdminFetch(auth.config, `/rest/v1/candidate_accounts?${url.searchParams}`);
    if (!response.ok) return Response.json({ ok: false, productionReady: false, code: "IDENTITY_QUERY_FAILED", error: "Candidate identity status is unavailable." }, { status: 502, headers: { "cache-control": "no-store" } });
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].auth_user_id !== auth.session.userId) return Response.json({ ok: false, productionReady: false, code: "IDENTITY_LINK_MISMATCH", error: "The authenticated identity link is missing or ambiguous." }, { status: 403, headers: { "cache-control": "no-store" } });
    const row = rows[0];
    return Response.json({
      ok: true, productionReady: false,
      identity: { candidateId: auth.session.candidateId, email: row.email, authStatus: row.auth_status, emailVerified: row.email_verified === true, accountRecoveryRequired: row.account_recovery_required === true, deviceTrustRequired: row.device_trust_required === true, identityLinkVerified: true, identityLinkMethod: "authenticated Supabase user ID mapped to exactly one candidate account" },
      rules: { emailEqualityAloneCanLink: false, candidateCanChangeCandidateId: false, candidateCanSelfVerifyIdentity: false }
    }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch {
    return Response.json({ ok: false, productionReady: false, code: "IDENTITY_STORE_UNAVAILABLE", error: "Candidate identity status is temporarily unavailable." }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
export async function PATCH() {
  return Response.json({ ok: false, productionReady: false, code: "IDENTITY_MUTATION_DISABLED", error: "Identity links and verification status require authorised review." }, { status: 405, headers: { "cache-control": "no-store" } });
}
