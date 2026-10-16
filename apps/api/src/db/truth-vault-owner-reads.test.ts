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
