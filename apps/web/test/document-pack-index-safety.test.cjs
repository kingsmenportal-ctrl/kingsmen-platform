const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const script = fs.readFileSync(path.resolve(__dirname, "../../scripts/agents/personal-job-document-pack-index.mjs"), "utf8");

test("document pack index exposes proof presence but never raw proof or audit references", () => {
  assert.match(script, /proofReferencePresent: Boolean\(s\(item\.evidence\?\.proofReference\)\)/);
  assert.match(script, /auditReferencePresent: Boolean\(s\(item\.evidence\?\.auditReference\)\)/);
  assert.doesNotMatch(script, /proofReference: s\(item\.evidence\?\.proofReference\)/);
  assert.doesNotMatch(script, /auditReference: s\(item\.evidence\?\.auditReference\)/);
  assert.match(script, /Sensitive proof references and audit identifiers are deliberately omitted/);
});

test("document pack index rejects invalid, missing-ID, duplicate, and excessive snapshot inputs", () => {
  assert.match(script, /input\.snapshotItems\.length > 10000/);
  assert.match(script, /must be an object/);
  assert.match(script, /has no snapshotItemId/);
  assert.match(script, /duplicate snapshotItemId/);
});

test("document pack index keeps manual-only boundaries and does not fabricate candidate documents", () => {
  assert.match(script, /fabricatesDocuments: false/);
  assert.match(script, /sendsApplications: false/);
  assert.match(script, /contactsEmployers: false/);
  assert.match(script, /candidate upload required/);
  assert.match(script, /verified: false/);
});
