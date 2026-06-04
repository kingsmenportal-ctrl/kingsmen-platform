export const N06_ROUTE_RLS_BOUNDARIES = [
  { tableName: "route_gates", candidateCanRead: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "route_systems", candidateCanRead: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "route_universe", candidateCanRead: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "route_source_authorities", candidateCanReadSafeSummary: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "candidate_route_readiness", candidateCanReadOwn: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "cao_parent_applications", candidateCanReadOwn: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "cao_programme_choices", candidateCanReadOwn: true, candidateCanWrite: false, publicAccessAllowed: false }
] as const;

export function assertN06RouteRlsSafe() {
  for (const row of N06_ROUTE_RLS_BOUNDARIES) {
    if (row.publicAccessAllowed !== false) {
      throw new Error(`N06 route RLS blocked: public access not allowed for ${row.tableName}`);
    }
  }

  return true;
}