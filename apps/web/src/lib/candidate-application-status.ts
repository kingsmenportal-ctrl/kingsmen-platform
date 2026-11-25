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

export type CandidateApplicationStatusGuidance = {
  heading: string;
  detail: string;
};

const STATUS_GUIDANCE: Record<CandidateFacingApplicationStatus, CandidateApplicationStatusGuidance> = {
  "Draft": {
    heading: "Next step: continue your draft",
    detail: "Your application is still being prepared in Kingsmen. Draft editing is available only when the server confirms that this record is editable."
  },
  "Submitted to Kingsmen": {
    heading: "Next step: follow Kingsmen review updates",
    detail: "Kingsmen has recorded this application for review. This status does not confirm that an external provider has received it."
  },
  "Under review": {
    heading: "Next step: check for a Kingsmen update",
    detail: "Review the recorded application events for progress or requests. This status alone does not confirm an external provider's receipt."
  },
  "Action required": {
    heading: "Next step: review the required action",
    detail: "Kingsmen has marked this application as needing further action. Open the workbench and follow the instructions actually recorded for this application."
  },
  "Prepared for provider": {
    heading: "Next step: verify provider submission instructions",
    detail: "The application is recorded as prepared for a provider. Preparation is not proof that the provider has received it."
  },
  "Provider receipt confirmed": {
    heading: "Next step: keep the provider receipt evidence",
    detail: "Kingsmen records provider-origin receipt evidence for this status. Receipt does not guarantee admission, funding, placement or employment."
  },
  "Decision recorded": {
    heading: "Next step: review the recorded decision",
    detail: "A decision is recorded in Kingsmen. Read the linked event or official evidence for the actual outcome; do not infer the result from this label."
  }
};

export function candidateApplicationStatusGuidance(
  value: unknown
): CandidateApplicationStatusGuidance | null {
  const status = normalizeCandidateFacingApplicationStatus(value);
  return status ? STATUS_GUIDANCE[status] : null;
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
