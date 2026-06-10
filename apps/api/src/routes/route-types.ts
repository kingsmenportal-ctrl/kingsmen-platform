export type RouteType =
  | "UNIVERSITY"
  | "TVET"
  | "SETA"
  | "LEARNERSHIP"
  | "BURSARY"
  | "ACCOMMODATION"
  | "EMPLOYER"
  | "PRIVATE_COLLEGE"
  | "NSFAS"
  | "CAO";

export type SourceConfidenceBand = "A" | "B" | "C" | "D";
export type RouteVerificationStatus = "VERIFIED" | "NEEDS_REVIEW" | "STALE" | "BLOCKED" | "RISK";
export type RouteAvailabilityStatus = "OPEN" | "CLOSED" | "FUTURE" | "UNKNOWN" | "MANUAL_CHECK_REQUIRED";
export type PortalHealthStatus = "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
export type RouteReadinessStatus = "NOT_READY" | "READY" | "MANUAL_REQUIRED" | "SOURCE_REVIEW_REQUIRED";

export interface RouteProvider {
  providerKey: string;
  providerName: string;
  providerType: string;
  province?: string;
  baseUrl?: string;
  defaultConfidenceBand: SourceConfidenceBand;
  verificationStatus: RouteVerificationStatus;
  publicSafe: boolean;
  privateProviderRequiresAccreditationCheck: boolean;
}

export interface RouteProgramme {
  programmeKey: string;
  programmeName: string;
  routeType: RouteType;
  qualificationType?: string;
  applicationMethod: "DIRECT_PORTAL" | "CAO" | "NSFAS" | "EMAIL" | "MANUAL" | "JOB_BOARD" | "UNKNOWN";
  sourceUrl?: string;
  sourceConfidenceBand: SourceConfidenceBand;
  routeStatus: RouteVerificationStatus;
  availabilityStatus: RouteAvailabilityStatus;
  eligibilitySummary: string;
}

export interface ApplicationWorkbenchItem {
  applicationId: string;
  candidateId: string;
  programmeKey?: string;
  workbenchRef: string;
  workbenchStatus: "NOT_READY" | "READY" | "WAITING" | "MANUAL_REQUIRED" | "SUBMITTED" | "COMPLETED" | "FAILED";
  routeReadinessStatus: RouteReadinessStatus;
  documentReadinessStatus: "MISSING" | "PARTIAL" | "READY" | "REVIEW_REQUIRED";
  sourceConfidenceBand: SourceConfidenceBand;
  portalHealthStatus: PortalHealthStatus;
  mapFallbackRequired: boolean;
  priorityScore: number;
  nextAction: string;
}