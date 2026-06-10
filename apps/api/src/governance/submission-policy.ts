import type { PolicyGateEvaluation, SourceConfidence } from "./governance-types";

export function evaluateSubmissionBoundary(input: {
  candidateState: string;
  evidenceRefs: string[];
  sourceConfidence: SourceConfidence;
  humanApproved: boolean;
  portalHealth: "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
}): PolicyGateEvaluation {
  const gateRef = `gate_submission_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const base = {
    gateRef,
    policyRef: "POL-SUBMISSION-001",
    gateName: "Official submission approval boundary",
    actionRequested: "official_submission",
    evidenceRefs: input.evidenceRefs,
    sourceConfidence: input.sourceConfidence,
    evaluatedBy: "system"
  };

  if (input.candidateState !== "EXECUTION_PENDING") {
    return { ...base, gateStatus: "BLOCK", decisionSummary: "Official submission blocked because candidate is not in EXECUTION_PENDING.", blockedReason: "INVALID_STATE_FOR_SUBMISSION" };
  }
  if (input.evidenceRefs.length === 0) {
    return { ...base, gateStatus: "BLOCK", decisionSummary: "Official submission blocked because evidence is missing.", blockedReason: "SUBMISSION_EVIDENCE_REQUIRED" };
  }
  if (input.sourceConfidence === "LOW") {
    return { ...base, gateStatus: "REVIEW_REQUIRED", decisionSummary: "Official submission requires review because source confidence is low.", reviewReason: "LOW_SOURCE_CONFIDENCE" };
  }
  if (["CAPTCHA", "OTP_REQUIRED", "DOWN", "BLOCKED"].includes(input.portalHealth)) {
    return { ...base, gateStatus: "REVIEW_REQUIRED", decisionSummary: "Portal condition requires manual review or MAP fallback.", reviewReason: `PORTAL_${input.portalHealth}` };
  }
  if (!input.humanApproved) {
    return { ...base, gateStatus: "REVIEW_REQUIRED", decisionSummary: "Official submission requires human/operator approval.", reviewReason: "HUMAN_APPROVAL_REQUIRED" };
  }

  return { ...base, gateStatus: "ALLOW", decisionSummary: "Official submission boundary passed." };
}