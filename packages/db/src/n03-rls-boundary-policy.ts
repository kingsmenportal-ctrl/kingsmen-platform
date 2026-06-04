export const N03_RLS_BOUNDARIES = [
  { tableName: "candidates", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: true, publicAccessAllowed: false },
  { tableName: "service_orders", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false },
  { tableName: "payment_events", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false },
  { tableName: "applications", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: true, publicAccessAllowed: false },
  { tableName: "application_choices", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: true, publicAccessAllowed: false },
  { tableName: "candidate_documents", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: true, publicAccessAllowed: false },
  { tableName: "evidence_ledger", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false },
  { tableName: "audit_events", candidateCanReadOwn: false, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false },
  { tableName: "source_authorities", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false },
  { tableName: "outcomes", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false }
] as const;

export function assertN03RlsBoundarySafe() {
  for (const row of N03_RLS_BOUNDARIES) {
    if (row.publicAccessAllowed !== false) {
      throw new Error(`Public access blocked for ${row.tableName}`);
    }
  }
  return true;
}