import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routePath = "apps/web/src/app/candidate/applications/page.tsx";
const route = fs.readFileSync(path.join(root, routePath), "utf8");
const trackerPath = "apps/web/src/app/candidate/tracker/page.tsx";
const tracker = fs.readFileSync(path.join(root, trackerPath), "utf8");

assert.match(route, /import\s*\{\s*redirect\s*\}\s*from\s*["']next\/navigation["']/,
  "The canonical applications entry must use Next.js server-side redirect.");
assert.match(route, /redirect\(["']\/candidate\/tracker["']\)/,
  "The canonical applications entry must converge on the authenticated tracker.");
assert.match(tracker, /CandidateApplicationTracker/,
  "The destination must render the existing authenticated tracker rather than a second data path.");
assert.doesNotMatch(route, /localStorage|sessionStorage|createClient|SUPABASE_SERVICE_ROLE_KEY/,
  "The server entry route must not read browser tokens or introduce a second data-access boundary.");

console.log("Candidate applications entry-route contract passed.");
