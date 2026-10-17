#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const identity = readFileSync("apps/api/src/candidate/candidate-identity-link.ts", "utf8");
const applications = readFileSync("apps/api/src/candidate/candidate-application-read.ts", "utf8");
const tests = readFileSync("apps/api/src/candidate/candidate-application-read.test.ts", "utf8");
const migration = readFileSync("db/migrations/0018_n20_candidate_auth_identity_link.sql", "utf8");
const route = readFileSync("apps/web/src/app/api/candidate/applications/route.ts", "utf8");

assert.match(identity, /link_status = 'VERIFIED'/);
assert.match(identity, /candidate\.is_active = true/);
assert.doesNotMatch(identity, /email\s*=/i);
assert.match(applications, /link\.supabase_user_id = \$1::uuid/);
assert.match(applications, /application\.candidate_id = candidate\.id/);
assert.match(applications, /if \(result\.rows\.length === 0\) return null/);
assert.match(applications, /verified_candidate_id/);
assert.doesNotMatch(applications, /email/i);
assert.match(migration, /supabase_user_id uuid NOT NULL UNIQUE/);
assert.match(migration, /candidate_id uuid NOT NULL UNIQUE/);
assert.match(migration, /link_status text NOT NULL DEFAULT 'PENDING'/);
assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /kingsmen_security\.is_backend_service_role\(\)/);
assert.match(tests, /distinguishes no verified identity from a verified candidate with no applications/);
assert.match(tests, /rejects malformed Auth IDs before database access/);
// The web route is intentionally fail-closed until the API database transaction
// establishes trusted context and runtime integration tests prove ownership.
assert.match(route, /CANDIDATE_PROFILE_LINK_REQUIRED|CANDIDATE_AUTHORIZATION_NOT_CONFIGURED/);
assert.match(route, /status:\s*503/);

console.log("Candidate identity/application boundary source assertions passed.");
console.log("This is a static source check only; it does not prove database RLS or runtime isolation.");
