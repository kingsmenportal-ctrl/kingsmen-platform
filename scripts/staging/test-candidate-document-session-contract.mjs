import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const panel = read("apps/web/src/components/candidate/DocumentPreflightPanel.tsx");
const session = read("apps/web/src/lib/candidate-session.ts");
const documentsPage = read("apps/web/src/app/candidate/documents/page.tsx");
const profilePage = read("apps/web/src/components/candidate/CandidateMasterProfileForm.tsx");
const savedOpportunitiesPage = read("apps/web/src/components/candidate/CandidateSavedOpportunitiesClient.tsx");
const profile = read("apps/web/src/components/candidate/CandidateMasterProfileForm.tsx");
const savedOpportunities = read("apps/web/src/components/candidate/CandidateSavedOpportunitiesClient.tsx");
const opportunityMatches = read("apps/web/src/app/candidate/opportunity-matches/page.tsx");
const sessionControl = read("apps/web/src/components/candidate/CandidateSessionControl.tsx");
const authForm = read("apps/web/src/components/candidate/CandidateAuthForm.tsx");

assert.match(panel, /import \{ getCandidateSessionState \} from ["']@\/lib\/candidate-session["']/,
  "Document upload and download must use the shared candidate session boundary.");
assert.match(panel, /const state = getCandidateSessionState\(\)/,
  "Document operations must use the shared session state result.");
assert.match(panel, /state\.status === "expired"/,
  "Expired candidate sessions must be rejected before document requests.");
assert.match(panel, /state\.status === "unreadable"/,
  "Unreadable browser sessions must fail closed.");
assert.match(panel, /state\.status === "not_configured"/,
  "Missing/invalid Supabase configuration must be reported rather than guessed.");
assert.doesNotMatch(panel, /window\.localStorage|JSON\.parse\(raw\)|let projectRef\s*=\s*["']euhubhhnumtibbyufghm["']/,
  "Document UI must not keep a second parser or fall back to a hard-coded Supabase project.");
assert.match(panel, /functions\/v1\/candidate-private-documents/,
  "Document requests must continue to go through the authenticated private-document service.");
assert.match(panel, /action: "create_upload"/);
assert.match(panel, /action: "finalize_upload"/);
assert.match(panel, /action: "create_download_url"/);
assert.match(session, /session\.expires_at[\s\S]*Date\.now\(\)/,
  "Shared session validation must enforce token expiry.");
assert.match(documentsPage, /href=["']\/candidate\/applications["']>Applications<\/a>/,
  "The document vault must link back to the canonical applications journey.");
assert.match(profilePage, /href=["']\/candidate\/applications["']>Applications<\/a>/,
  "The profile must link back to the canonical applications journey.");
assert.match(savedOpportunitiesPage, /href=["']\/candidate\/applications["']>Applications<\/a>/,
  "Saved opportunities must link back to the canonical applications journey.");
assert.match(profile, /getCandidateSessionState\(\)/,
  "Candidate profile persistence must use the shared candidate session boundary.");
assert.match(savedOpportunities, /getCandidateSessionState\(\)/,
  "Saved-opportunity reads must use the shared candidate session boundary.");

assert.ok(opportunityMatches.includes('import { getCandidateSessionState } from "@/lib/candidate-session";'),
  "Opportunity matching must use the shared candidate session boundary.");
assert.ok(opportunityMatches.includes("const state = getCandidateSessionState()"),
  "Opportunity matching must use canonical expiry and session validation.");
assert.ok(!opportunityMatches.includes("window.localStorage") && !opportunityMatches.includes("JSON.parse(stored)")
  && !opportunityMatches.includes("euhubhhnumtibbyufghm"),
  "Opportunity matching must not duplicate browser-token parsing or hard-code a project fallback.");

for (const message of [
  "Candidate opportunity matching is not configured for this deployment.",
  "Sign in to load and save verified opportunities.",
  "Your candidate session has expired. Sign in again to continue.",
  "Your browser session could not be read. Sign in again."
]) {
  assert.ok(opportunityMatches.includes(message),
    "Opportunity matching must explain the specific candidate-session failure: " + message);
}
assert.ok(opportunityMatches.includes("if (!session.auth) throw new Error(session.error)"),
  "Loading verified opportunities must show the actionable session failure instead of a generic authentication error.");
assert.ok(opportunityMatches.includes("message: session.error"),
  "Saving a verified opportunity must show the same actionable session failure.");

assert.match(sessionControl, /getCandidateSessionState\(\)/);
assert.match(sessionControl, /getCandidateSupabaseConfig\(\)/);
assert.match(authForm, /getCandidateSupabaseConfig\(\)/,
  "Login/signup must use the same validated Supabase config as authenticated candidate requests.");
for (const [name, source] of [
  ["profile", profile],
  ["saved opportunities", savedOpportunities],
  ["session control", sessionControl],
  ["auth form", authForm]
]) {
  assert.doesNotMatch(source, /euhubhhnumtibbyufghm|JSON\.parse\(raw\)|let storageKey\s*=\s*["']/,
    name + " must not keep a hard-coded project fallback or a duplicate browser-session parser.");
}
assert.match(session, /storageKey:\s*`sb-\$\{projectRef\}-auth-token`/,
  "The shared config must derive the auth storage key from the validated project URL.");

console.log("PASS: document upload/download share the fail-closed candidate session boundary");
console.log("PASS: no hard-coded project fallback or duplicate browser-token parser remains");
console.log("PASS: document vault navigation connects to canonical applications");
console.log("PASS: profile, saved opportunities, auth and sign-out share the same session boundary");
console.log("Candidate session boundary contract passed.");
