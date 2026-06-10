import type { DestinyMap, RouteRecommendation } from "./ai-decision-types";

export function buildDestinyMap(input: {
  candidateRef: string;
  recommendations: RouteRecommendation[];
  freePreview: boolean;
}): DestinyMap {
  const approvedOrReviewable = input.recommendations.filter((recommendation) =>
    recommendation.recommendationStatus === "READY_FOR_REVIEW" || recommendation.recommendationStatus === "APPROVED"
  );

  const sealedExactTargets = input.freePreview || approvedOrReviewable.some((recommendation) => recommendation.sealedDetails);

  return {
    destinyMapRef: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    mapStatus: "READY_FOR_REVIEW",
    freePreview: input.freePreview,
    sealedExactTargets,
    summary: input.freePreview
      ? "Free Destiny Map preview: all-sector direction only. Exact targets, application links, and manual route plans remain sealed until package activation."
      : "Paid Destiny Map: route recommendations prepared for human review and candidate-facing execution.",
    routeCount: approvedOrReviewable.length,
    sectorCoverage: Array.from(new Set(approvedOrReviewable.map((recommendation) => recommendation.recommendationType))),
    recommendationRefs: approvedOrReviewable.map((recommendation) => recommendation.recommendationRef),
    evidenceRefs: Array.from(new Set(approvedOrReviewable.flatMap((recommendation) => recommendation.evidenceRefs)))
  };
}

export function assertDestinyMapDoesNotExposeSealedTargets(map: DestinyMap): void {
  if (map.freePreview && !map.sealedExactTargets) {
    throw new Error("FREE_DESTINY_MAP_MUST_SEAL_EXACT_TARGETS");
  }
}