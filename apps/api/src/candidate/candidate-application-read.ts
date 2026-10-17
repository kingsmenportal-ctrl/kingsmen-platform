export interface CandidateApplicationQueryResult<T> {
  rows: T[];
}

export interface CandidateApplicationDatabase {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<CandidateApplicationQueryResult<T>>;
}

export interface CandidateApplicationSummary {
  applicationId: string;
  routeType: string;
  routeName: string;
  institutionOrProvider: string | null;
  currentState: string;
  sourceConfidenceBand: string;
  portalHealth: string;
  mapFallbackRequired: boolean;
  lastEvidenceRef: string | null;
  updatedAt: string;
}

/**
 * Reads applications through the verified Auth->candidate link in one SQL
 * statement. The caller must pass a Supabase Auth user UUID validated by
 * Supabase Auth on the server. Never accept candidateId/publicRef from a client.
 *
 * This is a read boundary only; it does not configure trusted DB session claims,
 * create identity links, or prove that PostgreSQL RLS is correctly deployed.
 */
export async function listApplicationsForVerifiedAuthUser(
  database: CandidateApplicationDatabase,
  verifiedSupabaseUserId: string
): Promise<CandidateApplicationSummary[] | null> {
  if (
    typeof verifiedSupabaseUserId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verifiedSupabaseUserId)
  ) {
    return null;
  }

  const result = await database.query<{
    application_id: string;
    route_type: string;
    route_name: string;
    institution_or_provider: string | null;
    current_state: string;
    source_confidence_band: string;
    portal_health: string;
    map_fallback_required: boolean;
    last_evidence_ref: string | null;
    updated_at: string;
  }>(
    `select application.id as application_id,
            application.route_type,
            application.route_name,
            application.institution_or_provider,
            application.current_state,
            application.source_confidence_band,
            application.portal_health,
            application.map_fallback_required,
            application.last_evidence_ref,
            application.updated_at
       from public.candidate_auth_identity_links as link
       join public.candidates as candidate
         on candidate.id = link.candidate_id
       join public.applications as application
         on application.candidate_id = candidate.id
      where link.supabase_user_id = $1::uuid
        and link.link_status = 'VERIFIED'
        and candidate.is_active = true
      order by application.updated_at desc, application.id asc
      limit 500`,
    [verifiedSupabaseUserId]
  );

  return result.rows.map((row) => ({
    applicationId: row.application_id,
    routeType: row.route_type,
    routeName: row.route_name,
    institutionOrProvider: row.institution_or_provider,
    currentState: row.current_state,
    sourceConfidenceBand: row.source_confidence_band,
    portalHealth: row.portal_health,
    mapFallbackRequired: row.map_fallback_required,
    lastEvidenceRef: row.last_evidence_ref,
    updatedAt: row.updated_at
  }));
}
