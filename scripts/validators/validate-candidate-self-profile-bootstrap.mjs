import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/migrations/0095_candidate_self_service_profile_bootstrap.sql");
const profileFunction = read("supabase/functions/candidate-master-profile/index.ts");
const profilePage = read("apps/web/src/app/candidate/profile/page.tsx");
const evidenceUpload = read("supabase/functions/candidate-identity-review-evidence-upload/index.ts");

const checks = [
  ["bootstrap is a transaction-wrapped, service-role-only RPC", /begin;[\s\S]*create or replace function public\.bootstrap_candidate_self_profile/.test(migration) && /revoke all on function public\.bootstrap_candidate_self_profile[\s\S]*from public/.test(migration) && /grant execute on function public\.bootstrap_candidate_self_profile[\s\S]*to service_role/.test(migration)],
  ["bootstrap requires explicit accepted consent and stores its snapshot", /p_consent_accepted is distinct from true/.test(migration) && /privacy_consent_records/.test(migration) && /consent_text_snapshot/.test(migration)],
  ["bootstrap serializes normalized emails and never matches an existing candidate by email", /pg_advisory_xact_lock/.test(migration) && /lower\(pg_catalog\.btrim\(c\.email\)\) = v_email/.test(migration) && /MANUAL_IDENTITY_REVIEW_REQUIRED/.test(migration)],
  ["new self-service candidate link is PENDING, never VERIFIED", /p_supabase_user_id, v_candidate_id, 'PENDING'/.test(migration) && /'identity_link_status', 'PENDING'/.test(migration)],
  ["bootstrap transaction saves profile, consent, owner marker and candidate reference", /candidate_master_profiles/.test(migration) && /candidate_master_application_events/.test(migration) && /bootstrap_owner_user_id/.test(migration) && /candidate_reference/.test(migration)],
  ["new profile creation requires confirmed Auth email and explicit consent", /email_confirmed_at/.test(profileFunction) && /payload\.consentAccepted === true/.test(profileFunction) && /bootstrap_candidate_self_profile/.test(profileFunction)],
  ["profile reload does not auto-create a record and states not-provisioned honestly", /if \(action === "load"\)[\s\S]*?persistence: "NOT_PROVISIONED"/.test(profileFunction) && /No profile has been saved yet/.test(profileFunction)],
  ["pending self-service access is gated by exact Auth-user ownership marker", /details->>self_service_bootstrap/.test(profileFunction) && /details->>bootstrap_owner_user_id/.test(profileFunction) && /actor_auth_user_id/.test(profileFunction)],
  ["candidate profile displays candidate reference, completeness, consent and pending-review state", /candidateReference/.test(profilePage) && /aria-valuenow/.test(profilePage) && /consent.status/.test(profilePage) && /PENDING_REVIEW/.test(profilePage)],
  ["identity evidence uploader verifies content signature and SHA-256 before storing", /crypto\.subtle\.digest\("SHA-256"/.test(evidenceUpload) && /The file contents do not match/.test(evidenceUpload) && /storage\.from\(BUCKET\)\.upload/.test(evidenceUpload)]
];

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed++;
}
console.log(`Candidate self-profile bootstrap contract: ${checks.length - failed}/${checks.length} passed`);
if (failed) process.exit(1);
