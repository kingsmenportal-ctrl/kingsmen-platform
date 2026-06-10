import type { PolicyGateEvaluation, SourceConfidence } from "./governance-types";

const rank: Record<SourceConfidence, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  OFFICIAL_VERIFIED: 4
};

export function sourceConfidenceMeetsMinimum(actual: SourceConfidence, minimum: SourceConfidence): boolean {
  return rank[actual] >= rank[minimum];
}

export function evaluateSourceConfidence(input: {
  claimType: "official_claim" | "route_recommendation" | "general_note";
  sourceConfidence: SourceConfidence;
  evidenceRefs: string[];
}): PolicyGateEvaluation {
  const minimum: SourceConfidence = input.claimType === "official_claim" ? "OFFICIAL_VERIFIED" : input.claimType === "route_recommendation" ? "MEDIUM" : "LOW";

  const base = {
    gateRef: `gate_source_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    policyRef: "POL-SOURCE-001",
    gateName: "Source confidence gate",
    actionRequested: input.claimType,
    evidenceRefs: input.evidenceRefs,
    sourceConfidence: input.sourceConfidence,
    evaluatedBy: "system"
  };

  if (input.evidenceRefs.length === 0) {
    return { ...base, gateStatus: "BLOCK" as const, decisionSummary: "Source confidence gate blocked claim because evidence is missing.", blockedReason: "SOURCE_EVIDENCE_REQUIRED" };
  }

  if (!sourceConfidenceMeetsMinimum(input.sourceConfidence, minimum)) {
    return { ...base, gateStatus: "REVIEW_REQUIRED" as const, decisionSummary: `Source confidence requires review. Minimum ${minimum}, actual ${input.sourceConfidence}.`, reviewReason: "SOURCE_CONFIDENCE_BELOW_MINIMUM" };
  }

  return { ...base, gateStatus: "ALLOW" as const, decisionSummary: "Source confidence boundary passed." };
}