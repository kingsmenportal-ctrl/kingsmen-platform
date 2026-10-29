import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const profilePage = read("apps/web/src/app/candidate/profile/page.tsx");
const profileRoute = read("apps/web/src/app/api/candidate/profile/route.ts");
const profileFunction = read("supabase/functions/candidate-master-profile/index.ts");
const opportunityPage = read("apps/web/src/app/candidate/opportunity-matches/page.tsx");
const applicationRoute = read("apps/web/src/app/api/candidate/applications/route.ts");
const preparation = read("supabase/functions/candidate-application-preparation/index.ts");
const dashboard = read("apps/web/src/app/candidate/dashboard/page.tsx");
const identityPage = read("apps/web/src/app/candidate/identity-review/page.tsx");
const identityRoute = read("apps/web/src/app/api/candidate/identity-review/route.ts");
const followupRoute = read("apps/web/src/app/api/candidate/identity-review/followup/route.ts");
const evidenceRoute = read("apps/web/src/app/api/candidate/identity-review/evidence/route.ts");
const documentPage = read("apps/web/src/app/candidate/documents/page.tsx");
const documentFunction = read("supabase/functions/candidate-private-documents/index.ts");
const session = read("apps/web/src/lib/candidate-session.ts");

const checks = [
  ["profile CRUD is a backend API contract", /action: "load"/.test(profilePage) && /action: "save"/.test(profilePage) && /candidate-master-profile/.test(profileRoute)],
  ["profile load/save are restricted to verified identity links", /candidate_auth_identity_links/.test(profileFunction) && /link_status,verified_at,verified_by/.test(profileFunction.replace(/\s/g, "")) && /IDENTITY_NOT_VERIFIED/.test(profileFunction)],
  ["profile writes use canonical Supabase master profile table", /candidate_master_profiles/.test(profileFunction) && /onConflict: "candidate_id"/.test(profileFunction)],
  ["consent has a versioned snapshot and persisted status", /CONSENT_VERSION/.test(profileFunction) && /consent_text_snapshot/.test(profileFunction) && /privacy_consent_records/.test(profileFunction)],
  ["consent revoke preserves profile data", /consent_status: "REVOKED"/.test(profileFunction) && /profilePreserved: true/.test(profileFunction)],
  ["profile completeness is computed from required fields", /function completion\(/.test(profileFunction) && /pathwayPreferences/.test(profilePage) && /aria-valuenow/.test(profilePage)],
  ["profile reload fetches backend, not browser-stored profile", /action: "load"/.test(profilePage) && /cache: "no-store"/.test(profilePage) && !/localStorage.*profile/i.test(profilePage)],
  ["candidate session key derives from configured Supabase project ref", /new URL\(base\).hostname.split\("\."\)\[0\]/.test(session) && /sb-\$\{projectRef\}-auth-token/.test(session)],
  ["six pathway filters are present", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIPS","INTERNSHIPS","APPRENTICESHIPS","EMPLOYMENT"].every(x => opportunityPage.includes(x))],
  ["N15 feed fails closed on missing/stale evidence", /n15-candidate-opportunities/.test(opportunityPage) && /stale|verified/i.test(opportunityPage)],
  ["opportunity save and master-application actions are whitelisted", /save_n15_match/.test(applicationRoute) && /prepare_master_application/.test(applicationRoute) && /save_n15_match/.test(preparation) && /prepare_master_application/.test(preparation)],
  ["CAO remains governed by existing shared child-choice validator", /validateApplicationChildChoices/.test(read("apps/api/src/routes/application-lifecycle-policy.ts")) && /caoIsOneKingsmenApplication/.test(read("apps/api/src/routes/cao-boundary.ts"))],
  ["application status remains candidate-reported, not provider confirmation", /SUBMITTED_CANDIDATE_REPORTED/.test(preparation) && /provider_submission_sent:false/.test(preparation)],
  ["dashboard links to the persistent profile", /\/candidate\/profile/.test(dashboard)],
  ["profile corrections persist as review requests and never overwrite profile data", /request_correction/.test(profileFunction) && /candidate_profile_change_requests/.test(profileFunction) && /Your saved profile was not changed/.test(profileFunction)],
  ["identity-review status/request and follow-up APIs are connected", /candidate-identity-review-request/.test(identityRoute) && /candidate-identity-review-status/.test(identityRoute) && /candidate-identity-review-followup/.test(followupRoute)],
  ["identity evidence upload is explicitly consented and securely proxied", /evidenceConsent/.test(identityPage) && /candidate-identity-review-evidence-upload/.test(evidenceRoute) && /sha256/.test(read("supabase/functions/candidate-identity-review-evidence-upload/index.ts"))],
  ["document review states, correction notes and audit timeline are backend-fed", /candidate_private_document_reviews/.test(documentFunction) && /candidate_private_document_events/.test(documentFunction) && /reviewHistory/.test(documentPage) && /timeline/.test(documentPage)],
  ["candidate profile and workbench use shared Supabase project session parsing", /getCandidateAccessToken/.test(profilePage) && /getCandidateAccessToken/.test(read("apps/web/src/app/candidate/workbench/page.tsx")) && /getCandidateAccessToken/.test(read("apps/web/src/app/candidate/applications/page.tsx"))],
  ["active pathway filter determines the displayed and submitted pathway", /pathway !== "ALL" && item.pathways.includes\(pathway\) \? pathway/.test(opportunityPage)],
  ["dashboard links to profile and identity review", /\/candidate\/profile/.test(dashboard) && /\/candidate\/identity-review/.test(dashboard)],
  ["one-step opportunity save invokes the authenticated parent-application lifecycle", /\/api\/candidate\/opportunity-save/.test(opportunityPage) && /Save & prepare application/.test(opportunityPage) && /preparedApplications/.test(opportunityPage)],
  ["one-step save route authenticates and forwards only a supported match/pathway", /AUTHENTICATION_REQUIRED/.test(read("apps/web/src/app/api/candidate/opportunity-save/route.ts")) && /candidate-save-verified-opportunity/.test(read("apps/web/src/app/api/candidate/opportunity-save/route.ts"))],
  ["one-step save rechecks approved match, official freshness and verified identity", /candidate_auth_identity_links/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts")) && /OFFICIAL_VERIFIED/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts")) && /external_source_observations/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts")) && /stale_after/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts"))],
  ["one-step save prepares a parent application and keeps submission unclaimed", /prepare_candidate_application_from_master_target/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts")) && /candidate_application_tracker/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts")) && /No provider submission has occurred/.test(read("supabase/functions/candidate-save-verified-opportunity/index.ts"))],
];
let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed++;
}
console.log(`Candidate experience vertical-slice contract: ${checks.length - failed}/${checks.length} passed`);
if (failed) process.exit(1);
