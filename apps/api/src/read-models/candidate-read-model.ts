import type { KingsmenState } from "../state/state-machine";

export interface CandidateReadModel {
  candidateId: string;
  displayName: string;
  email: string;
  currentState: KingsmenState;
  activePackageCode?: string;
  profileConfidence: "LOW" | "MEDIUM" | "HIGH";
  documentReadiness: "MISSING" | "PARTIAL" | "READY" | "REVIEW_REQUIRED";
  applicationReadiness: "NOT_READY" | "READY" | "MANUAL_REQUIRED";
  lastUpdatedAt: string;
}

export interface ApplicationWorkbenchReadModel {
  applicationId: string;
  candidateId: string;
  routeType: "UNIVERSITY" | "TVET" | "SETA" | "LEARNERSHIP" | "BURSARY" | "ACCOMMODATION" | "EMPLOYER" | "PRIVATE_COLLEGE";
  sourceConfidenceBand: "A" | "B" | "C" | "D";
  currentState: KingsmenState;
  portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
  mapFallbackRequired: boolean;
  lastEvidenceRef?: string;
  lastUpdatedAt: string;
}