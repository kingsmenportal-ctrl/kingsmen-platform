export type N04CandidateLifecycleState =
  | "new"
  | "intake_started"
  | "intake_completed"
  | "profile_pending"
  | "document_pending"
  | "route_review_pending"
  | "payment_pending"
  | "ready_for_workbench"
  | "active_managed"
  | "outcome_monitoring"
  | "success_transition"
  | "paused"
  | "closed";

export type N04CandidateLifecycle = {
  candidateId: string;
  state: N04CandidateLifecycleState;
  reason: string;
  auditId: string;
  candidateCanSetStateDirectly: false;
  createdAt: string;
};