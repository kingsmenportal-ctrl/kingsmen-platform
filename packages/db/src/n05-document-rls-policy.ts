export const N05_DOCUMENT_RLS_BOUNDARIES = [
  { tableName: "document_types", candidateCanRead: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "document_requests", candidateCanReadOwn: true, candidateCanWriteOwnDraftOnly: false, publicAccessAllowed: false },
  { tableName: "candidate_documents", candidateCanReadOwn: true, candidateCanUploadOwn: true, candidateCanVerify: false, publicAccessAllowed: false },
  { tableName: "document_reviews", candidateCanReadOwnSafeSummary: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "document_ocr_fraud_reviews", candidateCanReadOwnSafeSummary: true, candidateCanWrite: false, publicAccessAllowed: false },
  { tableName: "document_evidence_links", candidateCanReadOwnSafeSummary: true, candidateCanWrite: false, publicAccessAllowed: false }
] as const;

export function assertN05DocumentRlsSafe() {
  for (const row of N05_DOCUMENT_RLS_BOUNDARIES) {
    if (row.publicAccessAllowed !== false) {
      throw new Error(`N05 document RLS blocked: public access not allowed for ${row.tableName}`);
    }
  }

  const documents = N05_DOCUMENT_RLS_BOUNDARIES.find((row) => row.tableName === "candidate_documents");
  if (!documents || documents.candidateCanVerify !== false) {
    throw new Error("N05 document RLS blocked: candidate cannot verify documents");
  }

  return true;
}