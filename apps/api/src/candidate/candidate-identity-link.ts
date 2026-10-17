export interface CandidateIdentityQueryResult<T> {
  rows: T[];
}

export interface CandidateIdentityDatabase {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<CandidateIdentityQueryResult<T>>;
}

export interface VerifiedCandidateIdentity {
  candidateId: string;
  publicRef: string;
}

/**
 * Resolves only an explicit, backend-verified Supabase Auth UUID mapping.
 * This deliberately does not accept email, candidate-supplied IDs, or JWT
 * claims that have not already been verified by the identity provider.
 *
 * The database role/context must be established by the trusted backend.
 */
export async function resolveVerifiedCandidateIdentity(
  database: CandidateIdentityDatabase,
  verifiedSupabaseUserId: string
): Promise<VerifiedCandidateIdentity | null> {
  if (
    typeof verifiedSupabaseUserId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verifiedSupabaseUserId)
  ) {
    return null;
  }

  const result = await database.query<{
    candidate_id: string;
    public_ref: string;
  }>(
    `select link.candidate_id, candidate.public_ref
       from public.candidate_auth_identity_links as link
       join public.candidates as candidate
         on candidate.id = link.candidate_id
      where link.supabase_user_id = $1::uuid
        and link.link_status = 'VERIFIED'
        and candidate.is_active = true
      limit 2`,
    [verifiedSupabaseUserId]
  );

  // Unique constraints should prevent duplicates; fail closed if the schema
  // has drifted or a nonconforming database implementation is used.
  if (result.rows.length !== 1) return null;
  const row = result.rows[0];
  if (!row.candidate_id || !row.public_ref) return null;

  return { candidateId: row.candidate_id, publicRef: row.public_ref };
}
