const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const route = fs.readFileSync(path.join(root, "src/app/api/founder/documents/review/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/founder/documents/review/page.tsx"), "utf8");
const auth = fs.readFileSync(path.join(root, "src/lib/founder-auth.ts"), "utf8");
const migration = fs.readFileSync(path.resolve(root, "../../db/migrations/0018_founder_document_review_decisions.sql"), "utf8");

test("document review endpoint requires trusted founder access and private responses", () => {
  assert.match(route, /requireFounderAccess\(\)/);
  assert.match(route, /founderAccessDenied\(access\)/);
  assert.match(route, /founderPrivateJson\(/);
  assert.match(auth, /user\.app_metadata/);
  assert.doesNotMatch(auth, /user_metadata\?\.role|headers\.get\(["']x-founder/i);
});

test("document review validates bounded input and distinct references before database calls", () => {
  assert.match(route, /MAX_BODY_BYTES = 12 \* 1024/);
  assert.match(route, /Buffer\.byteLength\(raw, "utf8"\)/);
  for (const field of ["documentId", "candidateId", "proofId", "evidenceId", "auditId"]) {
    assert.ok(route.includes(field), `missing required field ${field}`);
  }
  assert.match(route, /must be distinct/);
  assert.match(route, /safeNotes\.length > 1200/);
  assert.match(route, /statuses = new Set/);
  assert.ok(route.indexOf("const required") < route.indexOf("record_founder_document_review"));
});

test("review endpoint calls authenticated transactional RPC and fails closed on database errors", () => {
  assert.match(route, /rest\/v1\/rpc\/record_founder_document_review/);
  assert.match(route, /Authorization: `Bearer ${token}`/);
  assert.match(route, /p_reviewer_user_id: access\.userId/);
  assert.match(route, /p_review_status: body\.reviewStatus/);
  assert.match(route, /migration 0018 is applied/);
  assert.match(route, /persistenceUnknown: true/);
  assert.match(route, /persisted\.persisted !== true/);
});

test("database persists immutable decisions and audit events but never changes source status", () => {
  assert.match(migration, /create table if not exists public\.founder_document_review_decisions/);
  assert.match(migration, /source_status_changed boolean not null default false check \(source_status_changed = false\)/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /auth\.uid\(\) <> p_reviewer_user_id/);
  assert.match(migration, /insert into public\.founder_ops_audit_events/);
  assert.match(migration, /revoke all on function public\.record_founder_document_review/);
  assert.doesNotMatch(migration, /update public\.candidate_documents|update public\.documents/i);
});

test("UI and API do not claim document ownership or evidence have been independently verified", () => {
  assert.match(route, /ownershipVerified: false/);
  assert.match(route, /evidenceResolved: false/);
  assert.match(route, /sourceStatusChanged: false/);
  assert.match(route, /have not been independently verified/);
  assert.match(page, /Document review/);
  assert.match(page, /ownership, proof and evidence references must still be independently verified/);
});
