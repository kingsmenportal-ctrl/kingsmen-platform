/**
 * Candidate-facing application lifecycle labels.
 *
 * These labels are not aliases for internal workflow or readiness states.
 * Missing/unknown backend values remain explicitly unavailable until the
 * canonical status contract is present in the trusted application response.
 */
export const CANDIDATE_APPLICATION_STATUSES = [
  "Draft",
  "Submitted to Kingsmen",
  "Under review",
  "Action required",
  "Prepared for provider",
  "Provider receipt confirmed",
  "Decision recorded"
] as const;

export type CandidateFacingApplicationStatus = (typeof CANDIDATE_APPLICATION_STATUSES)[number];

const PRE_SUBMISSION_INTERNAL_STATES = [
  "DRAFT",
  "READINESS_BLOCKED",
  "READY_FOR_REVIEW",
  "READY_TO_SUBMIT"
] as const;

export function normalizeCandidateFacingApplicationStatus(
  value: unknown
): CandidateFacingApplicationStatus | null {
  if (typeof value !== "string") return null;
  return (CANDIDATE_APPLICATION_STATUSES as readonly string[]).includes(value)
    ? value as CandidateFacingApplicationStatus
    : null;
}

export function candidateFacingApplicationStatusLabel(value: unknown): string {
  return normalizeCandidateFacingApplicationStatus(value) ?? "Status not available";
}

export function canResumeCandidateApplicationDraft(
  candidateStatus: unknown,
  internalWorkflowStatus: unknown
): boolean {
  const status = normalizeCandidateFacingApplicationStatus(candidateStatus);
  return (status === "Draft" || status === "Action required")
    && typeof internalWorkflowStatus === "string"
    && (PRE_SUBMISSION_INTERNAL_STATES as readonly string[]).includes(internalWorkflowStatus);
}

export function isCandidateEditableApplicationStatus(value: unknown): boolean {
  const status = normalizeCandidateFacingApplicationStatus(value);
  return status === "Draft" || status === "Action required";
}
