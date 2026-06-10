export type CandidateOutcomeConfidence = "UNVERIFIED" | "PARTIAL" | "VERIFIED";

export interface CandidateSuccessEventInput {
  candidateId: string;
  applicationId?: string;
  eventType: string;
  summary: string;
  evidenceRef?: string;
  feedbackScore?: number;
  outcomeConfidence?: CandidateOutcomeConfidence;
}

export function assertCandidateSuccessEvent(input: CandidateSuccessEventInput): CandidateSuccessEventInput {
  if (!input.candidateId) throw new Error("candidateId is required.");
  if (!input.eventType) throw new Error("eventType is required.");
  if (!input.summary || input.summary.trim().length < 3) throw new Error("summary is required.");

  if (input.feedbackScore !== undefined && (input.feedbackScore < 1 || input.feedbackScore > 5)) {
    throw new Error("feedbackScore must be between 1 and 5.");
  }

  return {
    ...input,
    outcomeConfidence: input.outcomeConfidence ?? (input.evidenceRef ? "PARTIAL" : "UNVERIFIED")
  };
}

export function canUseOutcomeForGrowthReadiness(input: CandidateSuccessEventInput): boolean {
  const checked = assertCandidateSuccessEvent(input);
  return checked.outcomeConfidence === "VERIFIED" && Boolean(checked.evidenceRef);
}