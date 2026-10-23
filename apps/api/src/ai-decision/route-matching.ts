import type { CandidateDecisionSignals, RouteMatchCandidate, RouteOptionSignal } from "./ai-decision-types";
import { assertDecisionInputs } from "./decision-input-guard";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function portalPenalty(portalHealth: RouteOptionSignal["portalHealth"]): number {
  switch (portalHealth) {
    case "HEALTHY": return 0;
    case "DEGRADED": return 8;
    case "UNKNOWN": return 12;
    case "OTP_REQUIRED": return 18;
    case "CAPTCHA": return 24;
    case "BLOCKED": return 30;
    case "DOWN": return 35;
  }
}

function confidenceBoost(sourceConfidence: RouteOptionSignal["sourceConfidence"]): number {
  switch (sourceConfidence) {
    case "OFFICIAL_VERIFIED": return 15;
    case "HIGH": return 10;
    case "MEDIUM": return 3;
    case "LOW": return -12;
  }
}

export function calculateRouteMatch(input: {
  candidate: CandidateDecisionSignals;
  route: RouteOptionSignal;
}): RouteMatchCandidate {
  assertDecisionInputs(input.candidate, input.route);
  const academic = (input.candidate.academicFit + input.route.academicFit) / 2;
  const documents = (input.candidate.documentReadiness + input.route.documentFit) / 2;
  const funding = input.candidate.fundingNeed > 0 ? input.route.fundingFit : 50;
  const accommodation = input.candidate.accommodationNeed > 0 ? input.route.accommodationFit : 50;
  const urgency = Math.max(input.candidate.urgencyScore, input.route.deadlineUrgency);
  const score = clampScore((academic * 0.32) + (documents * 0.25) + (funding * 0.12) + (accommodation * 0.08) + (urgency * 0.08) + confidenceBoost(input.route.sourceConfidence) - portalPenalty(input.route.portalHealth));

  const reasons: string[] = [];
  if (academic >= 65) reasons.push("Academic fit supports this route.");
  if (documents >= 65) reasons.push("Document readiness supports this route.");
  if (funding >= 65) reasons.push("Funding fit is favourable.");
  if (accommodation >= 65) reasons.push("Accommodation fit is favourable.");
  if (input.route.sourceConfidence === "OFFICIAL_VERIFIED") reasons.push("Route source is official verified.");

  const riskReasons: string[] = [];
  if (input.route.sourceConfidence === "LOW") riskReasons.push("Source confidence is low.");
  if (input.route.portalHealth !== "HEALTHY") riskReasons.push(`Portal health requires caution: ${input.route.portalHealth}.`);

  return {
    matchRef: `match_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidate.candidateRef,
    routeRef: input.route.routeRef,
    routeSector: input.route.routeSector,
    institutionRef: input.route.institutionRef,
    sourceConfidence: input.route.sourceConfidence,
    portalHealth: input.route.portalHealth,
    matchScore: score,
    readinessScore: clampScore((documents * 0.7) + (input.candidate.profileCompleteness * 0.3)),
    urgencyScore: clampScore(urgency),
    evidenceRefs: [...input.candidate.evidenceRefs, ...input.route.evidenceRefs],
    matchReasons: reasons.length ? reasons : ["Route is possible but needs review."],
    riskReasons
  };
}

export function rankRouteMatches(matches: RouteMatchCandidate[]): RouteMatchCandidate[] {
  return [...matches].sort((a, b) => b.matchScore - a.matchScore || b.readinessScore - a.readinessScore);
}