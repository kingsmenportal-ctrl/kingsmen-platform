export type PolicyDomain =
  | "STATE_MACHINE"
  | "AI_BOUNDARY"
  | "SUBMISSION"
  | "FINANCE_REFUND"
  | "POPIA_PRIVACY"
  | "SOURCE_CONFIDENCE"
  | "DOCUMENT_FRAUD"
  | "HUMAN_OVERRIDE"
  | "PHOENIX_FALLBACK"
  | "COMMUNICATION"
  | "GROWTH_CAP"
  | "ORACLE_LITE";

export type EnforcementLevel = "HARD_BLOCK" | "REVIEW_REQUIRED" | "WARN" | "ALLOW";
export type GateStatus = "ALLOW" | "WARN" | "REVIEW_REQUIRED" | "BLOCK";
export type SourceConfidence = "LOW" | "MEDIUM" | "HIGH" | "OFFICIAL_VERIFIED";

export interface GovernancePolicy {
  policyRef: string;
  policyDomain: PolicyDomain;
  policyName: string;
  policyVersion: string;
  enforcementLevel: EnforcementLevel;
  policyStatus: "ACTIVE" | "DRAFT" | "RETIRED";
  policyText: string;
  evidenceRequired: boolean;
  humanReviewRequired: boolean;
}

export interface PolicyGateEvaluation {
  gateRef: string;
  policyRef: string;
  candidateRef?: string;
  applicationRef?: string;
  routeRef?: string;
  commandRef?: string;
  workflowRef?: string;
  gateName: string;
  gateStatus: GateStatus;
  actionRequested: string;
  decisionSummary: string;
  blockedReason?: string;
  reviewReason?: string;
  evidenceRefs: string[];
  sourceConfidence: SourceConfidence;
  evaluatedBy: string;
}

export interface HumanOverrideRequest {
  overrideRef: string;
  requestedBy: string;
  candidateRef?: string;
  applicationRef?: string;
  routeRef?: string;
  policyRef: string;
  overrideType:
    | "STATE_TRANSITION"
    | "OFFICIAL_SUBMISSION"
    | "REFUND"
    | "FRAUD_REVIEW"
    | "PRIVACY_SENSITIVE_CHANGE"
    | "SOURCE_CONFIDENCE_EXCEPTION"
    | "PHOENIX_FALLBACK"
    | "COMMUNICATION_EXCEPTION"
    | "GROWTH_CAP_INCREASE"
    | "ORACLE_LITE_EXCEPTION";
  overrideStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
  overrideReason: string;
  riskSummary: string;
  evidenceRefs: string[];
  noSilentOverride: true;
}

export interface PrivacyConsentRecord {
  consentRef: string;
  candidateRef: string;
  consentType:
    | "PROFILE_PROCESSING"
    | "DOCUMENT_PROCESSING"
    | "APPLICATION_SUPPORT"
    | "COMMUNICATION_EMAIL"
    | "URGENT_WHATSAPP"
    | "PAYMENT_PROCESSING"
    | "PARTNER_ROUTE_SHARING"
    | "OUTCOME_LEARNING_SIGNAL";
  lawfulBasis: "CONSENT" | "CONTRACT" | "LEGAL_OBLIGATION" | "LEGITIMATE_INTEREST" | "VITAL_INTEREST" | "PUBLIC_TASK";
  consentStatus: "ACTIVE" | "REVOKED" | "EXPIRED" | "SUPERSEDED";
  evidenceRefs: string[];
}

export interface GrowthCapReview {
  capReviewRef: string;
  currentActiveCandidateCap: number;
  requestedActiveCandidateCap: number;
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
  outcomeQualityEvidenceRefs: string[];
  riskSummary: string;
  operatorDecision?: "APPROVE" | "REJECT" | "REQUEST_MORE_EVIDENCE";
}