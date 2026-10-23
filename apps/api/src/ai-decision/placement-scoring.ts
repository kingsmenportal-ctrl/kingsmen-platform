import type { CandidateDecisionSignals, PlacementScore, RouteOptionSignal, ScoreBand } from "./ai-decision-types";
import { assertDecisionInputs } from "./decision-input-guard";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function sourceConfidenceScore(confidence: RouteOptionSignal["sourceConfidence"]): number {
  switch (confidence) {
    case "OFFICIAL_VERIFIED": return 100;
    case "HIGH": return 82;
    case "MEDIUM": return 58;
    case "LOW": return 25;
  }
}

function band(finalScore: number): ScoreBand {
  if (finalScore >= 82) return "PRIORITY";
  if (finalScore >= 70) return "STRONG";
  if (finalScore >= 55) return "VIABLE";
  if (finalScore >= 40) return "REVIEW";
  return "RISK";
}

export function calculatePlacementScore(input: {
  candidate: CandidateDecisionSignals;
  route: RouteOptionSignal;
}): PlacementScore {
  assertDecisionInputs(input.candidate, input.route);
  const academicScore = clampScore((input.candidate.academicFit + input.route.academicFit) / 2);
  const documentScore = clampScore((input.candidate.documentReadiness + input.route.documentFit) / 2);
  const deadlineScore = clampScore(input.route.deadlineUrgency);
  const fundingScore = clampScore(input.route.fundingFit);
  const accommodationScore = clampScore(input.route.accommodationFit);
  const sourceScore = sourceConfidenceScore(input.route.sourceConfidence);

  const finalScore = clampScore(
    academicScore * 0.30 +
    documentScore * 0.25 +
    deadlineScore * 0.12 +
    fundingScore * 0.10 +
    accommodationScore * 0.08 +
    sourceScore * 0.15
  );

  return {
    placementRef: `place_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidate.candidateRef,
    routeRef: input.route.routeRef,
    academicScore,
    documentScore,
    deadlineScore,
    fundingScore,
    accommodationScore,
    sourceConfidenceScore: sourceScore,
    finalScore,
    scoreBand: band(finalScore),
    explanation: `Placement score is ${finalScore}/100 with band ${band(finalScore)}. Score combines academic fit, document readiness, deadline urgency, funding/accommodation fit, and source confidence.`,
    evidenceRefs: [...input.candidate.evidenceRefs, ...input.route.evidenceRefs]
  };
}