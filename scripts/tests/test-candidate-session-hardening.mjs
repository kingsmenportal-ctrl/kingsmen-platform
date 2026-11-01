import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const apiRequire = createRequire(join(root, "apps/api/package.json"));
const ts = apiRequire("typescript");
const sourcePath = join(root, "apps/api/src/candidate/candidate-auth.ts");
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const module = { exports: {} };
const localRequire = createRequire(sourcePath);
new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
const { createCandidateSession, assertCandidateCanLogin, shouldRequireAccountRecovery } = module.exports;

const expiry = new Date(Date.now() + 60_000).toISOString();
const a = createCandidateSession({ candidateId: " candidate-a ", expiresAt: expiry });
const b = createCandidateSession({ candidateId: "candidate-a", expiresAt: expiry });
assert.equal(a.candidateId, "candidate-a");
assert.notEqual(a.sessionId, b.sessionId, "session identifiers must be independently random");
assert.match(a.sessionId, /^sess_[0-9a-f-]{36}$/i);
const fingerprintOnly = createCandidateSession({
  candidateId: "candidate-a",
  expiresAt: expiry,
  deviceFingerprintHash: "client-supplied-fingerprint"
});
assert.equal(fingerprintOnly.trustStatus, "UNTRUSTED", "a presented fingerprint must not self-assert device trust");
assert.throws(() => createCandidateSession({ candidateId: " ", expiresAt: expiry }), /candidateId is required/);
assert.throws(() => createCandidateSession({ candidateId: "candidate-a", expiresAt: "not-a-date" }), /ISO 8601/);
assert.throws(() => createCandidateSession({ candidateId: "candidate-a", expiresAt: "1" }), /ISO 8601/);
assert.throws(() => createCandidateSession({ candidateId: "candidate-a", expiresAt: new Date(Date.now() - 1000).toISOString() }), /future/);

for (const invalidDateTime of [
  "2026-02-30T12:00:00Z",
  "2026-04-31T12:00:00Z",
  "2026-13-01T12:00:00Z",
  "2026-01-01T24:00:00Z",
  "2026-01-01T00:60:00Z",
  "2026-01-01T00:00:60Z",
  "2026-01-01T00:00:00+24:00",
  "2026-01-01T00:00:00+01:60"
]) {
  assert.throws(
    () => createCandidateSession({ candidateId: "candidate-a", expiresAt: invalidDateTime }),
    /valid ISO 8601 calendar date-time/,
    `must reject impossible date-time: ${invalidDateTime}`
  );
}
assert.throws(() => assertCandidateCanLogin("PENDING"), /cannot login/);
assert.doesNotThrow(() => assertCandidateCanLogin("ACTIVE"));
assert.equal(shouldRequireAccountRecovery("LOCKED"), true);
assert.equal(shouldRequireAccountRecovery("ACTIVE"), false);
console.log("Candidate session hardening tests passed (18 assertions plus 8 strict timestamp rejection cases).");
