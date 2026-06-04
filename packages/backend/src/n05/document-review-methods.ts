import { assertN05DocumentAuthoritySafe } from "./document-authority-policy";

export type N05DocumentReviewDecision = {
  documentId: string;
  candidateId: string;
  reviewStatus: "verified" | "rejected" | "needs_more_info" | "fraud_review";
  proofId: string;
  evidenceId: string;
  auditId: string;
  safeNotes?: string;
};

export function buildN05DocumentReviewDecision(input: N05DocumentReviewDecision) {
  assertN05DocumentAuthoritySafe({
    actorType: "operator",
    action: input.reviewStatus === "verified" ? "verify_document" : "reject_document",
    proofId: input.proofId,
    evidenceId: input.evidenceId,
    auditId: input.auditId
  });

  if (!input.documentId || !input.candidateId) {
    throw new Error("N05 review decision requires documentId and candidateId");
  }

  return {
    ...input,
    productionReady: false,
    createdAt: new Date().toISOString()
  } as const;
}

export function assertCandidateCannotReviewDocument(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  action: "approve" | "reject" | "verify" | "delete" | "clear_fraud" | "view";
}) {
  if (input.actorType === "candidate" && ["approve", "reject", "verify", "delete", "clear_fraud"].includes(input.action)) {
    throw new Error(`N05 candidate review authority blocked: ${input.action}`);
  }

  return true;
}