const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const route = fs.readFileSync(path.join(root, "src/app/api/founder/documents/review/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/founder/documents/review/page.tsx"), "utf8");
const auth = fs.readFileSync(path.join(root, "src/lib/founder-auth.ts"), "utf8");
const migration = fs.readFileSync(path.resolve(root, "../../db/migrations/0018_founder_document_review_decisions.sql"), "utf8");
const validationMigration = fs.readFileSync(path.resolve(root, "../../db/migrations/0019_founder_document_canonical_validation.sql"), "utf8");

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
  assert.match(route, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(route, /p_reviewer_user_id: access\.userId/);
  assert.match(route, /p_review_status: body\.reviewStatus/);
  assert.match(route, /migrations 0018 and 0019 are applied/);
  assert.match(route, /persistenceUnknown: true/);
  assert.match(route, /persisted\.persisted !== true/);
  assert.match(route, /persisted\.ownershipVerified !== true/);
  assert.match(route, /persisted\.evidenceResolved !== true/);
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

test("canonical validation resolves real document, proof and evidence records without changing source status", () => {
  assert.match(validationMigration, /public\.document_files d/);
  assert.match(validationMigration, /d\.document_ref = p_document_ref/);
  assert.match(validationMigration, /v_candidate_id <> p_candidate_ref::uuid/);
  assert.match(validationMigration, /public\.document_verifications v/);
  assert.match(validationMigration, /PROOF_REFERENCE_NOT_FOUND/);
  assert.match(validationMigration, /VERIFICATION_PROOF_NOT_PASSED/);
  assert.match(validationMigration, /EVIDENCE_REFERENCE_NOT_FOUND/);
  assert.match(validationMigration, /public\.document_storage_events e/);
  assert.match(validationMigration, /ownershipVerified',true/);
  assert.match(validationMigration, /evidenceResolved',true/);
  assert.match(validationMigration, /sourceStatusChanged',false/);
  assert.doesNotMatch(validationMigration, /update public\.document_files|update public\.document_verifications/i);
  assert.match(route, /ownershipVerified !== true/);
  assert.match(route, /evidenceResolved !== true/);
  assert.match(route, /canonical registry/);
  assert.match(route, /source document was not modified/);
  assert.match(page, /canonical document registry/);
  assert.match(page, /Record existence is not proof that the evidence is truthful/);
});
