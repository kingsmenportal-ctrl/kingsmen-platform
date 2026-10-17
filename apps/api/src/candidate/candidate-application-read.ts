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
 * statement. Returns null when no verified identity exists and [] when a
 * verified candidate has no applications. Never accepts candidateId/publicRef
 * from a client. The caller must pass a server-verified Supabase Auth UUID.
 */
export async function listApplicationsForVerifiedAuthUser(
  database: CandidateApplicationDatabase,
  verifiedSupabaseUserId: string
): Promise<CandidateApplicationSummary[] | null> {
  if (
    typeof verifiedSupabaseUserId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verifiedSupabaseUserId)
  ) return null;

  const result = await database.query<{
    verified_candidate_id: string;
    application_id: string | null;
    route_type: string | null;
    route_name: string | null;
    institution_or_provider: string | null;
    current_state: string | null;
    source_confidence_band: string | null;
    portal_health: string | null;
    map_fallback_required: boolean | null;
    last_evidence_ref: string | null;
    updated_at: string | null;
  }>(
    `select candidate.id as verified_candidate_id,
            application.id as application_id,
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
       left join public.applications as application
         on application.candidate_id = candidate.id
      where link.supabase_user_id = $1::uuid
        and link.link_status = 'VERIFIED'
        and candidate.is_active = true
      order by application.updated_at desc nulls last, application.id asc nulls last
      limit 501`,
    [verifiedSupabaseUserId]
  );

  // Zero rows = no verified identity. One row with a null application ID =
  // verified candidate with no applications. Do not conflate authorization
  // failure with a genuinely empty list.
  if (result.rows.length === 0) return null;
  // The query deliberately fetches one row beyond the response cap. Never
  // silently return a partial tracker when a candidate exceeds that cap.
  if (result.rows.length > 500) {
    throw new Error("CANDIDATE_APPLICATION_RESULT_LIMIT_EXCEEDED");
  }
  const applicationRows = result.rows.filter((row) => row.application_id !== null);
  for (const row of applicationRows) {
    if (
      typeof row.verified_candidate_id !== "string" || !row.verified_candidate_id.trim() ||
      typeof row.application_id !== "string" || !row.application_id.trim() ||
      typeof row.route_type !== "string" || !row.route_type.trim() ||
      typeof row.route_name !== "string" || !row.route_name.trim() ||
      typeof row.current_state !== "string" || !row.current_state.trim() ||
      typeof row.source_confidence_band !== "string" || !row.source_confidence_band.trim() ||
      typeof row.portal_health !== "string" || !row.portal_health.trim() ||
      typeof row.map_fallback_required !== "boolean" ||
      typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at)) ||
      (row.institution_or_provider !== null && typeof row.institution_or_provider !== "string") ||
      (row.last_evidence_ref !== null && typeof row.last_evidence_ref !== "string")
    ) {
      // A malformed row must never be serialized as undefined or misleading data.
      throw new Error("CANDIDATE_APPLICATION_ROW_INVALID");
    }
  }

  return applicationRows.map((row) => ({
    applicationId: row.application_id!,
    routeType: row.route_type!,
    routeName: row.route_name!,
    institutionOrProvider: row.institution_or_provider,
    currentState: row.current_state!,
    sourceConfidenceBand: row.source_confidence_band!,
    portalHealth: row.portal_health!,
    mapFallbackRequired: row.map_fallback_required!,
    lastEvidenceRef: row.last_evidence_ref,
    updatedAt: row.updated_at!
  }));
}
