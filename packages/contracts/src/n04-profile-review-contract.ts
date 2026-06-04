export type N04ProfileReviewDecision = {
  reviewId: string;
  correctionId: string;
  reviewerActorType: "founder" | "operator" | "system";
  decision: "approve" | "reject" | "request_more_info";
  reason: string;
  auditId: string;
  oldValuePreserved: true;
  silentOverwriteBlocked: true;
  createdAt: string;
};