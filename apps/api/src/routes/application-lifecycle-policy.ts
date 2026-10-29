export type CanonicalApplicationStatus =
  | "PLANNING"
  | "PREPARING"
  | "READY_FOR_EXTERNAL_PORTAL"
  | "EXTERNAL_PORTAL_OPENED"
  | "CANDIDATE_REPORTED_SUBMITTED"
  | "PROVIDER_ACKNOWLEDGED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "CLOSED";

export type LegacyApplicationSource =
  | "candidate_route_applications"
  | "applications"
  | "candidate_applications"
  | "candidate_application_tracker"
  | "candidate_master_application_targets";

export interface ProviderStatusEvidence {
  evidenceRef: string;
  sourceKind: "PROVIDER_ORIGIN";
  verified: true;
  verifiedByAuthUserId: string;
  verifiedAt: string;
}

export interface CandidateSubmissionEvidence {
  reference: string;
  reportedAt: string;
}

export interface LegacyApplicationObservation {
  source: LegacyApplicationSource;
  status: string;
  candidateSubmission?: CandidateSubmissionEvidence;
  providerEvidence?: ProviderStatusEvidence;
}

export interface NormalizedApplicationStatus {
  status: CanonicalApplicationStatus | "LEGACY_UNRESOLVED";
  source: LegacyApplicationSource;
  sourceStatus: string;
  statusAuthority: "tracker_recorded" | "candidate_reported" | "provider_verified" | "legacy_unresolved";
  requiresReview: boolean;
  reason: string;
}

const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

const PROVIDER_CONFIRMED = new Set<CanonicalApplicationStatus>([
  "PROVIDER_ACKNOWLEDGED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"
]);

/**
 * A compatibility adapter for reading overlapping legacy status vocabularies.
 * Unknown statuses deliberately remain unresolved. A candidate assertion never
 * becomes a provider-confirmed receipt, decision, or outcome.
 */
export function normalizeLegacyApplicationStatus(input: LegacyApplicationObservation): NormalizedApplicationStatus {
  const raw = String(input.status ?? "").trim().toUpperCase();
  if (input.source !== "candidate_route_applications") {
    return {
      status: "LEGACY_UNRESOLVED",
      source: input.source,
      sourceStatus: raw,
      statusAuthority: "legacy_unresolved",
      requiresReview: true,
      reason: "This legacy table uses a separate workflow vocabulary; no status equivalence is assumed."
    };
  }

  const known: Record<string, CanonicalApplicationStatus> = {
    PLANNING: "PLANNING",
    PREPARING: "PREPARING",
    READY_FOR_EXTERNAL_PORTAL: "READY_FOR_EXTERNAL_PORTAL",
    EXTERNAL_PORTAL_OPENED: "EXTERNAL_PORTAL_OPENED",
    CANDIDATE_REPORTED_SUBMITTED: "CANDIDATE_REPORTED_SUBMITTED",
    PROVIDER_ACKNOWLEDGED: "PROVIDER_ACKNOWLEDGED",
    UNDER_REVIEW: "UNDER_REVIEW",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    CLOSED: "CLOSED"
  };
  const canonical = known[raw];
  if (!canonical) {
    return {
      status: "LEGACY_UNRESOLVED",
      source: input.source,
      sourceStatus: raw,
      statusAuthority: "legacy_unresolved",
      requiresReview: true,
      reason: "Unrecognized legacy status; preserve it for reconciliation rather than guessing."
    };
  }

  if (canonical === "CANDIDATE_REPORTED_SUBMITTED") {
    const evidence = input.candidateSubmission;
    if (!evidence || evidence.reference.trim().length < 3 || !Number.isFinite(Date.parse(evidence.reportedAt))) {
      return {
        status: "LEGACY_UNRESOLVED",
        source: input.source,
        sourceStatus: raw,
        statusAuthority: "legacy_unresolved",
        requiresReview: true,
        reason: "Candidate-reported submission requires a non-empty reference and valid report timestamp."
      };
    }
    return {
      status: canonical,
      source: input.source,
      sourceStatus: raw,
      statusAuthority: "candidate_reported",
      requiresReview: false,
      reason: "Candidate-reported only; this is not provider-confirmed receipt."
    };
  }

  if (PROVIDER_CONFIRMED.has(canonical)) {
    const evidence = input.providerEvidence;
    if (!evidence || evidence.sourceKind !== "PROVIDER_ORIGIN" || evidence.verified !== true ||
        !evidence.evidenceRef.trim() || !isUuid(evidence.verifiedByAuthUserId) ||
        !Number.isFinite(Date.parse(evidence.verifiedAt))) {
      return {
        status: "LEGACY_UNRESOLVED",
        source: input.source,
        sourceStatus: raw,
        statusAuthority: "legacy_unresolved",
        requiresReview: true,
        reason: "Provider receipt, review, or outcome requires verified provider-origin evidence and reviewer identity."
      };
    }
    return {
      status: canonical,
      source: input.source,
      sourceStatus: raw,
      statusAuthority: "provider_verified",
      requiresReview: false,
      reason: "Provider-origin evidence is verified."
    };
  }

  return {
    status: canonical,
    source: input.source,
    sourceStatus: raw,
    statusAuthority: "tracker_recorded",
    requiresReview: false,
    reason: "Status is carried forward from the route tracker; no provider outcome is implied."
  };
}

