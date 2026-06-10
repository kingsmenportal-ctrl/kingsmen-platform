import type { SourceConfidenceBand } from "./route-types";

export interface SourceConfidenceInput {
  sourceUrl?: string;
  sourceName: string;
  isOfficialSource: boolean;
  verifiedRecently: boolean;
  candidateFacing: boolean;
}

export interface SourceConfidenceDecision {
  band: SourceConfidenceBand;
  canShowCandidate: boolean;
  requiresManualReview: boolean;
  reasons: string[];
}

export function evaluateSourceConfidence(input: SourceConfidenceInput): SourceConfidenceDecision {
  const reasons: string[] = [];

  if (!input.sourceUrl) {
    return {
      band: "D",
      canShowCandidate: false,
      requiresManualReview: true,
      reasons: ["Missing source URL."]
    };
  }

  if (input.isOfficialSource && input.verifiedRecently) {
    reasons.push("Official and recently verified source.");
    return {
      band: "A",
      canShowCandidate: true,
      requiresManualReview: false,
      reasons
    };
  }

  if (input.isOfficialSource) {
    reasons.push("Official source but freshness check is required.");
    return {
      band: "B",
      canShowCandidate: !input.candidateFacing,
      requiresManualReview: input.candidateFacing,
      reasons
    };
  }

  reasons.push("Unverified or third-party source requires manual review.");

  return {
    band: "C",
    canShowCandidate: false,
    requiresManualReview: true,
    reasons
  };
}

export function assertCandidateFacingSource(decision: SourceConfidenceDecision): void {
  if (!decision.canShowCandidate || decision.requiresManualReview) {
    throw new Error(`Source cannot be shown to candidate yet: ${decision.reasons.join(" ")}`);
  }
}