import { verifyCandidatePassword } from "./candidate-password";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

type QueryResult<T> = { rows: T[]; rowCount: number | null };
type DbClient = {
  query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
  release(): void;
};
type DbPool = { connect(): Promise<DbClient> };

type CredentialRow = {
  candidate_id: string;
  password_hash: string;
  auth_status: "PENDING" | "ACTIVE" | "LOCKED" | "RECOVERY_REQUIRED" | "DISABLED";
  failed_login_attempts: number;
  locked_until: string | null;
  candidate_active: boolean;
};

export type CandidateCredentialAuthResult =
  | { ok: true; candidateId: string }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "ACCOUNT_UNAVAILABLE" | "ACCOUNT_LOCKED" };

export type CandidateCredentialAuthOptions = {
  maxFailedAttempts?: number;
  lockDurationMinutes?: number;
};

/**
 * Verifies existing candidate credentials only. This does not create accounts,
 * issue session tokens, or expose account-existence information to callers.
 * Callers should return a generic failure message for all unsuccessful results.
 */
export class CandidateCredentialRepository {
  constructor(
    private readonly pool: DbPool,
    private readonly options: CandidateCredentialAuthOptions = {}
  ) {}

  async authenticate(email: string, password: string): Promise<CandidateCredentialAuthResult> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== "string" || password.length === 0 || password.length > 1024) {
      return { ok: false, reason: "INVALID_CREDENTIALS" };
    }

    return this.withBackendTransaction(async (client) => {
      const result = await client.query<CredentialRow>(
        `select cc.candidate_id::text, cc.password_hash, cc.auth_status,
                cc.failed_login_attempts, cc.locked_until::text,
                c.is_active as candidate_active
           from candidate_credentials cc
           join candidates c on c.id = cc.candidate_id
          where lower(c.email) = $1
          for update of cc`,
        [normalizedEmail]
      );
      const credential = result.rows[0];
      if (!credential) return { ok: false, reason: "INVALID_CREDENTIALS" };

      const now = Date.now();
      const lockedUntil = credential.locked_until ? Date.parse(credential.locked_until) : NaN;
      if (credential.auth_status === "LOCKED") {
        if (Number.isFinite(lockedUntil) && lockedUntil > now) {
          return { ok: false, reason: "ACCOUNT_LOCKED" };
        }
        // An expired temporary lock is cleared transactionally before checking
        // the password again. Permanent lock states should use locked_until NULL
        // and be handled by an explicit recovery process, not auto-unlocked.
        if (Number.isFinite(lockedUntil)) {
          await client.query(
            `update candidate_credentials
                set auth_status = 'ACTIVE', failed_login_attempts = 0,
                    locked_until = null, updated_at = now()
              where candidate_id = $1::uuid and auth_status = 'LOCKED'`,
            [credential.candidate_id]
          );
          credential.auth_status = "ACTIVE";
          credential.failed_login_attempts = 0;
          credential.locked_until = null;
        } else {
          return { ok: false, reason: "ACCOUNT_LOCKED" };
        }
      }
      if (credential.auth_status !== "ACTIVE" || !credential.candidate_active) {
        return { ok: false, reason: "ACCOUNT_UNAVAILABLE" };
      }

      const passwordMatches = await verifyCandidatePassword(password, credential.password_hash);
      if (!passwordMatches) {
        const maxAttempts = positiveInteger(this.options.maxFailedAttempts, MAX_FAILED_ATTEMPTS);
        const lockMinutes = positiveInteger(this.options.lockDurationMinutes, LOCK_DURATION_MINUTES);
        const nextAttempts = credential.failed_login_attempts + 1;
        if (nextAttempts >= maxAttempts) {
          await client.query(
            `update candidate_credentials
                set auth_status = 'LOCKED',
                    failed_login_attempts = $2,
                    locked_until = now() + ($3::integer * interval '1 minute'),
                    updated_at = now()
              where candidate_id = $1::uuid`,
            [credential.candidate_id, nextAttempts, lockMinutes]
          );
          return { ok: false, reason: "ACCOUNT_LOCKED" };
        }
        await client.query(
          `update candidate_credentials
              set failed_login_attempts = $2, updated_at = now()
            where candidate_id = $1::uuid`,
          [credential.candidate_id, nextAttempts]
        );
        return { ok: false, reason: "INVALID_CREDENTIALS" };
      }

      await client.query(
        `update candidate_credentials
            set failed_login_attempts = 0, locked_until = null, updated_at = now()
          where candidate_id = $1::uuid`,
        [credential.candidate_id]
      );
      return { ok: true, candidateId: credential.candidate_id };
    });
  }

  private async withBackendTransaction<T>(operation: (client: DbClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query("select set_config('app.kingsmen_role', 'service_role', true)");
      await client.query("select set_config('app.service_context', 'backend_api', true)");
      const result = await operation(client);
      await client.query("commit");
      return result;
    } catch (error) {
      try { await client.query("rollback"); } catch { /* Preserve original error. */ }
      throw error;
    } finally {
      client.release();
    }
  }
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 10080
    ? value
    : fallback;
}
