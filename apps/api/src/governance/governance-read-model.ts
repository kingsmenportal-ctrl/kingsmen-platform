import type { GovernancePolicy, GrowthCapReview, HumanOverrideRequest, PolicyGateEvaluation } from "./governance-types";

export interface GovernanceReadModel {
  title: string;
  activePolicies: number;
  blockedGates: number;
  reviewRequiredGates: number;
  pendingOverrides: number;
  pendingGrowthCapReviews: number;
  doctrine: string[];
}

export function buildGovernanceReadModel(input: {
  policies: GovernancePolicy[];
  gateEvaluations: PolicyGateEvaluation[];
  overrideRequests: HumanOverrideRequest[];
  growthCapReviews: GrowthCapReview[];
}): GovernanceReadModel {
  return {
    title: "Kingsmen Governance / Policy Runtime",
    activePolicies: input.policies.filter((policy) => policy.policyStatus === "ACTIVE").length,
    blockedGates: input.gateEvaluations.filter((gate) => gate.gateStatus === "BLOCK").length,
    reviewRequiredGates: input.gateEvaluations.filter((gate) => gate.gateStatus === "REVIEW_REQUIRED").length,
    pendingOverrides: input.overrideRequests.filter((request) => request.overrideStatus === "PENDING_REVIEW").length,
    pendingGrowthCapReviews: input.growthCapReviews.filter((review) => review.reviewStatus === "PENDING_REVIEW").length,
    doctrine: [
      "Backend state machine controls flow.",
      "AI recommends and explains; it does not govern hard decisions.",
      "No silent override.",
      "No growth cap increase without outcome-quality evidence.",
      "All policy decisions require evidence/audit trail."
    ]
  };
}