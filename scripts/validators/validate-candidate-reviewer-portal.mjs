import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const login = read("apps/web/src/app/candidate/login/page.tsx");
const portal = read("apps/web/src/app/candidate/page.tsx");
const identity = read("apps/web/src/app/candidate/identity-review/page.tsx");
const identityRoute = read("apps/web/src/app/api/candidate/identity-review/route.ts");
const reviewer = read("apps/web/src/app/reviewer/identity-reviews/page.tsx");
const documents = read("apps/web/src/app/candidate/documents/page.tsx");
const e2e = read("scripts/staging/test-candidate-reviewer-isolation-e2e.mjs");
const profile = read("apps/web/src/app/candidate/profile/page.tsx");
const profileRoute = read("apps/web/src/app/api/candidate/profile/route.ts");

const requiredPathways = [
  "Higher education", "TVET", "SETA programmes & learnerships",
  "Internships", "Apprenticeships", "Employment"
];

const checks = [
  ["registration confirmation returns to profile setup", login.includes("/candidate/login?next=%2Fcandidate%2Fprofile") && login.includes("redirect_to=") && login.includes('candidateRedirect("/candidate/profile")')],
  ["email-confirmation callback validates Auth session and clears URL tokens", login.includes('useEffect(() => {') && login.includes('/auth/v1/user') && login.includes("refresh_token: refreshToken") && login.includes("clearFragment();") && login.includes('window.location.assign(next)')],
  ["profile screen explicitly saves consent before backend bootstrap", profile.includes('action: "save"') && profile.includes("consentAccepted: consentChecked") && profileRoute.includes("candidate-master-profile")],
  ["candidate landing page uses all six canonical pathways", requiredPathways.every((pathway) => portal.includes(pathway))],
  ["candidate landing page directs existing-record recovery to identity review", portal.includes("/candidate/identity-review") && portal.toLowerCase().includes("email equality is never used as proof")],
  ["identity recovery screen uses authenticated server proxy", identity.includes("/api/candidate/identity-review") && identity.includes("/api/candidate/identity-review/evidence") && identityRoute.includes("candidate-identity-review-request")],
  ["reviewer screen uses shared project-scoped session helper", reviewer.includes("getCandidateAccessToken") && reviewer.includes("getCandidateSupabaseConfig")],
  ["reviewer screen sends anon key plus user bearer to Supabase functions", reviewer.includes("apikey: SUPABASE_CONFIG.anonKey") && reviewer.includes("reviewerHeaders(token")],
  ["reviewer screen does not hard-code project refs or scan arbitrary local-storage sessions", !reviewer.includes("PROJECT_REF") && !reviewer.includes("window.localStorage") && !reviewer.includes("readAccessToken")],
  ["reviewer interface is backed by queue, evidence, evidence-decision and identity-decision functions", ["candidate-identity-review-queue","candidate-identity-review-evidence-read","candidate-identity-review-evidence-decision","candidate-identity-review-decision"].every((name) => reviewer.includes(name))],
  ["private Document Vault retains server-proxied routes", ["/api/candidate/documents/status","/api/candidate/documents/upload-url","/api/candidate/documents/finalize","/api/candidate/documents/read-url"].every((route) => documents.includes(route)) && !documents.includes("uploadToSignedUrl")],
  ["live isolation test is read-only and requires three distinct auth sessions", e2e.includes("KINGSMEN_E2E_CANDIDATE_A_TOKEN") && e2e.includes("KINGSMEN_E2E_CANDIDATE_B_TOKEN") && e2e.includes("KINGSMEN_E2E_REVIEWER_TOKEN") && e2e.includes("databaseMutations: false")],
  ["live isolation test checks both foreign-document denials and reviewer queue role boundary", e2e.includes("foreignDocumentDenied(aToken, bDocumentId") && e2e.includes("foreignDocumentDenied(bToken, aDocumentId") && e2e.includes("Candidate A unexpectedly accessed the reviewer queue") && e2e.includes("Candidate B unexpectedly accessed the reviewer queue")]
];

for (const [name, condition] of checks) {
  assert.equal(condition, true, name);
  console.log("PASS " + name);
}
console.log(JSON.stringify({ schema: "kingsmen.candidate-reviewer-portal-contract.v1", status: "PASS", checks: checks.length }, null, 2));
