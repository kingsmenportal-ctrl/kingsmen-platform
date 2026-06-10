import type { GovernancePolicy, PolicyGateEvaluation, SourceConfidence } from "./governance-types";

function ref(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function evaluatePolicyGate(input: {
  policy: GovernancePolicy;
  gateName: string;
  actionRequested: string;
  evidenceRefs: string[];
  sourceConfidence?: SourceConfidence;
  candidateRef?: string;
  applicationRef?: string;
  routeRef?: string;
  commandRef?: string;
  workflowRef?: string;
  evaluatedBy?: string;
}): PolicyGateEvaluation {
  const sourceConfidence = input.sourceConfidence ?? "MEDIUM";
  const missingEvidence = input.policy.evidenceRequired && input.evidenceRefs.length === 0;

  if (missingEvidence) {
    return {
      gateRef: ref("gate"),
      policyRef: input.policy.policyRef,
      candidateRef: input.candidateRef,
      applicationRef: input.applicationRef,
      routeRef: input.routeRef,
      commandRef: input.commandRef,
      workflowRef: input.workflowRef,
      gateName: input.gateName,
      gateStatus: "BLOCK",
      actionRequested: input.actionRequested,
      decisionSummary: "Policy gate blocked action because required evidence is missing.",
      blockedReason: "EVIDENCE_REQUIRED",
      evidenceRefs: input.evidenceRefs,
      sourceConfidence,
      evaluatedBy: input.evaluatedBy ?? "system"
    };
  }

  if (input.policy.enforcementLevel === "HARD_BLOCK") {
    return {
      gateRef: ref("gate"),
      policyRef: input.policy.policyRef,
      candidateRef: input.candidateRef,
      applicationRef: input.applicationRef,
      routeRef: input.routeRef,
      commandRef: input.commandRef,
      workflowRef: input.workflowRef,
      gateName: input.gateName,
      gateStatus: "BLOCK",
      actionRequested: input.actionRequested,
      decisionSummary: "Policy gate blocked action by hard governance rule.",
      blockedReason: input.policy.policyText,
      evidenceRefs: input.evidenceRefs,
      sourceConfidence,
      evaluatedBy: input.evaluatedBy ?? "system"
    };
  }

  if (input.policy.enforcementLevel === "REVIEW_REQUIRED" || input.policy.humanReviewRequired) {
    return {
      gateRef: ref("gate"),
      policyRef: input.policy.policyRef,
      candidateRef: input.candidateRef,
      applicationRef: input.applicationRef,
      routeRef: input.routeRef,
      commandRef: input.commandRef,
      workflowRef: input.workflowRef,
      gateName: input.gateName,
      gateStatus: "REVIEW_REQUIRED",
      actionRequested: input.actionRequested,
      decisionSummary: "Policy gate requires human/operator review before this action can continue.",
      reviewReason: input.policy.policyText,
      evidenceRefs: input.evidenceRefs,
      sourceConfidence,
      evaluatedBy: input.evaluatedBy ?? "system"
    };
  }

  if (input.policy.enforcementLevel === "WARN") {
    return {
      gateRef: ref("gate"),
      policyRef: input.policy.policyRef,
      candidateRef: input.candidateRef,
      applicationRef: input.applicationRef,
      routeRef: input.routeRef,
      commandRef: input.commandRef,
      workflowRef: input.workflowRef,
      gateName: input.gateName,
      gateStatus: "WARN",
      actionRequested: input.actionRequested,
      decisionSummary: "Policy gate allowed action with warning.",
      reviewReason: input.policy.policyText,
      evidenceRefs: input.evidenceRefs,
      sourceConfidence,
      evaluatedBy: input.evaluatedBy ?? "system"
    };
  }

  return {
    gateRef: ref("gate"),
    policyRef: input.policy.policyRef,
    candidateRef: input.candidateRef,
    applicationRef: input.applicationRef,
    routeRef: input.routeRef,
    commandRef: input.commandRef,
    workflowRef: input.workflowRef,
    gateName: input.gateName,
    gateStatus: "ALLOW",
    actionRequested: input.actionRequested,
    decisionSummary: "Policy gate allowed action.",
    evidenceRefs: input.evidenceRefs,
    sourceConfidence,
    evaluatedBy: input.evaluatedBy ?? "system"
  };
}

export function assertGateAllows(evaluation: PolicyGateEvaluation): void {
  if (evaluation.gateStatus === "BLOCK") throw new Error(`POLICY_GATE_BLOCKED: ${evaluation.blockedReason ?? evaluation.decisionSummary}`);
  if (evaluation.gateStatus === "REVIEW_REQUIRED") throw new Error(`POLICY_GATE_REVIEW_REQUIRED: ${evaluation.reviewReason ?? evaluation.decisionSummary}`);
}