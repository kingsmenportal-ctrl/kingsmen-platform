export interface CandidateBackendQueryResult<T> {
  rows: T[];
  rowCount?: number | null;
}

export interface CandidateBackendTransactionClient {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<CandidateBackendQueryResult<T>>;
  release(): void;
}

export interface CandidateBackendPool {
  connect(): Promise<CandidateBackendTransactionClient>;
}

export interface CandidateBackendTransactionDatabase {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }>;
}

/**
 * Establishes trusted service context only inside a transaction on one checked
 * out PostgreSQL connection. Context values are constants, never HTTP input.
 * PostgreSQL set_config(..., true) makes each setting transaction-local.
 */
export async function withCandidateBackendTransaction<T>(
  pool: CandidateBackendPool,
  operation: (database: CandidateBackendTransactionDatabase) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query(
      "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
      ["service_role", "backend_api"]
    );

    const database: CandidateBackendTransactionDatabase = {
      query: async <R>(sql: string, values?: readonly unknown[]) => {
        const result = await client.query<R>(sql, values);
        return { rows: result.rows };
      }
    };
    const result = await operation(database);
    await client.query("COMMIT");
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original operation error; release the broken connection.
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
