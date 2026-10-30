import type { GrowthCapReview } from "./governance-types";

export const STARTING_ACTIVE_CANDIDATE_CAP = 500;
export const REGISTERED_GROWTH_CAP_STAGES = [500, 1000, 5000, 10000, 25000] as const;

function nextRegisteredStage(current: number): number | null {
  const index = REGISTERED_GROWTH_CAP_STAGES.indexOf(current as (typeof REGISTERED_GROWTH_CAP_STAGES)[number]);
  if (index < 0) throw new Error("CURRENT_GROWTH_CAP_NOT_REGISTERED");
  return REGISTERED_GROWTH_CAP_STAGES[index + 1] || null;
}

export function createGrowthCapReview(input: {
  currentActiveCandidateCap?: number;
  requestedActiveCandidateCap: number;
  outcomeQualityEvidenceRefs: string[];
  riskSummary: string;
}): GrowthCapReview {
  const current = input.currentActiveCandidateCap ?? STARTING_ACTIVE_CANDIDATE_CAP;
  const next = nextRegisteredStage(current);
  if (next === null) throw new Error("NO_FURTHER_REGISTERED_GROWTH_STAGE");
  if (input.requestedActiveCandidateCap !== next) throw new Error("GROWTH_CAP_STAGE_OUT_OF_ORDER");
  if (!input.riskSummary.trim()) throw new Error("GROWTH_CAP_RISK_SUMMARY_REQUIRED");

  return {
    capReviewRef: "cap_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10),
    currentActiveCandidateCap: current,
    requestedActiveCandidateCap: input.requestedActiveCandidateCap,
    reviewStatus: "PENDING_REVIEW",
    outcomeQualityEvidenceRefs: [...input.outcomeQualityEvidenceRefs],
    riskSummary: input.riskSummary.trim()
  };
}

export function assertGrowthCapIncreaseAllowed(review: GrowthCapReview): void {
  const next = nextRegisteredStage(review.currentActiveCandidateCap);
  if (next === null || review.requestedActiveCandidateCap !== next) throw new Error("GROWTH_CAP_STAGE_OUT_OF_ORDER");
  if (review.outcomeQualityEvidenceRefs.length === 0) throw new Error("NO_GROWTH_CAP_INCREASE_WITHOUT_OUTCOME_QUALITY_EVIDENCE");
  if (review.operatorDecision !== "APPROVE") throw new Error("GROWTH_CAP_INCREASE_REQUIRES_OPERATOR_APPROVAL");
}
