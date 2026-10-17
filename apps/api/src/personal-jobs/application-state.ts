/**
 * Pure application lifecycle policy. This module is deliberately not a persistence
 * or authorization layer: callers must authenticate, prove record ownership,
 * write an audit event, and persist atomically before exposing a transition.
 */
export const APPLICATION_STATES = [
  "preparation",
  "ready_for_manual_submission",
  "submission_in_progress",
  "submitted_verified",
  "follow_up_scheduled",
  "interview",
  "rejected",
  "offer_received",
  "closed"
] as const;

export type ApplicationState = typeof APPLICATION_STATES[number];
export type EvidenceKind =
  | "candidate_submission_receipt"
  | "employer_confirmation"
  | "employer_interview_invitation"
  | "employer_rejection"
  | "employer_offer"
  | "candidate_closure_note";

export interface ApplicationEvidence {
  kind: EvidenceKind;
  reference: string;
  recordedBy: "candidate" | "employer" | "authorized_staff";
  recordedAt: string;
}

export interface TransitionRequest {
  from: ApplicationState;
  to: ApplicationState;
  evidence?: ApplicationEvidence;
}

export type TransitionDecision =
  | { allowed: true; requiresAudit: true; requiresAtomicPersistence: true }
  | { allowed: false; code: "INVALID_TRANSITION" | "EVIDENCE_REQUIRED" | "EVIDENCE_MISMATCH" | "INVALID_EVIDENCE" };

const transitions: Record<ApplicationState, readonly ApplicationState[]> = {
  preparation: ["ready_for_manual_submission", "closed"],
  ready_for_manual_submission: ["preparation", "submission_in_progress", "closed"],
  submission_in_progress: ["ready_for_manual_submission", "submitted_verified", "closed"],
  submitted_verified: ["follow_up_scheduled", "interview", "rejected", "offer_received", "closed"],
  follow_up_scheduled: ["interview", "rejected", "offer_received", "closed"],
  interview: ["follow_up_scheduled", "rejected", "offer_received", "closed"],
  rejected: ["closed"],
  offer_received: ["closed"],
  closed: []
};

const requiredEvidence: Partial<Record<ApplicationState, EvidenceKind>> = {
  submitted_verified: "candidate_submission_receipt",
  interview: "employer_interview_invitation",
  rejected: "employer_rejection",
  offer_received: "employer_offer"
};

const employerOnlyStates = new Set<ApplicationState>(["interview", "rejected", "offer_received"]);

export function decideApplicationTransition(request: TransitionRequest): TransitionDecision {
  if (!APPLICATION_STATES.includes(request.from) || !APPLICATION_STATES.includes(request.to)
      || !transitions[request.from].includes(request.to)) {
    return { allowed: false, code: "INVALID_TRANSITION" };
  }

  const required = requiredEvidence[request.to];
  if (required && !request.evidence) return { allowed: false, code: "EVIDENCE_REQUIRED" };

  if (request.evidence) {
    const evidence = request.evidence;
    if (!evidence.reference.trim() || !Number.isFinite(Date.parse(evidence.recordedAt))) {
      return { allowed: false, code: "INVALID_EVIDENCE" };
    }
    if (required && evidence.kind !== required) return { allowed: false, code: "EVIDENCE_MISMATCH" };
    if (employerOnlyStates.has(request.to)
        && (evidence.recordedBy !== "employer" && evidence.recordedBy !== "authorized_staff")) {
      return { allowed: false, code: "EVIDENCE_MISMATCH" };
    }
    if (request.to === "submitted_verified" && evidence.recordedBy !== "candidate") {
      return { allowed: false, code: "EVIDENCE_MISMATCH" };
    }
    if (request.to === "closed" && evidence.kind !== "candidate_closure_note") {
      return { allowed: false, code: "EVIDENCE_MISMATCH" };
    }
  } else if (request.to === "closed" && request.from !== "rejected" && request.from !== "offer_received") {
    return { allowed: false, code: "EVIDENCE_REQUIRED" };
  }

  return { allowed: true, requiresAudit: true, requiresAtomicPersistence: true };
}
