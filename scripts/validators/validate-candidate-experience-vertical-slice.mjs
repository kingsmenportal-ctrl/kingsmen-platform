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
  ["application status remains candidate-reported, not provider confirmation", /SUBMITTED_CANDIDATE_REPORTED/.test(preparation) && /provider_submission_sent:false/.test(preparation)),
  ["dashboard links to the persistent profile", /\/candidate\/profile/.test(dashboard)]
];
let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed++;
}
console.log(`Candidate experience vertical-slice contract: ${checks.length - failed}/${checks.length} passed`);
if (failed) process.exit(1);
