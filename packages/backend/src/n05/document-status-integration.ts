export type N05CandidateSafeDocumentStatus =
  | "requested"
  | "uploaded"
  | "review_in_progress"
  | "needs_more_info"
  | "verified"
  | "rejected"
  | "fraud_review"
  | "replaced"
  | "expired";

const STATUS_MAP: Record<string, N05CandidateSafeDocumentStatus> = {
  requested: "requested",
  uploaded: "uploaded",
  ocr_pending: "review_in_progress",
  ocr_reviewed: "review_in_progress",
  verification_pending: "review_in_progress",
  verified: "verified",
  rejected: "rejected",
  fraud_review: "fraud_review",
  replaced: "replaced",
  expired: "expired"
};

export function mapN05CandidateSafeDocumentStatus(status: string): N05CandidateSafeDocumentStatus {
  return STATUS_MAP[status] || "review_in_progress";
}

export function buildN05DocumentStatusIntegration(input: {
  documentId: string;
  candidateId: string;
  documentTypeCode: string;
  status: string;
  evidenceId?: string;
  auditId?: string;
}) {
  if (!input.documentId || !input.candidateId || !input.documentTypeCode) {
    throw new Error("N05 status integration requires documentId, candidateId, and documentTypeCode");
  }

  return {
    documentId: input.documentId,
    candidateId: input.candidateId,
    documentTypeCode: input.documentTypeCode,
    candidateSafeStatus: mapN05CandidateSafeDocumentStatus(input.status),
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    candidateCanVerify: false,
    candidateCanReject: false,
    candidateCanDelete: false,
    productionReady: false
  } as const;
}