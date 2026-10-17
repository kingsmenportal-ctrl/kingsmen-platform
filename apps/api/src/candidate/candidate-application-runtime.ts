import {
  withCandidateBackendTransaction,
  type CandidateBackendPool
} from "./candidate-backend-transaction";
import {
  listApplicationsForVerifiedAuthUser,
  type CandidateApplicationSummary
} from "./candidate-application-read";

/**
 * Production-oriented composition of the candidate application read boundary.
 * Caller must first validate the Supabase Auth session server-side and pass only
 * its verified user UUID. Database context is established by this module, not
 * by the caller or request.
 */
export async function readCandidateApplicationsInTrustedTransaction(
  pool: CandidateBackendPool,
  verifiedSupabaseUserId: string
): Promise<CandidateApplicationSummary[] | null> {
  return withCandidateBackendTransaction(pool, (database) =>
    listApplicationsForVerifiedAuthUser(database, verifiedSupabaseUserId)
  );
}
