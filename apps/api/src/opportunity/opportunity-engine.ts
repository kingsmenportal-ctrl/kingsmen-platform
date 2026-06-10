export type SourceConfidence = "LOW" | "MEDIUM" | "HIGH" | "OFFICIAL_VERIFIED";
export type OpportunitySector =
  | "UNIVERSITY"
  | "TVET"
  | "SETA"
  | "QCTO"
  | "LEARNERSHIP"
  | "BURSARY"
  | "ACCOMMODATION"
  | "EMPLOYER"
  | "INTERNSHIP"
  | "NSFAS"
  | "CAO"
  | "PRIVATE_COLLEGE";

export interface SourceObservation {
  observationRef: string;
  sourceUrl: string;
  sourceTitle: string;
  sector: OpportunitySector;
  observedClaim: string;
  sourceConfidence: SourceConfidence;
  observationStatus: "DRAFT" | "NEEDS_REVIEW" | "VERIFIED" | "STALE" | "REJECTED" | "ARCHIVED";
  observedAt: string;
  staleAfter?: string;
  evidenceRefs: string[];
}

export interface OpportunityProvider {
  providerRef: string;
  providerName: string;
  providerType: string;
  sector: OpportunitySector;
  officialUrl?: string;
  accreditationStatus: "UNKNOWN" | "OFFICIAL_VERIFIED" | "NEEDS_REVIEW" | "REJECTED" | "NOT_APPLICABLE";
  sourceConfidence: SourceConfidence;
  safeToRecommend: boolean;
  evidenceRefs: string[];
}

export interface OpportunityProgramme {
  programmeRef: string;
  providerRef: string;
  programmeName: string;
  sector: OpportunitySector;
  openingStatus: "OPEN" | "CLOSED" | "UPCOMING" | "UNKNOWN" | "MANUAL_CHECK_REQUIRED";
  sourceConfidence: SourceConfidence;
  candidateFacingSafe: boolean;
  exactLink?: string;
  evidenceRefs: string[];
}

export interface CandidateOpportunityMatch {
  candidateMatchRef: string;
  candidateRef: string;
  programmeRef?: string;
  providerRef?: string;
  sector: OpportunitySector;
  matchStatus: "DRAFT" | "READY_FOR_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
  matchScore: number;
  sourceConfidence: SourceConfidence;
  humanReviewRequired: boolean;
  recommendationSummary: string;
  sealedExactTarget: boolean;
  evidenceRefs: string[];
}

const confidenceRank: Record<SourceConfidence, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  OFFICIAL_VERIFIED: 4
};

export const OPPORTUNITY_DOCTRINE = {
  NO_FAKE_DEADLINES: "No fake deadlines.",
  NO_FAKE_LINKS: "No fake links.",
  NO_FAKE_AVAILABILITY: "No fake programme availability.",
  NO_FAKE_ELIGIBILITY: "No fake eligibility claims.",
  NO_FAKE_GUARANTEES: "No fake acceptance or placement guarantees.",
  EVIDENCE_REQUIRED: "Every opportunity claim needs source confidence and evidence references.",
  STALE_REVIEW: "Stale observations must be marked for review before candidate-facing use.",
  PRIVATE_COLLEGE_CHECK: "Private colleges require CHE, DHET, SAQA, or QCTO verification before safe recommendation."
} as const;

export function assertOpportunityEvidence(evidenceRefs: string[]): void {
  if (evidenceRefs.length === 0) throw new Error("OPPORTUNITY_EVIDENCE_REQUIRED");
}

export function assertNoFakeOpportunityClaim(input: {
  claim: string;
  sourceUrl?: string;
  evidenceRefs: string[];
  sourceConfidence: SourceConfidence;
}): void {
  if (!input.claim.trim()) throw new Error("OPPORTUNITY_CLAIM_REQUIRED");
  assertOpportunityEvidence(input.evidenceRefs);
  if (!input.sourceUrl) throw new Error("NO_FAKE_LINKS_SOURCE_URL_REQUIRED");
  if (input.sourceConfidence === "LOW") throw new Error("LOW_CONFIDENCE_OPPORTUNITY_REQUIRES_REVIEW");
}

export function isStaleObservation(observation: SourceObservation, nowIso = new Date().toISOString()): boolean {
  if (!observation.staleAfter) return false;
  return new Date(nowIso).getTime() > new Date(observation.staleAfter).getTime();
}

