import { buildEvidenceRecord, type EvidenceLedgerInput } from "../evidence/evidence-ledger";
import { createWorkerHeartbeat } from "../heartbeat/worker-heartbeat";
import { createClaim } from "../idempotency/idempotency";

export interface TruthVaultWriteResult {
  ok: boolean;
  ref: string;
  message: string;
}

export class TruthVaultRepository {
  createEvidence(input: EvidenceLedgerInput): TruthVaultWriteResult {
    const record = buildEvidenceRecord(input);

    return {
      ok: true,
      ref: record.evidenceRef,
      message: "Evidence record prepared for PostgreSQL persistence."
    };
  }

  createIdempotencyClaim(input: {
    idempotencyKey: string;
    commandId?: string;
    correlationId: string;
    ttlHours?: number;
  }): TruthVaultWriteResult {
    const claim = createClaim(input);

    return {
      ok: true,
      ref: claim.idempotencyKey,
      message: "Idempotency claim prepared for PostgreSQL persistence."
    };
  }

  createHeartbeat(input: {
    workerCode: string;
    workflowRunId?: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }): TruthVaultWriteResult {
    const heartbeat = createWorkerHeartbeat(input);

    return {
      ok: true,
      ref: `${heartbeat.workerCode}:${heartbeat.correlationId}`,
      message: "Worker heartbeat prepared for PostgreSQL persistence."
    };
  }
}