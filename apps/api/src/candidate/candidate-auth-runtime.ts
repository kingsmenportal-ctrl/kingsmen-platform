import { CandidateAuthService } from "./candidate-auth-service";
import { CandidateCredentialRepository } from "./candidate-credential-repository";
import { CandidateSessionRepository } from "./candidate-session-repository";

type PoolLike = {
  connect(): Promise<unknown>;
  end(): Promise<void>;
};
type PoolConstructor = new (config: Record<string, unknown>) => PoolLike;

export type CandidateAuthRuntime = {
  service: CandidateAuthService;
  close(): Promise<void>;
};

/**
 * Creates auth repositories only when durable PostgreSQL is explicitly enabled.
 * This intentionally does not fall back to in-memory authentication.
 */
export function createCandidateAuthRuntimeFromEnvironment(): CandidateAuthRuntime | null {
  const mode = process.env.KINGSMEN_TRUTH_VAULT_MODE ??
    (process.env.NODE_ENV === "production" ? "postgres" : "memory");
  const connectionString = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (mode !== "postgres" || !connectionString) return null;

  const pg = require("pg") as { Pool: PoolConstructor };
  const pool = new pg.Pool({
    connectionString,
    max: Number(process.env.KINGSMEN_AUTH_DATABASE_POOL_MAX ?? 4),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.NODE_ENV === "production" || process.env.KINGSMEN_DATABASE_SSL === "true"
      ? { rejectUnauthorized: true }
      : undefined
  });
  const dbPool = pool as unknown as ConstructorParameters<typeof CandidateCredentialRepository>[0];
  return {
    service: new CandidateAuthService(
      new CandidateCredentialRepository(dbPool),
      new CandidateSessionRepository(dbPool)
    ),
    close: () => pool.end()
  };
}
