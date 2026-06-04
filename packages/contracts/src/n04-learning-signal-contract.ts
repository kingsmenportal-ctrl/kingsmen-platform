export type N04LearningSignal = {
  signalId: string;
  candidateId?: string;
  signalType:
    | "confusion"
    | "blocker"
    | "manual_override"
    | "route_outcome"
    | "document_issue"
    | "support_delay"
    | "candidate_harm"
    | "success";
  safeSummary: string;
  aiMaySuggestNotGovern: true;
  founderReviewRequired: boolean;
  evidenceId: string;
  createdAt: string;
  productionReady: false;
};