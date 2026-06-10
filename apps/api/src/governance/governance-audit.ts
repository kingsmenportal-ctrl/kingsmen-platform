export interface GovernanceAuditEvent {
  auditRef: string;
  actorRef: string;
  eventType:
    | "POLICY_REGISTERED"
    | "GATE_EVALUATED"
    | "ACTION_BLOCKED"
    | "REVIEW_REQUESTED"
    | "HUMAN_OVERRIDE_REQUESTED"
    | "HUMAN_OVERRIDE_RESOLVED"
    | "CONSENT_RECORDED"
    | "SOURCE_CONFIDENCE_REVIEWED"
    | "GROWTH_CAP_REVIEWED"
    | "POLICY_EXCEPTION_REVIEWED"
    | "COMPLIANCE_EVENT";
  eventSummary: string;
  policyRef?: string;
  gateRef?: string;
  decisionRef?: string;
  candidateRef?: string;
  applicationRef?: string;
  routeRef?: string;
  evidenceRefs: string[];
}

export function createGovernanceAuditEvent(input: Omit<GovernanceAuditEvent, "auditRef">): GovernanceAuditEvent {
  if (!input.eventSummary.trim()) throw new Error("GOVERNANCE_AUDIT_SUMMARY_REQUIRED");
  if (input.evidenceRefs.length === 0) throw new Error("GOVERNANCE_AUDIT_EVIDENCE_REQUIRED");
  return {
    ...input,
    auditRef: `gaudit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  };
}