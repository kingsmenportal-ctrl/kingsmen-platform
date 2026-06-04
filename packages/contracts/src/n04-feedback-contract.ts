export type N04CandidateFeedback = {
  feedbackId: string;
  candidateId: string;
  journeyStage:
    | "intake"
    | "documents"
    | "payments"
    | "applications"
    | "support"
    | "outcomes"
    | "success_transition";
  rating?: 1 | 2 | 3 | 4 | 5;
  safeComment?: string;
  confusionSignal?: boolean;
  harmSignal?: boolean;
  evidenceId: string;
  createdAt: string;
  productionReady: false;
};