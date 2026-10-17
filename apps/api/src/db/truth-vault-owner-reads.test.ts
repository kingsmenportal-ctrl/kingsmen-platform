import { strict as assert } from "node:assert";
import { test } from "node:test";
import { TruthVaultRepository } from "./truth-vault-repository";

const candidateUuid = "b5d6f7a8-1234-4abc-8def-1234567890ab";
const otherUuid = "c5d6f7a8-1234-4abc-8def-1234567890ab";

function repositoryReturning(row: Record<string, unknown> | null, captured: { sql?: string; values?: readonly unknown[] }) {
  const repository = Object.create(TruthVaultRepository.prototype) as TruthVaultRepository;
  Object.assign(repository, {
    pool: {
      query: async (sql: string, values: readonly unknown[] = []) => {
        captured.sql = sql;
        captured.values = values;
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      },
      end: async () => undefined
    },
    storageMode: "postgres_truth_vault"
  });
  return repository;
}

test("candidate status lookup constrains the requested public reference to the verified candidate UUID", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning({
    id: candidateUuid, public_ref: "cand-public-123", email: "candidate@example.test",
    display_name: "Test Candidate", current_state: "NEW", active_package_code: null,
    updated_at: "2026-01-01T00:00:00.000Z"
  }, captured);
  const result = await repository.readCandidateStatusForOwner(candidateUuid, "cand-public-123");
  assert.equal(result?.candidateId, "cand-public-123");
  assert.match(captured.sql ?? "", /id = \$1::uuid and public_ref = \$2/);
  assert.deepEqual(captured.values, [candidateUuid, "cand-public-123"]);
});

test("application workbench lookup scopes the application reference to the verified candidate UUID", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning({
    id: "application-row-id", application_ref: "app-public-1", candidate_ref: "cand-public-123",
    route_type: "UNIVERSITY", source_confidence_band: "B", current_state: "NEW",
    portal_health: "UNKNOWN", map_fallback_required: false, last_evidence_ref: null,
    updated_at: "2026-01-01T00:00:00.000Z"
  }, captured);
  const result = await repository.readOwnedApplicationWorkbench("app-public-1", candidateUuid);
  assert.equal(result?.applicationId, "app-public-1");
  assert.match(captured.sql ?? "", /a\.candidate_id = \$2::uuid/);
  assert.deepEqual(captured.values, ["app-public-1", candidateUuid]);
});

test("owner-scoped candidate read rejects malformed session identity before querying", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning(null, captured);
  const result = await repository.readCandidateStatusForOwner("not-a-uuid", "cand-public-123");
  assert.equal(result, null);
  assert.equal(captured.sql, undefined);
});

test("owner-scoped application read rejects malformed session identity before querying", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning(null, captured);
  const result = await repository.readOwnedApplicationWorkbench("app-public-1", "not-a-uuid");
  assert.equal(result, null);
  assert.equal(captured.sql, undefined);
});

test("document metadata listing is owner-scoped and never selects storage paths", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning({
    document_ref: "doc-public-1", document_type: "CV", display_name: "CV.pdf",
    mime_type: "application/pdf", file_size_bytes: "1024", document_status: "UPLOADED",
    verification_status: "PENDING", extraction_status: "NOT_STARTED",
    uploaded_at: "2026-01-01T00:00:00.000Z", storage_path: "must-not-be-returned"
  }, captured);
  const result = await repository.listDocumentMetadataForOwner(candidateUuid);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    documentRef: "doc-public-1", documentType: "CV", displayName: "CV.pdf",
    mimeType: "application/pdf", fileSizeBytes: 1024, documentStatus: "UPLOADED",
    verificationStatus: "PENDING", extractionStatus: "NOT_STARTED",
    uploadedAt: "2026-01-01T00:00:00.000Z"
  });
  assert.match(captured.sql ?? "", /candidate_id = \$1::uuid/);
  assert.match(captured.sql ?? "", /archived_at is null/);
  assert.match(captured.sql ?? "", /document_status <> 'DELETED'/);
  assert.doesNotMatch(captured.sql ?? "", /storage_path|storage_bucket|signed_url/i);
  assert.deepEqual(captured.values, [candidateUuid]);
  assert.doesNotMatch(JSON.stringify(result), /storage_path|must-not-be-returned/);
});

test("open document requests are owner-scoped and return only candidate-facing fields", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning({
    request_ref: "req-public-1", document_type: "ID_DOCUMENT",
    reason: "Please provide a clearer copy.", priority: "HIGH",
    due_at: "2026-02-01T00:00:00.000Z", created_at: "2026-01-01T00:00:00.000Z",
    candidate_id: otherUuid, application_id: "private-app-id"
  }, captured);
  const result = await repository.listOpenDocumentRequestsForOwner(candidateUuid);
  assert.deepEqual(result, [{
    requestRef: "req-public-1", documentType: "ID_DOCUMENT",
    reason: "Please provide a clearer copy.", priority: "HIGH",
    dueAt: "2026-02-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z"
  }]);
  assert.match(captured.sql ?? "", /candidate_id = \$1::uuid/);
  assert.match(captured.sql ?? "", /request_status = 'OPEN'/);
  assert.doesNotMatch(captured.sql ?? "", /candidate_id, application_id|application_id/i);
  assert.deepEqual(captured.values, [candidateUuid]);
  assert.doesNotMatch(JSON.stringify(result), /private-app-id|candidate_id|application_id/i);
});

test("document metadata and request reads reject malformed owner identities before querying", async () => {
  const captured: { sql?: string; values?: readonly unknown[] } = {};
  const repository = repositoryReturning(null, captured);
  assert.deepEqual(await repository.listDocumentMetadataForOwner("not-a-uuid"), []);
  assert.deepEqual(await repository.listOpenDocumentRequestsForOwner("not-a-uuid"), []);
  assert.equal(captured.sql, undefined);
});
