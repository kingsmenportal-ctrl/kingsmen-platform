export type LearningSignalType =
  | "OUTCOME"
  | "CONFUSION"
  | "DOCUMENT_DELAY"
  | "PORTAL_FAILURE"
  | "MATCH_QUALITY"
  | "CANDIDATE_FEEDBACK"
  | "HUMAN_OVERRIDE"
  | "PHOENIX_OUTCOME"
  | "HARM_SIGNAL";

export interface AiLearningSignal {
  learningRef: string;
  candidateRef?: string;
  workflowRef?: string;
  signalType: LearningSignalType;
  signalSummary: string;
  safeForAggregateLearning: boolean;
  humanReviewed: boolean;
  noSilentLearning: true;
  noUncontrolledRl: true;
  evidenceRefs: string[];
}

export function captureLearningSignal(input: {
  candidateRef?: string;
  workflowRef?: string;
  signalType: LearningSignalType;
  signalSummary: string;
  safeForAggregateLearning?: boolean;
  humanReviewed?: boolean;
  evidenceRefs: string[];
}): AiLearningSignal {
  if (!input.signalSummary.trim()) throw new Error("Learning signal summary is required.");
  if (input.evidenceRefs.length === 0) throw new Error("Learning signal requires evidence.");
  return {
    learningRef: `learn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    workflowRef: input.workflowRef,
    signalType: input.signalType,
    signalSummary: input.signalSummary,
    safeForAggregateLearning: input.safeForAggregateLearning ?? false,
    humanReviewed: input.humanReviewed ?? false,
    noSilentLearning: true,
    noUncontrolledRl: true,
    evidenceRefs: input.evidenceRefs
  };
}

export function canUseForAggregateLearning(signal: AiLearningSignal): boolean {
  return signal.safeForAggregateLearning && signal.humanReviewed && signal.noSilentLearning && signal.noUncontrolledRl;
}