import type { BlockedAiDecision, RouteRecommendation } from "./ai-decision-types";

export const AI_BLOCKED_DECISIONS: readonly BlockedAiDecision[] = [
  "money",
  "refunds",
  "official_status",
  "submissions",
  "fraud",
  "privacy",
  "hard_blockers"
] as const;

export const AI_DECISION_DOCTRINE = {
  RECOMMENDATION_ONLY: "AI may suggest but must not govern money, refunds, official status, submissions, fraud, privacy, or hard blockers.",
  NO_FAKE_GUARANTEES: "No fake guarantees.",
  NO_SILENT_LEARNING: "No silent learning.",
  NO_UNCONTROLLED_RL: "No uncontrolled reinforcement learning.",
  NO_PHOENIX_FALSE_RESCUE: "No Phoenix false rescue.",
  EVIDENCE_REQUIRED: "AI recommendations require source confidence and evidence references."
} as const;

export function assertAiActionAllowed(action: string): void {
  const normalized = action.toLowerCase().replace(/[\s-]+/g, "_") as BlockedAiDecision;
  if (AI_BLOCKED_DECISIONS.includes(normalized)) {
    throw new Error(`AI_ACTION_BLOCKED: AI cannot govern ${normalized}.`);
  }
}

export function assertRecommendationEvidence(recommendation: RouteRecommendation): void {
  if (!recommendation.explanation.trim()) {
    throw new Error("RECOMMENDATION_EXPLANATION_REQUIRED");
  }
  if (recommendation.evidenceRefs.length === 0) {
    throw new Error("RECOMMENDATION_EVIDENCE_REQUIRED");
  }
  if (recommendation.aiConfidence === "LOW") {
    throw new Error("LOW_CONFIDENCE_RECOMMENDATION_REQUIRES_REVIEW");
  }
}

export function mustRequireHumanReview(recommendation: RouteRecommendation): boolean {
  return recommendation.humanReviewRequired || recommendation.aiConfidence !== "OFFICIAL_VERIFIED";
}

export function aiCanSubmitOfficialApplication(): false {
  return false;
}

export function aiCanApproveRefund(): false {
  return false;
}

export function aiCanConfirmFraud(): false {
  return false;
}