export function assertN04FeedbackLearningSafe(input: {
  signalType?: string;
  harmSignal?: boolean;
  confusionSignal?: boolean;
  aiDecisionAuthority?: boolean;
  evidenceId?: string;
  founderReviewRequired?: boolean;
}) {
  if (!input.evidenceId) {
    throw new Error("N04 feedback/learning signal requires evidence");
  }

  if (input.aiDecisionAuthority === true) {
    throw new Error("N04 learning blocked: AI may suggest, not govern");
  }

  if ((input.harmSignal === true || input.signalType === "candidate_harm") && input.founderReviewRequired !== true) {
    throw new Error("N04 harm learning signal requires founder review");
  }

  if (input.confusionSignal === true && input.founderReviewRequired !== true) {
    throw new Error("N04 confusion signal requires review before policy change");
  }

  return true;
}