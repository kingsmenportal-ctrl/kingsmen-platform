import type { PlacementScore, RouteMatchCandidate, RouteRecommendation } from "./ai-decision-types";
import { assertRecommendationEvidence } from "./ai-boundary-policy";

export function buildRouteRecommendation(input: {
  candidateRef: string;
  routeRef: string;
  rank: number;
  match: RouteMatchCandidate;
  placement: PlacementScore;
  sealedDetails?: boolean;
}): RouteRecommendation {
  const needsHumanReview =
    input.match.sourceConfidence !== "OFFICIAL_VERIFIED" ||
    input.placement.scoreBand === "REVIEW" ||
    input.placement.scoreBand === "RISK" ||
    input.match.riskReasons.length > 0;

  const recommendation: RouteRecommendation = {
    recommendationRef: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    routeRef: input.routeRef,
    recommendationRank: input.rank,
    recommendationStatus: "READY_FOR_REVIEW",
    recommendationType: "ROUTE_OPTION",
    aiConfidence: input.match.sourceConfidence,
    humanReviewRequired: needsHumanReview,
    explanation: [
      `Route ${input.routeRef} is ranked #${input.rank}.`,
      `Match score: ${input.match.matchScore}/100.`,
      `Placement band: ${input.placement.scoreBand}.`,
      input.match.matchReasons.join(" "),
      input.match.riskReasons.length ? `Risks: ${input.match.riskReasons.join(" ")}` : "No immediate route risk reason was flagged by rules."
    ].join(" "),
    evidenceRefs: Array.from(new Set([...input.match.evidenceRefs, ...input.placement.evidenceRefs])),
    sealedDetails: input.sealedDetails ?? false
  };

  assertRecommendationEvidence(recommendation);
  return recommendation;
}

export function explainRecommendationForCandidate(recommendation: RouteRecommendation): string {
  const sealed = recommendation.sealedDetails
    ? "Exact targets and direct application links are sealed until package activation."
    : "Exact route details may be shown if package and review rules allow it.";

  return `${recommendation.explanation} ${sealed} Human review required: ${recommendation.humanReviewRequired ? "yes" : "no"}.`;
}