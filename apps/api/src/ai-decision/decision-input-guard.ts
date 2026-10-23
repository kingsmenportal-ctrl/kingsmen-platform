import type { CandidateDecisionSignals, RouteOptionSignal } from "./ai-decision-types";

const CANDIDATE_SCORE_FIELDS = [
  "profileCompleteness",
  "documentReadiness",
  "academicFit",
  "fundingNeed",
  "accommodationNeed",
  "urgencyScore"
] as const;
const ROUTE_SCORE_FIELDS = [
  "deadlineUrgency",
  "documentFit",
  "academicFit",
  "fundingFit",
  "accommodationFit"
] as const;
const SOURCE_CONFIDENCE = ["LOW", "MEDIUM", "HIGH", "OFFICIAL_VERIFIED"] as const;
const PORTAL_HEALTH = ["HEALTHY", "DEGRADED", "BLOCKED", "CAPTCHA", "OTP_REQUIRED", "DOWN", "UNKNOWN"] as const;

function assertReference(value: string, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`AI_INPUT_INVALID_REFERENCE:${field}`);
  }
}
function assertScore(value: number, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`AI_INPUT_INVALID_SCORE:${field}`);
  }
}
function assertEvidenceRefs(value: string[], field: string): void {
  if (!Array.isArray(value) || value.length === 0 || value.some((ref) => typeof ref !== "string" || ref.trim().length === 0)) {
    throw new Error(`AI_INPUT_EVIDENCE_REQUIRED:${field}`);
  }
}
export function assertDecisionInputs(candidate: CandidateDecisionSignals, route: RouteOptionSignal): void {
  if (!candidate || !route) throw new Error("AI_INPUT_CANDIDATE_AND_ROUTE_REQUIRED");
  assertReference(candidate.candidateRef, "candidateRef");
  assertReference(candidate.signalRef, "signalRef");
  assertReference(route.routeRef, "routeRef");
  assertReference(route.routeSector, "routeSector");
  for (const field of CANDIDATE_SCORE_FIELDS) assertScore(candidate[field], field);
  for (const field of ROUTE_SCORE_FIELDS) assertScore(route[field], field);
  if (!SOURCE_CONFIDENCE.includes(candidate.sourceConfidence)) throw new Error("AI_INPUT_INVALID_SOURCE_CONFIDENCE:candidate");
  if (!SOURCE_CONFIDENCE.includes(route.sourceConfidence)) throw new Error("AI_INPUT_INVALID_SOURCE_CONFIDENCE:route");
  if (!PORTAL_HEALTH.includes(route.portalHealth)) throw new Error("AI_INPUT_INVALID_PORTAL_HEALTH");
  assertEvidenceRefs(candidate.evidenceRefs, "candidate");
  assertEvidenceRefs(route.evidenceRefs, "route");
}
