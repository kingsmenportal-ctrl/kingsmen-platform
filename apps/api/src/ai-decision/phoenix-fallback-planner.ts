import type { PhoenixFallbackPlan, RouteMatchCandidate } from "./ai-decision-types";

export function buildPhoenixFallbackPlan(input: {
  candidateRef: string;
  failedRouteRef?: string;
  failureReason: string;
  fallbackMatches: RouteMatchCandidate[];
  evidenceRefs: string[];
}): PhoenixFallbackPlan {
  if (!input.failureReason.trim()) throw new Error("Phoenix fallback requires a failure reason.");
  if (input.fallbackMatches.length === 0) throw new Error("Phoenix fallback cannot claim rescue without fallback route candidates.");

  const usableMatches = input.fallbackMatches
    .filter((match) => match.matchScore >= 40 && match.sourceConfidence !== "LOW")
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  if (usableMatches.length === 0) {
    throw new Error("NO_PHOENIX_FALSE_RESCUE: no evidence-backed fallback route is strong enough.");
  }

  return {
    phoenixRef: `phoenix_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    failedRouteRef: input.failedRouteRef,
    fallbackStatus: "READY_FOR_REVIEW",
    failureReason: input.failureReason,
    newRouteRefs: usableMatches.map((match) => match.routeRef),
    mapPackageRequired: true,
    falseRescueBlocked: true,
    humanReviewRequired: true,
    explanation: `Phoenix fallback prepared from ${usableMatches.length} evidence-backed alternative route(s). Human review is required before execution.`,
    evidenceRefs: Array.from(new Set([...input.evidenceRefs, ...usableMatches.flatMap((match) => match.evidenceRefs)]))
  };
}