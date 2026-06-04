const CANDIDATE_FORBIDDEN_LIFECYCLE_STATES = new Set([
  "active_managed",
  "outcome_monitoring",
  "success_transition",
  "closed"
]);

export function assertN04LifecycleTransitionAllowed(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  toState: string;
  auditId?: string;
  reason?: string;
}) {
  if (!input.auditId || !input.reason) {
    throw new Error("N04 lifecycle transition requires auditId and reason");
  }

  if (input.actorType === "candidate" && CANDIDATE_FORBIDDEN_LIFECYCLE_STATES.has(input.toState)) {
    throw new Error(`Candidate cannot directly set lifecycle state: ${input.toState}`);
  }

  return true;
}