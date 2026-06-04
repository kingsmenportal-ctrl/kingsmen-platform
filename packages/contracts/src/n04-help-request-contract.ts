export type N04HelpRequestCategory =
  | "account_access"
  | "profile_correction"
  | "documents"
  | "payment"
  | "application"
  | "deadline_risk"
  | "portal_blocker"
  | "manual_assistance"
  | "other";

export type N04HelpRequest = {
  helpRequestId: string;
  candidateId: string;
  category: N04HelpRequestCategory;
  urgency: "low" | "normal" | "high" | "critical";
  candidateHarmRisk: boolean;
  deadlineRisk: boolean;
  safeSummary: string;
  preferredChannel: "email" | "portal";
  evidenceId: string;
  auditId: string;
  createdAt: string;
  productionReady: false;
};