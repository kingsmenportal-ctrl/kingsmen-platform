import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routePath = "apps/web/src/app/candidate/applications/page.tsx";
const route = fs.readFileSync(path.join(root, routePath), "utf8");
const trackerPath = "apps/web/src/app/candidate/tracker/page.tsx";
const tracker = fs.readFileSync(path.join(root, trackerPath), "utf8");
const trackerComponentPath = "apps/web/src/components/candidate/CandidateApplicationTracker.tsx";
const trackerComponent = fs.readFileSync(path.join(root, trackerComponentPath), "utf8");
const sessionPath = "apps/web/src/lib/candidate-session.ts";
const session = fs.readFileSync(path.join(root, sessionPath), "utf8");
const dashboardPath = "apps/web/src/app/candidate/dashboard/page.tsx";
const dashboard = fs.readFileSync(path.join(root, dashboardPath), "utf8");
const workflowPath = ".github/workflows/kingsmen-application-draft-contract.yml";
const workflow = fs.readFileSync(path.join(root, workflowPath), "utf8");

assert.match(route, /import\s*\{\s*redirect\s*\}\s*from\s*["']next\/navigation["']/,
  "The canonical applications entry must use Next.js server-side redirect.");
assert.match(route, /redirect\(["']\/candidate\/tracker["']\)/,
  "The canonical applications entry must converge on the authenticated tracker.");
assert.match(session, /export function getCandidateSessionState\(\)/,
  "Candidate application screens must share one session-reading boundary.");
assert.match(session, /session\.expires_at[\s\S]*Date\.now\(\)/,
  "Expired candidate sessions must be rejected before application data requests.");
assert.match(trackerComponent, /getCandidateSessionState/,
  "The application tracker must use the shared candidate session helper.");
assert.doesNotMatch(trackerComponent, /window\.localStorage|JSON\.parse\(raw\)/,
  "The tracker must not maintain a second implementation of browser session parsing.");
assert.match(tracker, /CandidateApplicationTracker/,
  "The destination must render the existing authenticated tracker rather than a second data path.");
assert.doesNotMatch(route, /localStorage|sessionStorage|createClient|SUPABASE_SERVICE_ROLE_KEY/,
  "The server entry route must not read browser tokens or introduce a second data-access boundary.");
assert.match(dashboard, /href:\s*["\']\/candidate\/applications["\']/,
  "The candidate dashboard workspace must use the canonical applications entry route.");
assert.match(dashboard, /href=["\']\/candidate\/applications["\']>Applications<\/Link>/,
  "The candidate header must expose the canonical Applications destination.");
assert.doesNotMatch(dashboard, /\/personal-job-desk\/application-tracker/,
  "The dashboard must not send candidates to the legacy duplicate tracker.");
assert.ok((workflow.match(/apps\/web\/src\/app\/candidate\/dashboard\/page\.tsx/g) ?? []).length >= 2,
  "Dashboard application navigation changes must run this contract in both PR and push workflows.");

console.log("Candidate applications route and navigation contract passed.");
