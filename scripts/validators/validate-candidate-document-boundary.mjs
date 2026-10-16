import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Static source contract only: this does not exercise a running Next.js server,
// storage provider, Supabase identity, or deployed database policy.
const root = process.cwd();
const routes = [
  {
    path: "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
    method: "POST",
    reason: "upload signing must remain blocked until candidate ownership and a real private-storage signer exist"
  },
  {
    path: "apps/web/src/app/api/candidate/documents/read-url/route.ts",
    method: "POST",
    reason: "read signing must remain blocked until identity and document ownership are verified"
  },
  {
    path: "apps/web/src/app/api/candidate/documents/status/route.ts",
    method: "GET",
    reason: "document status must remain blocked until identity-scoped lookup exists"
  }
];

for (const route of routes) {
  const source = readFileSync(resolve(root, route.path), "utf8");
  assert.match(source, new RegExp(`export async function ${route.method}\\(\\s*\\)`), `${route.path}: handler must not accept caller-controlled identity arguments`);
  assert.match(source, /status:\s*"BLOCKED"/, `${route.path}: response must disclose blocked status`);
  assert.match(source, /code:\s*"CANDIDATE_AUTHORIZATION_NOT_CONFIGURED"/, `${route.path}: response must use stable authorization-block code`);
  assert.match(source, /status:\s*503/, `${route.path}: unavailable capability must return 503`);
  assert.match(source, /Cache-Control["']?\s*:\s*["']no-store/, `${route.path}: response must not be cached`);
  assert.match(source, /Pragma["']?\s*:\s*["']no-cache/, `${route.path}: legacy caches must be disabled`);
  assert.doesNotMatch(source, /createSignedUrl|createSignedUploadUrl|signedUrl\s*:/i, `${route.path}: must not pretend a storage signer exists`);
  console.log(`PASS ${route.path} — ${route.reason}`);
}

const profile = readFileSync(resolve(root, "apps/web/src/app/api/candidate/profile/route.ts"), "utf8");
assert.match(profile, /CANDIDATE_PROFILE_LINK_REQUIRED/);
assert.match(profile, /status:\s*503/);
assert.doesNotMatch(profile, /return NextResponse\.json\(\s*\{[^}]*candidateId/i);
console.log("PASS candidate profile route — verified identity alone is not candidate ownership");

const applications = readFileSync(resolve(root, "apps/web/src/app/api/candidate/applications/route.ts"), "utf8");
assert.match(applications, /CANDIDATE_PROFILE_LINK_REQUIRED/);
assert.match(applications, /status:\s*503/);
assert.doesNotMatch(applications, /applications:\s*\[\s*\]/i);
console.log("PASS candidate applications route — does not misrepresent blocked access as an empty result");

console.log("Candidate ownership boundary source checks passed. This is not runtime or deployed-policy evidence.");
