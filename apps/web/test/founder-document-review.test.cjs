const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const route = fs.readFileSync(path.join(root, "src/app/api/founder/documents/review/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/founder/documents/review/page.tsx"), "utf8");
const auth = fs.readFileSync(path.join(root, "src/lib/founder-auth.ts"), "utf8");

test("document review proposal endpoint requires trusted founder access and private responses", () => {
  assert.match(route, /requireFounderAccess\(\)/);
  assert.match(route, /founderAccessDenied\(access\)/);
  assert.match(route, /founderPrivateJson\(/);
  assert.match(auth, /user\.app_metadata/);
  assert.doesNotMatch(auth, /user_metadata\?\.role|headers\.get\(["']x-founder/i);
});

test("document review proposals require bounded input and separate proof, evidence and audit references", () => {
  assert.match(route, /MAX_BODY_BYTES = 12 \* 1024/);
  assert.match(route, /Buffer\.byteLength\(raw, "utf8"\)/);
  for (const field of ["documentId", "candidateId", "proofId", "evidenceId", "auditId"]) {
    assert.ok(route.includes(field), `missing required field ${field}`);
  }
  assert.match(route, /must be distinct/);
  assert.match(route, /safeNotes.length > 1200/);
  assert.match(route, /statuses = new Set/);
});

test("review endpoint never claims it persisted a decision or changed document status", () => {
  assert.match(route, /persisted: false/);
  assert.match(route, /statusChanged: false/);
  assert.match(route, /No document was fetched, verified, rejected, or modified/);
  assert.match(route, /transactionally in a protected database RPC/);
});

test("founder document review UI labels decisions as proposals and surfaces prerequisites", () => {
  assert.match(page, /Document review proposal/);
  assert.match(page, /Validate review proposal/);
  assert.match(page, /proposal\.persisted \? "Saved" : "Not saved"/);
  assert.match(page, /does not yet verify ownership/);
  assert.match(page, /requirementsBeforePersistence/);
});
