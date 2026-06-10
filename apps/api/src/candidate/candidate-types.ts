import type { KingsmenState } from "../state/state-machine";

export type ProfileConfidence = "LOW" | "MEDIUM" | "HIGH" | "REVIEW_REQUIRED";
export type CandidateChannel = "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL";
export type CandidateUrgency = "ROUTINE" | "IMPORTANT" | "URGENT" | "EMERGENCY";

export interface CandidateIdentity {
  candidateId: string;
  publicRef: string;
  displayName: string;
  email: string;
  phone?: string;
  currentState: KingsmenState;
  activePackageCode?: string;
}

export interface CandidateProfileFieldSource {
  fieldName: string;
  proposedValue?: string;
  valueSummary: string;
  sourceType: "CV" | "ID_DOCUMENT" | "CERTIFICATE" | "ACADEMIC_RECORD" | "PROOF_OF_ADDRESS" | "BANK_LETTER" | "USER_INPUT" | "OPERATOR" | "SYSTEM";
  sourceRef?: string;
  sourceEvidenceRef?: string;
  confidenceBand: ProfileConfidence;
  candidateConfirmed: boolean;
  operatorReviewRequired: boolean;
}

export interface CandidateSmartIntakeResult {
  candidateId: string;
  prefilledFields: CandidateProfileFieldSource[];
  missingFields: string[];
  reviewRequiredFields: CandidateProfileFieldSource[];
  nextAction: "CANDIDATE_REVIEW" | "ASK_MISSING_FIELDS" | "OPERATOR_REVIEW" | "READY";
}

export interface CandidatePortalSummary {
  candidate: CandidateIdentity;
  profileConfidence: ProfileConfidence;
  documentReadiness: "MISSING" | "PARTIAL" | "READY" | "REVIEW_REQUIRED";
  applicationReadiness: "NOT_READY" | "READY" | "MANUAL_REQUIRED";
  unreadMessages: number;
  openSupportTickets: number;
  outstandingAmountCents: number;
  lastUpdatedAt: string;
}