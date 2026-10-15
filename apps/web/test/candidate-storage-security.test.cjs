const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const storagePath = path.resolve(__dirname, "../src/lib/candidate-portal-storage.ts");
const authPath = path.resolve(__dirname, "../src/lib/supabase-auth.ts");
const routePath = path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts");
const storage = fs.readFileSync(storagePath, "utf8");
const auth = fs.readFileSync(authPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");

test("candidate state reads are explicitly scoped to the authenticated UUID", () => {
  assert.match(storage, /auth_user_id: \`eq\.\$\{context\.userId\}\`/);
  assert.match(storage, /select: "state"/);
  assert.match(storage, /limit: "1"/);
  assert.match(storage, /Authorization: \`Bearer \$\{context\.accessToken\}\`/);
});

test("candidate state writes bind the row to the authenticated UUID", () => {
  assert.match(storage, /on_conflict=auth_user_id/);
  assert.match(storage, /JSON\.stringify\(\{ auth_user_id: context\.userId, state \}\)/);
  assert.match(storage, /resolution=merge-duplicates,return=minimal/);
  assert.match(storage, /if \(!response\.ok\) throw new Error\("Candidate storage could not be saved\."\)/);
});

test("candidate data requests use anon key plus candidate access token, never service role", () => {
  assert.match(storage, /apikey: context\.anonKey/);
  assert.match(storage, /Authorization: \`Bearer \$\{context\.accessToken\}\`/);
  assert.doesNotMatch(storage, /SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(auth, /if \(!user\.id \|\| user\.role === "service_role"\) return \{ configured: true as const, user: null \}/);
});

test("auth lookup rejects malformed tokens and disables caching", () => {
  assert.match(auth, /token\.length > 8_192/);
  assert.match(auth, /!\/\^\[A-Za-z0-9\._~-\]\+\$\/\.test\(token\)/);
  assert.match(auth, /cache: "no-store"/);
  assert.match(auth, /AbortSignal\.timeout\(AUTH_LOOKUP_TIMEOUT_MS\)/);
});

test("private documents are stored beneath the authenticated user's UUID prefix", () => {
  assert.match(storage, /const storagePath = \`\$\{context\.userId\}\/\$\{objectKey\}\`/);
  assert.match(storage, /candidate-documents\/\$\{storagePath\.split\("\/"\)\.map\(encodeURIComponent\)\.join\("\/"\)\}/);
  assert.match(storage, /"x-upsert": "false"/);
  assert.match(storage, /if \(!response\.ok\) throw new Error\("Private document storage rejected the upload\."\)/);
});

test("private document deletion refuses references outside the current user's prefix", () => {
  assert.match(route, /const prefix = \`\$\{context\.userId\}\/\`/);
  assert.match(route, /document\.storagePath\.startsWith\(prefix\)/);
  assert.match(route, /objectName\.includes\("\/"\)/);
  assert.match(route, /document storage reference is invalid; no records were removed/);
});

test("production requests fail closed when candidate storage/auth is unavailable", () => {
  assert.match(route, /resolved\.status === "not_configured" && process\.env\.NODE_ENV !== "production"/);
  assert.match(route, /if \(resolved\.status !== "ready" && !localDevelopment\) return authOrStorageResponse\(resolved\.status\)/);
  assert.match(route, /process\.env\.NODE_ENV === "production"/);
  assert.match(route, /status: "STORAGE_NOT_CONFIGURED"/);
});

test("candidate responses are private and not cacheable", () => {
  assert.match(route, /headers\.set\("Cache-Control", "private, no-store, max-age=0"\)/);
  assert.match(route, /headers\.set\("Pragma", "no-cache"\)/);
});
