export type SourceConfidence = "LOW" | "MEDIUM" | "HIGH" | "OFFICIAL_VERIFIED";
export type PortalHealth = "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
export type EligibilityStatus = "ELIGIBLE" | "LIKELY_ELIGIBLE" | "NEEDS_REVIEW" | "BLOCKED" | "UNKNOWN";
export type ScoreBand = "PRIORITY" | "STRONG" | "VIABLE" | "REVIEW" | "RISK";

export type BlockedAiDecision =
  | "money"
  | "refunds"
  | "official_status"
  | "submissions"
  | "fraud"
  | "privacy"
  | "hard_blockers";

export interface CandidateDecisionSignals {
  signalRef: string;
  candidateRef: string;
  profileCompleteness: number;
  documentReadiness: number;
  academicFit: number;
  fundingNeed: number;
  accommodationNeed: number;
  urgencyScore: number;
  provincePreference?: string;
  sectorPreferences: string[];
  riskFlags: string[];
  evidenceRefs: string[];
  sourceConfidence: SourceConfidence;
}

export interface RouteOptionSignal {
  routeRef: string;
  routeSector: string;
  institutionRef?: string;
  sourceConfidence: SourceConfidence;
  portalHealth: PortalHealth;
  deadlineUrgency: number;
  documentFit: number;
  academicFit: number;
  fundingFit: number;
  accommodationFit: number;
  evidenceRefs: string[];
}

export interface EligibilityScreenResult {
  screenRef: string;
  candidateRef: string;
  routeRef: string;
  eligibilityStatus: EligibilityStatus;
  blockers: string[];
  missingDocuments: string[];
  reviewRequired: boolean;
  explanation: string;
  evidenceRefs: string[];
}

export interface RouteMatchCandidate {
  matchRef: string;
  candidateRef: string;
  routeRef: string;
  routeSector: string;
  institutionRef?: string;
  sourceConfidence: SourceConfidence;
  portalHealth: PortalHealth;
  matchScore: number;
  readinessScore: number;
  urgencyScore: number;
  evidenceRefs: string[];
  matchReasons: string[];
  riskReasons: string[];
}

export interface PlacementScore {
  placementRef: string;
  candidateRef: string;
  routeRef: string;
  academicScore: number;
  documentScore: number;
  deadlineScore: number;
  fundingScore: number;
  accommodationScore: number;
  sourceConfidenceScore: number;
  finalScore: number;
  scoreBand: ScoreBand;
  explanation: string;
  evidenceRefs: string[];
}

export interface RouteRecommendation {
  recommendationRef: string;
  candidateRef: string;
  routeRef: string;
  recommendationRank: number;
  recommendationStatus: "DRAFT" | "READY_FOR_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
  recommendationType: "ROUTE_OPTION" | "DOCUMENT_REQUEST" | "FALLBACK" | "URGENT_REVIEW" | "ACCOMMODATION" | "FUNDING" | "EMPLOYER_ROUTE";
  aiConfidence: SourceConfidence;
  humanReviewRequired: boolean;
  explanation: string;
  evidenceRefs: string[];
  sealedDetails: boolean;
}

export interface DestinyMap {
  destinyMapRef: string;
  candidateRef: string;
  mapStatus: "DRAFT" | "READY_FOR_REVIEW" | "PUBLISHED" | "ARCHIVED";
  freePreview: boolean;
  sealedExactTargets: boolean;
  summary: string;
  routeCount: number;
  sectorCoverage: string[];
  recommendationRefs: string[];
  evidenceRefs: string[];
}

export interface PhoenixFallbackPlan {
  phoenixRef: string;
  candidateRef: string;
  failedRouteRef?: string;
  fallbackStatus: "DRAFT" | "READY_FOR_REVIEW" | "APPROVED" | "REJECTED" | "EXECUTING" | "COMPLETED" | "FAILED";
  failureReason: string;
  newRouteRefs: string[];
  mapPackageRequired: boolean;
  falseRescueBlocked: boolean;
  humanReviewRequired: boolean;
  explanation: string;
  evidenceRefs: string[];
}