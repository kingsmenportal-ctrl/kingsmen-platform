import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const profilePath = "apps/web/src/app/candidate/profile/page.tsx";
const sessionPath = "apps/web/src/lib/kingsmen/supabase-session.ts";
const dashboardPath = "apps/web/src/app/candidate/dashboard/page.tsx";

assert.ok(existsSync(profilePath), "Candidate profile page must exist.");
assert.ok(existsSync(sessionPath), "Project-scoped browser session helper must exist.");

const profile = readFileSync(profilePath, "utf8");
const session = readFileSync(sessionPath, "utf8");
const dashboard = readFileSync(dashboardPath, "utf8");

for (const action of ["load", "save", "revoke_consent"]) {
  assert.ok(profile.includes(`"${action}"`) || profile.includes(`(${action}`), `Profile UI must support the ${action} action.`);
}
for (const pathway of [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
]) {
  assert.ok(profile.includes(`"${pathway}"`), `Profile UI must support the ${pathway} pathway preference.`);
}
assert.ok(profile.includes("/functions/v1/candidate-master-profile"), "Profile UI must use the existing authenticated server workflow.");
assert.ok(profile.includes("consentAccepted: true"), "A profile save must send the explicit consent acceptance flag.");
assert.ok(profile.includes("Withdraw consent"), "Candidates must be able to withdraw profile-processing consent.");
assert.ok(session.includes("sb-${projectRef}-auth-token"), "Session reads must be scoped to the configured Supabase project.");
assert.ok(!session.includes("SUPABASE_SERVICE_ROLE_KEY"), "Browser session helper must not contain a service-role key.");
assert.ok(dashboard.includes('href: "/candidate/profile"'), "Candidate dashboard must link to the profile page.");

console.log("Kingsmen candidate profile contract passed.");
