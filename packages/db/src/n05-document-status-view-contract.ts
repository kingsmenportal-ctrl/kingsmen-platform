export type N05DocumentStatusViewRow = {
  documentId: string;
  candidateId: string;
  documentTypeCode: string;
  displayName: string;
  status: string;
  evidenceId?: string;
  auditId?: string;
  candidateSafe: true;
  productionReady: false;
};

export const N05_DOCUMENT_STATUS_VIEW = {
  viewName: "candidate_document_status_view",
  candidateSafe: true,
  candidateOwnDataOnly: true,
  candidateVerificationBlocked: true,
  productionReady: false
} as const;