export interface ApplicationChildChoice {
  choiceNumber: number;
  institutionName: string;
  programmeName: string;
}

export interface ChildChoiceValidation {
  allowed: boolean;
  reasons: string[];
}

/** CAO is one parent Kingsmen application with up to six ordered child choices. */
export function validateApplicationChildChoices(choices: ApplicationChildChoice[]): ChildChoiceValidation {
  const reasons: string[] = [];
  if (choices.length === 0) return { allowed: false, reasons: ["At least one CAO choice is required."] };
  if (choices.length > 6) return { allowed: false, reasons: ["CAO allows a combination of up to six programmes in the route boundary."] };

  const seen = new Set<number>();
  for (const choice of choices) {
    if (!Number.isInteger(choice.choiceNumber) || choice.choiceNumber < 1 || choice.choiceNumber > 6) {
      reasons.push(`Invalid CAO choice number: ${choice.choiceNumber}.`);
    }
    if (seen.has(choice.choiceNumber)) reasons.push(`Duplicate CAO choice number: ${choice.choiceNumber}.`);
    seen.add(choice.choiceNumber);
    if (!choice.institutionName?.trim() || !choice.programmeName?.trim()) {
      reasons.push("Each CAO choice requires institutionName and programmeName.");
    }
  }
  return reasons.length
    ? { allowed: false, reasons }
    : { allowed: true, reasons: ["CAO choices fit the one-application child-choice boundary."] };
}

export type ApplicationTransitionDecision = { allowed: true; reasons: string[] } | { allowed: false; reasons: string[] };

const TRANSITIONS: Record<CanonicalApplicationStatus, readonly CanonicalApplicationStatus[]> = {
  PLANNING: ["PREPARING", "CLOSED"],
  PREPARING: ["PLANNING", "READY_FOR_EXTERNAL_PORTAL", "CLOSED"],
  READY_FOR_EXTERNAL_PORTAL: ["PREPARING", "EXTERNAL_PORTAL_OPENED", "CLOSED"],
  EXTERNAL_PORTAL_OPENED: ["PREPARING", "CANDIDATE_REPORTED_SUBMITTED", "CLOSED"],
  CANDIDATE_REPORTED_SUBMITTED: ["PREPARING", "PROVIDER_ACKNOWLEDGED", "CLOSED"],
  PROVIDER_ACKNOWLEDGED: ["UNDER_REVIEW", "ACCEPTED", "REJECTED", "CLOSED"],
  UNDER_REVIEW: ["ACCEPTED", "REJECTED", "CLOSED"],
  ACCEPTED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  CLOSED: []
};

export function validateApplicationTransition(input: {
  from: CanonicalApplicationStatus;
  to: CanonicalApplicationStatus;
  candidateSubmission?: CandidateSubmissionEvidence;
  providerEvidence?: ProviderStatusEvidence;
}): ApplicationTransitionDecision {
  if (input.from === input.to) return { allowed: true, reasons: ["No status change."] };
  if (!TRANSITIONS[input.from].includes(input.to)) {
    return { allowed: false, reasons: [`Illegal application transition: ${input.from} -> ${input.to}.`] };
  }
  if (input.to === "CANDIDATE_REPORTED_SUBMITTED") {
    const e = input.candidateSubmission;
    if (!e || e.reference.trim().length < 3 || !Number.isFinite(Date.parse(e.reportedAt))) {
      return { allowed: false, reasons: ["Candidate-reported submission requires a reference and valid timestamp."] };
    }
  }
  if (PROVIDER_CONFIRMED.has(input.to)) {
    const e = input.providerEvidence;
    if (!e || e.sourceKind !== "PROVIDER_ORIGIN" || e.verified !== true ||
        !e.evidenceRef.trim() || !isUuid(e.verifiedByAuthUserId) ||
        !Number.isFinite(Date.parse(e.verifiedAt))) {
      return { allowed: false, reasons: ["Provider-confirmed states require verified provider-origin evidence and reviewer identity."] };
    }
  }
  return { allowed: true, reasons: ["Transition satisfies the application lifecycle evidence boundary."] };
}
