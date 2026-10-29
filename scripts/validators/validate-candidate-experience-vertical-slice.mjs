#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const profilePage = read("apps/web/src/app/candidate/profile/page.tsx");
const profileApi = read("apps/web/src/app/api/candidate/profile/route.ts");
const profileFunction = read("supabase/functions/candidate-master-profile/index.ts");
const opportunityPage = read("apps/web/src/app/candidate/opportunity-matches/page.tsx");
const opportunityApi = read("apps/web/src/app/api/candidate/opportunity-save/route.ts");
const opportunityFunction = read("supabase/functions/candidate-save-verified-opportunity/index.ts");
const applicationsPage = read("apps/web/src/app/candidate/applications/page.tsx");
const documentsPage = read("apps/web/src/app/candidate/documents/page.tsx");
const dashboard = read("apps/web/src/app/candidate/dashboard/page.tsx");

for (const field of ["displayName", "phone", "province", "highestQualification", "studyInterests", "employmentInterests", "preferredLocation"]) {
  assert.ok(profileFunction.includes(field), `master profile service must allow-list ${field}`);
}
for (const pathway of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  assert.ok(profileFunction.includes(`"${pathway}"`), `profile service must accept pathway ${pathway}`);
  assert.ok(profilePage.includes(`"${pathway}"`), `profile UI must expose pathway ${pathway}`);
}
assert.ok(profileApi.includes("/functions/v1/candidate-master-profile"), "profile API must call the authoritative Supabase profile function");
assert.ok(profileApi.includes("AUTHENTICATION_REQUIRED") && profileApi.includes("cache: \"no-store\""), "profile API must require bearer auth and avoid caching");
assert.ok(profilePage.includes("Save profile") && profilePage.includes("Reload saved profile"), "profile UI must expose explicit save and reload");
assert.ok(profilePage.includes("consentAccepted") && profilePage.includes("Withdraw consent"), "profile UI must show consent acceptance and withdrawal");
assert.ok(profilePage.includes("Profile completeness") && profilePage.includes("aria-valuenow"), "profile UI must expose accessible completeness state");
assert.ok(profileFunction.includes("bootstrap_candidate_self_profile") && profileFunction.includes("No email-based link or duplicate profile was created"), "profile bootstrap must not link by email equality");
assert.ok(profileFunction.includes("SUPABASE_BACKEND") && profileFunction.includes("candidate_master_profiles"), "profile persistence must use Supabase backend state");
assert.ok(profileFunction.includes("privacy_consent_records") && profileFunction.includes("PROFILE_PROCESSING"), "consent must be persisted with a consent record");
assert.ok(profileFunction.includes("candidate_profile_change_requests") && profileFunction.includes("Correction request submitted"), "profile correction requests must be persisted and audited for review");

assert.ok(opportunityPage.includes("PATHWAYS") && opportunityPage.includes("Opportunity details and evidence"), "opportunity view must have six-pathway filtering and a details/evidence view");
assert.ok(opportunityPage.includes("Save & prepare application") && opportunityPage.includes("/api/candidate/opportunity-save"), "opportunity view must connect to save-to-workbench");
assert.ok(opportunityApi.includes("/functions/v1/candidate-save-verified-opportunity") && opportunityApi.includes("AUTHENTICATION_REQUIRED"), "opportunity API must proxy an authenticated server-validated action");
assert.ok(opportunityFunction.includes("candidate_auth_identity_links") && opportunityFunction.includes("IDENTITY_REVIEW_REQUIRED"), "save-to-application must require authorised candidate identity");
assert.ok(opportunityFunction.includes("OFFICIAL_VERIFIED") && opportunityFunction.includes("external_source_observations") && opportunityFunction.includes("stale_after"), "save-to-application must revalidate fresh official-source evidence");
assert.ok(opportunityFunction.includes("prepare_candidate_application_from_master_target") && opportunityFunction.includes("candidate_master_application_targets"), "save-to-application must create/reuse the parent application target and invoke the authoritative lifecycle");
assert.ok(opportunityFunction.includes("candidate_application_tracker") && opportunityFunction.includes("No provider submission has occurred"), "save-to-application must link the tracker without claiming provider submission");
assert.ok(applicationsPage.includes("SUBMITTED_CANDIDATE_REPORTED") && applicationsPage.includes("provider receipt not confirmed"), "tracker must keep candidate-reported submission separate from provider receipt");
assert.ok(documentsPage.includes("/api/candidate/documents/status") && documentsPage.includes("signedUploadUrl"), "Document Vault must retain authenticated private storage API path");
assert.ok(dashboard.includes('href: "/candidate/profile"'), "candidate dashboard must link to the reusable profile");

console.log(JSON.stringify({
  schema: "kingsmen.candidate-experience-vertical-slice.v1",
  passed: true,
  profile: ["authenticated API proxy", "backend save/reload", "consent", "completeness", "identity boundary", "correction request"],
  opportunities: ["six pathways", "source evidence detail", "fresh official-source revalidation", "save-to-parent-application lifecycle"],
  tracker: ["candidate-reported submission remains distinct from provider receipt"],
  documents: ["existing private Document Vault path retained"],
  note: "Source-contract test only. It does not replace web build, live function deployment verification, real candidate session tests, or authenticated end-to-end proof."
}, null, 2));
