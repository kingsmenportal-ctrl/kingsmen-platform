import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
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
assert.throws(() => createCandidateSession({ candidateId: " ", expiresAt: expiry }), /candidateId is required/);
assert.throws(() => createCandidateSession({ candidateId: "candidate-a", expiresAt: "not-a-date" }), /valid date-time/);
assert.throws(() => createCandidateSession({ candidateId: "candidate-a", expiresAt: new Date(Date.now() - 1000).toISOString() }), /future/);
assert.throws(() => assertCandidateCanLogin("PENDING"), /cannot login/);
assert.doesNotThrow(() => assertCandidateCanLogin("ACTIVE"));
assert.equal(shouldRequireAccountRecovery("LOCKED"), true);
assert.equal(shouldRequireAccountRecovery("ACTIVE"), false);
console.log("Candidate session hardening tests passed (10 assertions).");
