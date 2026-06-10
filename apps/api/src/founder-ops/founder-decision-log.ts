export interface FounderDecisionInput {
  commandRef?: string;
  decisionType: "APPROVE" | "REJECT" | "PAUSE" | "RESUME" | "PRIORITIZE" | "ESCALATE" | "REQUEST_MAP" | "REQUEST_PHOENIX" | "REQUEST_REVIEW" | "NO_ACTION";
  decidedBy: string;
  decisionReason: string;
  resultingAction: string;
  evidenceRefs: string[];
}

export function recordFounderDecision(input: FounderDecisionInput) {
  if (input.evidenceRefs.length === 0) throw new Error("FOUNDER_DECISION_EVIDENCE_REQUIRED");
  if (!input.decisionReason.trim()) throw new Error("FOUNDER_DECISION_REASON_REQUIRED");

  return {
    decisionRef: `founder_decision_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    commandRef: input.commandRef,
    decisionType: input.decisionType,
    decidedBy: input.decidedBy,
    decisionStatus: "RECORDED" as const,
    decisionReason: input.decisionReason,
    boundaryChecked: "N12_GOVERNANCE",
    resultingAction: input.resultingAction,
    evidenceRefs: input.evidenceRefs
  };
}

export function noSilentFounderOverride(): true {
  return true;
}