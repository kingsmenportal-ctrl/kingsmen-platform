import { randomUUID } from "node:crypto";

export type CandidateSessionMetadata = {
  deviceLabel?: string;
  deviceFingerprintHash?: string;
  ipHash?: string;
  userAgent?: string;
};

export type CandidateSessionPrincipal = {
  sessionId: string;
  candidateId: string;
  expiresAt: string;
};

type QueryResult<T> = { rows: T[]; rowCount: number | null };
type DbClient = {
  query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
  release(): void;
};
type DbPool = { connect(): Promise<DbClient> };

type SessionRow = {
  id: string;
  candidate_id: string;
  expires_at: string;
};

/**
 * Durable candidate session operations. This class only accepts token hashes;
 * callers must authenticate credentials before createSession and must not accept
 * candidateId from an untrusted request body.
 *
 * Each operation scopes backend RLS claims to a single transaction and resets
 * them automatically at transaction end. It does not implement password auth,
 * cookies, CSRF protection, or HTTP middleware.
 */
export class CandidateSessionRepository {
  constructor(private readonly pool: DbPool) {}

  async createSession(
    candidateId: string,
    tokenHash: string,
    expiresAt: string,
    metadata: CandidateSessionMetadata = {}
  ): Promise<CandidateSessionPrincipal> {
    if (!isUuid(candidateId)) throw new Error("Candidate identity is invalid.");
    if (!isTokenHash(tokenHash)) throw new Error("Session token hash is invalid.");
    const expiry = Date.parse(expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error("Session expiry must be in the future.");
    }

    return this.withBackendTransaction(async (client) => {
      const result = await client.query<SessionRow>(
        `insert into candidate_sessions
          (id, candidate_id, token_hash, expires_at, device_label,
           device_fingerprint_hash, ip_hash, user_agent)
         values ($1, $2::uuid, $3, $4::timestamptz, $5, $6, $7, $8)
         returning id::text, candidate_id::text, expires_at::text`,
        [
          randomUUID(), candidateId, tokenHash, new Date(expiry).toISOString(),
          boundedText(metadata.deviceLabel, 120) ?? "Unknown device",
          boundedText(metadata.deviceFingerprintHash, 256),
          boundedText(metadata.ipHash, 256),
          boundedText(metadata.userAgent, 512)
        ]
      );
      const row = result.rows[0];
      if (!row) throw new Error("SESSION_CREATE_FAILED");
      return { sessionId: row.id, candidateId: row.candidate_id, expiresAt: row.expires_at };
    });
  }

  async findActiveSession(tokenHash: string): Promise<CandidateSessionPrincipal | null> {
    if (!isTokenHash(tokenHash)) return null;
    return this.withBackendTransaction(async (client) => {
      const result = await client.query<SessionRow>(
        `update candidate_sessions
            set last_seen_at = now()
          where token_hash = $1
            and revoked_at is null
            and expires_at > now()
          returning id::text, candidate_id::text, expires_at::text`,
        [tokenHash]
      );
      const row = result.rows[0];
      return row ? { sessionId: row.id, candidateId: row.candidate_id, expiresAt: row.expires_at } : null;
    });
  }

  async revokeSession(tokenHash: string, reason: "LOGOUT" | "PASSWORD_RESET" | "ADMIN_REVOKE" | "SECURITY_EVENT" | "ACCOUNT_DISABLED"): Promise<boolean> {
    if (!isTokenHash(tokenHash)) return false;
    return this.withBackendTransaction(async (client) => {
      const result = await client.query(
        `update candidate_sessions
            set revoked_at = now(), revoke_reason = $2
          where token_hash = $1 and revoked_at is null`,
        [tokenHash, reason]
      );
      return result.rowCount === 1;
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
      try { await client.query("rollback"); } catch { /* Preserve the original failure. */ }
      throw error;
    } finally {
      client.release();
    }
  }
}

function isTokenHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}
