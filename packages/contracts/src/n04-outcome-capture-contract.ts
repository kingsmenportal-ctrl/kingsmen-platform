export type N04OutcomeType =
  | "application_submitted"
  | "application_acknowledged"
  | "accepted"
  | "waitlisted"
  | "rejected"
  | "funding_awarded"
  | "interview_invited"
  | "placement_started"
  | "job_offer"
  | "registered"
  | "other";

export type N04OutcomeCapture = {
  outcomeId: string;
  candidateId: string;
  entityType: "application" | "funding" | "employment" | "learnership" | "support" | "other";
  entityId: string;
  outcomeType: N04OutcomeType;
  proofId: string;
  evidenceId: string;
  candidateVisible: true;
  publicStoryConsentId?: string;
  createdAt: string;
  productionReady: false;
};