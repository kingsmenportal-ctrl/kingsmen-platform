#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const transaction = readFileSync("apps/api/src/candidate/candidate-backend-transaction.ts", "utf8");
const runtime = readFileSync("apps/api/src/candidate/candidate-application-runtime.ts", "utf8");
const transactionTests = readFileSync("apps/api/src/candidate/candidate-backend-transaction.test.ts", "utf8");
const runtimeTests = readFileSync("apps/api/src/candidate/candidate-application-runtime.test.ts", "utf8");
const readBoundary = readFileSync("apps/api/src/candidate/candidate-application-read.ts", "utf8");
const webRoute = readFileSync("apps/web/src/app/api/candidate/applications/route.ts", "utf8");

assert.match(transaction, /await client\.query\("BEGIN"\)/);
assert.match(transaction, /set_config\('app\.kingsmen_role', \$1, true\)/);
assert.match(transaction, /set_config\('app\.service_context', \$2, true\)/);
assert.match(transaction, /\["service_role", "backend_api"\]/);
assert.match(transaction, /await client\.query\("COMMIT"\)/);
assert.match(transaction, /await client\.query\("ROLLBACK"\)/);
assert.match(transaction, /client\.release\(\)/);
assert.match(runtime, /withCandidateBackendTransaction/);
assert.match(runtime, /listApplicationsForVerifiedAuthUser/);
assert.match(transactionTests, /rolls back and releases connection when operation fails/);
assert.match(transactionTests, /transaction-locally and commits on same connection/);
assert.match(runtimeTests, /establishes trusted context before the owner-scoped query/);
assert.match(readBoundary, /link\.link_status = 'VERIFIED'/);
assert.match(readBoundary, /candidate\.is_active = true/);
assert.match(webRoute, /CANDIDATE_PROFILE_LINK_REQUIRED|CANDIDATE_AUTHORIZATION_NOT_CONFIGURED/);
assert.match(webRoute, /status:\s*503/);

console.log("Candidate backend transaction source assertions passed.");
console.log("Static validation only; run API build/tests and PostgreSQL RLS integration tests before enabling the web route.");