export function normalizeSourceObservation(input: {
  sourceUrl: string;
  sourceTitle: string;
  sector: OpportunitySector;
  observedClaim: string;
  sourceConfidence?: SourceConfidence;
  staleAfter?: string;
  evidenceRefs: string[];
}): SourceObservation {
  assertNoFakeOpportunityClaim({
    claim: input.observedClaim,
    sourceUrl: input.sourceUrl,
    evidenceRefs: input.evidenceRefs,
    sourceConfidence: input.sourceConfidence ?? "MEDIUM"
  });

  const observation: SourceObservation = {
    observationRef: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    sector: input.sector,
    observedClaim: input.observedClaim,
    sourceConfidence: input.sourceConfidence ?? "MEDIUM",
    observationStatus: input.sourceConfidence === "OFFICIAL_VERIFIED" ? "VERIFIED" : "NEEDS_REVIEW",
    observedAt: new Date().toISOString(),
    staleAfter: input.staleAfter,
    evidenceRefs: input.evidenceRefs
  };

  if (isStaleObservation(observation)) return { ...observation, observationStatus: "STALE" };
  return observation;
}

export function sourceConfidenceMeetsMinimum(actual: SourceConfidence, minimum: SourceConfidence): boolean {
  return confidenceRank[actual] >= confidenceRank[minimum];
}

export function assertOfficialClaimConfidence(confidence: SourceConfidence): void {
  if (!sourceConfidenceMeetsMinimum(confidence, "OFFICIAL_VERIFIED")) {
    throw new Error("OFFICIAL_CLAIM_REQUIRES_OFFICIAL_VERIFIED_SOURCE");
  }
}

export function verifyProviderSafety(provider: OpportunityProvider): OpportunityProvider {
  assertOpportunityEvidence(provider.evidenceRefs);

  if (provider.sector === "PRIVATE_COLLEGE") {
    const safe = provider.accreditationStatus === "OFFICIAL_VERIFIED" && sourceConfidenceMeetsMinimum(provider.sourceConfidence, "HIGH");
    return { ...provider, safeToRecommend: safe };
  }

  const safe = provider.sourceConfidence !== "LOW" && provider.accreditationStatus !== "REJECTED";
  return { ...provider, safeToRecommend: safe };
}

export function verifyProgrammeCandidateFacingSafety(programme: OpportunityProgramme, provider: OpportunityProvider): OpportunityProgramme {
  assertOpportunityEvidence(programme.evidenceRefs);
  const safe =
    provider.safeToRecommend &&
    programme.openingStatus !== "UNKNOWN" &&
    programme.sourceConfidence !== "LOW" &&
    Boolean(programme.exactLink);

  return {
    ...programme,
    candidateFacingSafe: safe
  };
}

export function buildOpportunityMatch(input: {
  candidateRef: string;
  programme: OpportunityProgramme;
  provider: OpportunityProvider;
  fitScore: number;
  freePreview?: boolean;
  evidenceRefs: string[];
}): CandidateOpportunityMatch {
  assertOpportunityEvidence(input.evidenceRefs);
  const sourceConfidence = confidenceRank[input.programme.sourceConfidence] < confidenceRank[input.provider.sourceConfidence]
    ? input.programme.sourceConfidence
    : input.provider.sourceConfidence;

  const humanReviewRequired =
    !input.provider.safeToRecommend ||
    !input.programme.candidateFacingSafe ||
    !sourceConfidenceMeetsMinimum(sourceConfidence, "MEDIUM");

  const sealedExactTarget = Boolean(input.freePreview);

  return {
    candidateMatchRef: `opp_match_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    programmeRef: input.programme.programmeRef,
    providerRef: input.provider.providerRef,
    sector: input.programme.sector,
    matchStatus: humanReviewRequired ? "READY_FOR_REVIEW" : "APPROVED",
    matchScore: Math.max(0, Math.min(100, Math.round(input.fitScore * 100) / 100)),
    sourceConfidence,
    humanReviewRequired,
    recommendationSummary: sealedExactTarget
      ? "Free Destiny Map preview: sector direction only. Exact target/link remains sealed until package activation."
      : "Opportunity match prepared from verified provider and programme evidence.",
    sealedExactTarget,
    evidenceRefs: Array.from(new Set([...input.evidenceRefs, ...input.programme.evidenceRefs, ...input.provider.evidenceRefs]))
  };
}

export function createOpportunityAlert(input: {
  alertType: "OPENING" | "DEADLINE" | "STALE_SOURCE" | "SOURCE_CHANGE" | "REVIEW_REQUIRED" | "PORTAL_BLOCKED" | "RISK";
  sector: OpportunitySector;
  title: string;
  message: string;
  evidenceRefs: string[];
  candidateFacing?: boolean;
}) {
  assertOpportunityEvidence(input.evidenceRefs);
  return {
    alertRef: `opp_alert_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    alertStatus: "OPEN" as const,
    severity: input.alertType === "RISK" || input.alertType === "PORTAL_BLOCKED" ? "WARNING" : "WATCH",
    candidateFacing: input.candidateFacing ?? false,
    ...input
  };
}

export function opportunityEngineCannotSubmitOfficialApplication(): false {
  return false;
}