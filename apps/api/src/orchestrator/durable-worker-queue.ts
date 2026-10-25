type JsonObject = Record<string, unknown>;
type PgQueryResult<T = Record<string, unknown>> = { rows: T[]; rowCount: number | null };
type PgPool = {
  query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<PgQueryResult<T>>;
  end(): Promise<void>;
};
type PgPoolConstructor = new (config: Record<string, unknown>) => PgPool;

export type DurableDispatch = {
  dispatch_ref: string;
  run_ref: string;
  step_ref: string;
  worker_code: string;
  queue_status: string;
  attempt_count: number;
  max_attempts: number;
  idempotency_key: string;
  payload: JsonObject;
  evidence_refs: string[];
  locked_by: string | null;
  lease_expires_at: string | null;
};

export type DurableWorkerResult = {
  dispatchRef: string;
  resultRef: string;
  workerStatus: "SUCCEEDED" | "FAILED" | "BLOCKED" | "NEEDS_APPROVAL" | "NEEDS_MANUAL" | "DUPLICATE";
  proposedState: "SAME" | "NEW" | "INTAKE_PENDING" | "EVALUATION_PENDING" | "DOCUMENT_PENDING" | "EXECUTION_PENDING" | "COMPLETED" | "FAILED";
  payload?: JsonObject;
  evidenceRefs: string[];
  failureClass?: "TRANSIENT" | "AUTHENTICATION" | "POLICY" | "INVALID_PAYLOAD" | "PORTAL_BLOCKED" | "DUPLICATE" | "UNKNOWN";
  failureCode?: string;
};

export type DurableRecoveryOutcome = {
  action?: string;
  duplicate?: boolean;
  dispatch_ref?: string;
  retry_at?: string;
  delay_seconds?: number;
  handoff_ref?: string;
  reason?: string;
};

/**
 * Thin database adapter for the N16 transactional RPCs. It deliberately does not
 * execute portal actions itself: worker-specific execution and state-transition
 * approval remain separate policy-controlled responsibilities.
 */
export class DurableWorkerQueue {
  private constructor(private readonly pool: PgPool) {}

  static fromEnvironment(): DurableWorkerQueue {
    const mode = process.env.KINGSMEN_TRUTH_VAULT_MODE ?? "memory";
    const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;
    if (mode !== "postgres") {
      throw new Error("N16_DURABLE_QUEUE_REQUIRES_POSTGRES_TRUTH_VAULT_MODE");
    }
    if (!databaseUrl) throw new Error("N16_DURABLE_QUEUE_DATABASE_URL_REQUIRED");
    const pg = require("pg") as { Pool: PgPoolConstructor };
    return new DurableWorkerQueue(new pg.Pool({
      connectionString: databaseUrl,
      max: Number(process.env.KINGSMEN_WORKER_DATABASE_POOL_MAX ?? 4),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
    }));
  }

  async claim(workerId: string, limit = 1, leaseSeconds = 60): Promise<DurableDispatch[]> {
    if (!workerId.trim()) throw new Error("N16_WORKER_ID_REQUIRED");
    const result = await this.pool.query<DurableDispatch>(
      "select * from public.n16_claim_dispatches($1, $2, $3)",
      [workerId, limit, leaseSeconds]
    );
    return result.rows;
  }

  async markSent(dispatchRef: string, workerId: string, leaseSeconds = 120): Promise<DurableDispatch> {
    const result = await this.pool.query<DurableDispatch>(
      "select * from public.n16_mark_dispatch_sent($1, $2, $3)",
      [dispatchRef, workerId, leaseSeconds]
    );
    if (!result.rows[0]) throw new Error("N16_SENT_DISPATCH_ROW_MISSING");
    return result.rows[0];
  }

  async recordResult(input: DurableWorkerResult): Promise<DurableRecoveryOutcome> {
    if (!input.dispatchRef.trim() || !input.resultRef.trim()) throw new Error("N16_RESULT_IDENTIFIERS_REQUIRED");
    if (input.evidenceRefs.length === 0) throw new Error("N16_RESULT_EVIDENCE_REQUIRED");
    const result = await this.pool.query<{ outcome: DurableRecoveryOutcome }>(
      `select public.n16_record_dispatch_result(
        $1, $2, $3, $4, $5::jsonb, $6::text[], $7, $8, $9, $10
      ) as outcome`,
      [
        input.dispatchRef, input.resultRef, input.workerStatus, input.proposedState,
        JSON.stringify(input.payload ?? {}), input.evidenceRefs, input.failureClass ?? null,
        input.failureCode ?? null, 2, 900
      ]
    );
    return result.rows[0]?.outcome ?? {};
  }

  async recoverExpiredSent(limit = 50): Promise<number> {
    const result = await this.pool.query<{ reconciled: number }>(
      "select public.n16_reconcile_expired_sent($1) as reconciled", [limit]
    );
    return Number(result.rows[0]?.reconciled ?? 0);
  }

  async deadLetterExhaustedLocked(limit = 50): Promise<number> {
    const result = await this.pool.query<{ dead_lettered: number }>(
      "select public.n16_deadletter_exhausted_locked($1) as dead_lettered", [limit]
    );
    return Number(result.rows[0]?.dead_lettered ?? 0);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
