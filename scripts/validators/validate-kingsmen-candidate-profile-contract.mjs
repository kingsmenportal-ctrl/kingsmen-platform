import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const profilePath = "apps/web/src/app/candidate/profile/page.tsx";
const sessionPath = "apps/web/src/lib/kingsmen/supabase-session.ts";
const dashboardPath = "apps/web/src/app/candidate/dashboard/page.tsx";
const edgeFunctionPath = "supabase/functions/candidate-master-profile/index.ts";
const opportunityMatchesPath = "apps/web/src/app/candidate/opportunity-matches/page.tsx";
const webPackagePath = "apps/web/package.json";
const webLockPath = "apps/web/package-lock.json";

assert.ok(existsSync(profilePath), "Candidate profile page must exist.");
assert.ok(existsSync(sessionPath), "Project-scoped browser session helper must exist.");
assert.ok(existsSync(edgeFunctionPath), "Source-controlled candidate profile Edge Function must exist.");
assert.ok(existsSync(opportunityMatchesPath), "Candidate opportunity matches page must exist.");
assert.ok(existsSync(webPackagePath), "Web package manifest must exist.");
assert.ok(existsSync(webLockPath), "Web package lockfile must exist.");

const profile = readFileSync(profilePath, "utf8");
const session = readFileSync(sessionPath, "utf8");
const dashboard = readFileSync(dashboardPath, "utf8");
const edgeFunction = readFileSync(edgeFunctionPath, "utf8");
const opportunityMatches = readFileSync(opportunityMatchesPath, "utf8");
const webPackage = JSON.parse(readFileSync(webPackagePath, "utf8"));
const webLock = JSON.parse(readFileSync(webLockPath, "utf8"));

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

const latestConsentDeclarations = edgeFunction.match(/const latestConsent = consentRows\?\.\[0\] \?\? null;/g) ?? [];
assert.equal(latestConsentDeclarations.length, 1, "Profile Edge Function must declare the latest consent record only once in the request handler.");
assert.ok(edgeFunction.includes("auth.auth.getUser(token)"), "Profile Edge Function must validate the bearer token with Supabase Auth.");
assert.ok(edgeFunction.includes("candidate_auth_identity_links"), "Profile Edge Function must resolve profile access through the candidate Auth identity-link table.");
assert.ok(edgeFunction.includes("bootstrap_candidate_self_profile"), "Initial profile creation must use the atomic, server-side bootstrap RPC.");
assert.ok(edgeFunction.includes('action === "revoke_consent"'), "Profile Edge Function must implement consent withdrawal.");
assert.ok(!/Access-Control-Allow-Origin["']?\s*:\s*["']\*["']/.test(edgeFunction), "Profile Edge Function must not enable wildcard CORS.");
assert.ok(edgeFunction.includes("KINGSMEN_PORTAL_ORIGINS"), "Profile Edge Function must allow only explicitly configured portal origins.");

assert.ok(opportunityMatches.includes("getKingsmenSupabaseAccessToken"), "Opportunity matches must use the shared project-scoped session helper.");
assert.ok(opportunityMatches.includes("getKingsmenSupabaseBrowserConfig"), "Opportunity matches must use the shared Supabase browser configuration.");
assert.ok(!opportunityMatches.includes("sb-euhubhhnumtibbyufghm-auth-token"), "Opportunity matches must not hard-code a project-specific localStorage session key.");
assert.ok(!opportunityMatches.includes("process.env.NEXT_PUBLIC_SUPABASE_URL"), "Opportunity matches must not bypass shared Supabase configuration.");
for (const [name, version] of Object.entries({ ...webPackage.dependencies, ...webPackage.devDependencies })) {
  assert.equal(webLock.packages[`node_modules/${name}`]?.version, version, `Web lockfile must match the exact pinned version of ${name}.`);
}
assert.equal(webPackage.dependencies.next, "15.5.29", "Web must use the patched Next.js 15.5.29 release.");
assert.ok(!webPackage.devDependencies["@netlify/plugin-nextjs"], "Netlify adapter should remain auto-managed rather than manually pinned.");

console.log("Kingsmen candidate profile contract passed.");
