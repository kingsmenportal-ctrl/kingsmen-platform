import type { GrowthCapReview } from "./governance-types";

export const STARTING_ACTIVE_CANDIDATE_CAP = 500;

export function createGrowthCapReview(input: {
  currentActiveCandidateCap?: number;
  requestedActiveCandidateCap: number;
  outcomeQualityEvidenceRefs: string[];
  riskSummary: string;
}): GrowthCapReview {
  const current = input.currentActiveCandidateCap ?? STARTING_ACTIVE_CANDIDATE_CAP;
  if (input.requestedActiveCandidateCap <= current) {
    throw new Error("GROWTH_CAP_REQUEST_MUST_INCREASE_CAP");
  }

  return {
    capReviewRef: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    currentActiveCandidateCap: current,
    requestedActiveCandidateCap: input.requestedActiveCandidateCap,
    reviewStatus: "PENDING_REVIEW",
    outcomeQualityEvidenceRefs: input.outcomeQualityEvidenceRefs,
    riskSummary: input.riskSummary
  };
}

export function assertGrowthCapIncreaseAllowed(review: GrowthCapReview): void {
  if (review.outcomeQualityEvidenceRefs.length === 0) {
    throw new Error("NO_GROWTH_CAP_INCREASE_WITHOUT_OUTCOME_QUALITY_EVIDENCE");
  }
  if (review.operatorDecision !== "APPROVE") {
    throw new Error("GROWTH_CAP_INCREASE_REQUIRES_OPERATOR_APPROVAL");
  }
}