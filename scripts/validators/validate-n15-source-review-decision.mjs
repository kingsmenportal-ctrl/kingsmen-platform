import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const migration = read("db/migrations/0110_n15_source_review_decision_atomicity.sql");
const edge = read("supabase/functions/n15-source-review-decision/index.ts");
const page = read("apps/web/src/app/founder/opportunity-sources/page.tsx");
const consoleUi = read("apps/web/src/components/founder/N15SourceReviewConsole.tsx");
const postgresTest = read("scripts/staging/test-n15-source-review-postgres.sql");
const browserTest = read("scripts/staging/test-n15-source-review-ui.mjs");
const workflow = read(".github/workflows/kingsmen-application-draft-contract.yml");

const checks = [
  ["new migration is explicitly review-only and preserves publication gates",
    /REVIEW-ONLY/.test(migration) &&
    /does not approve an opportunity, deadline, eligibility, fee, or candidate-facing publication/i.test(migration)],
  ["atomic RPC refuses callers other than service_role",
    /coalesce\(auth\.role\(\), ''\) <> 'service_role'/.test(migration) &&
    /N15_SOURCE_REVIEW_SERVICE_ROLE_REQUIRED/.test(migration)],
  ["RPC accepts only the three defined source decisions",
    /p_decision IS NULL OR p_decision NOT IN \('APPROVE_OFFICIAL_SOURCE', 'REJECT_SOURCE', 'MARK_SOURCE_STALE'\)/.test(migration)],
  ["RPC locks observation row and refuses previously decided observations",
    /FOR UPDATE/.test(migration) &&
    /SOURCE_OBSERVATION_ALREADY_DECIDED/.test(migration)],
  ["approved observations require active, official authority and matching hostname",
    /v_authority\.active IS NOT TRUE/.test(migration) &&
    /v_authority\.confidence_band <> 'OFFICIAL_VERIFIED'/.test(migration) &&
    /SOURCE_URL_OUTSIDE_AUTHORITY/.test(migration) &&
    /OFFICIAL_AUTHORITY_EVIDENCE_REQUIRED/.test(migration)],
  ["RPC retains evidence and 14-day stale-after boundary on approval",
    /evidence_refs = v_refs/.test(migration) &&
    /interval '14 days'/.test(migration) &&
    /last_checked_at = v_now/.test(migration)],
  ["decision audit insert is in the same SQL function transaction",
    /UPDATE public\.external_source_observations[\s\S]*INSERT INTO public\.opportunity_verification_reviews[\s\S]*RETURN jsonb_build_object/.test(migration)],
  ["RPC is granted only to service_role",
    /REVOKE ALL ON FUNCTION public\.record_n15_source_review_decision/.test(migration) &&
    /GRANT EXECUTE ON FUNCTION public\.record_n15_source_review_decision[\s\S]*TO service_role/.test(migration)],
  ["edge validates a real bearer session and active non-revoked reviewer",
    /auth\.auth\.getUser\(token\)/.test(edge) &&
    /\.eq\("is_active", true\)/.test(edge) &&
    /\.is\("revoked_at", null\)/.test(edge) &&
    /ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED/.test(edge)],
  ["edge bounds request body and rejects non-HTTPS evidence",
    /MAX_BODY_BYTES = 16 \* 1024/.test(edge) &&
    /REQUEST_TOO_LARGE/.test(edge) &&
    /url\.protocol !== "https:"/.test(edge) &&
    /MAX_EVIDENCE_REFS = 12/.test(edge)],
  ["edge requires explicit official-source attestation and checks authority domain",
    /reviewed_official_source !== true/.test(edge) &&
    /SOURCE_URL_OUTSIDE_AUTHORITY/.test(edge) &&
    /OFFICIAL_AUTHORITY_EVIDENCE_REQUIRED/.test(edge)],
  ["edge writes through the atomic database RPC rather than direct table updates",
    /admin\.rpc\("record_n15_source_review_decision"/.test(edge) &&
    !/admin\.from\("external_source_observations"\)\s*\.update/.test(edge)],
  ["UI uses only public Supabase config and user bearer token",
    /getCandidateSupabaseConfig/.test(consoleUi) &&
    /getCandidateAccessToken/.test(consoleUi) &&
    !/SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/.test(consoleUi)],
  ["UI disables approval when the authority is not active and official",
    /authority\?\.active && item\.authority\.confidence_band === "OFFICIAL_VERIFIED"/.test(consoleUi) &&
    /!approvalAvailable/.test(consoleUi)],
  ["UI states source verification is distinct from open status and publication",
    /does not open an opportunity, verify a closing date, approve eligibility/i.test(consoleUi) &&
    /never submits an application to a provider/i.test(consoleUi)],
  ["UI links into the existing Founder Control Plane codebase",
    /N15SourceReviewConsole/.test(page) &&
    /FOUNDER CONTROL PLANE/i.test(consoleUi)],
  ["PostgreSQL integration test covers least privilege, approval, rejection, stale, domain and replay",
    /has_function_privilege\('anon'/.test(postgresTest) &&
    /APPROVE_OFFICIAL_SOURCE/.test(postgresTest) &&
    /REJECT_SOURCE/.test(postgresTest) &&
    /MARK_SOURCE_STALE/.test(postgresTest) &&
    /obs-off-domain/.test(postgresTest) &&
    /duplicate source review was not rejected/.test(postgresTest)],
  ["browser test covers attestation, evidence, rejected source and unauthorized queue",
    /reviewed_official_source, true/.test(browserTest) &&
    /Approve official source/.test(browserTest) &&
    /Reject source/.test(browserTest) &&
    /queueForbidden = true/.test(browserTest)],
  ["focused CI workflow runs the source review validator and database test",
    /validate-n15-source-review-decision\.mjs/.test(workflow) &&
    /test-n15-source-review-postgres\.sql/.test(workflow) &&
    /test-n15-source-review-ui\.mjs/.test(workflow)]
];

let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${label}`);
  if (!passed) failures += 1;
}
console.log(`RESULT: ${checks.length - failures}/${checks.length} source-review contract assertions passed.`);
if (failures) process.exitCode = 1;
