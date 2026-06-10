import type { PolicyGateEvaluation, PrivacyConsentRecord } from "./governance-types";

export function evaluatePrivacyBoundary(input: {
  actionRequested: string;
  candidateRef: string;
  consent?: PrivacyConsentRecord;
  evidenceRefs: string[];
  sensitive: boolean;
  humanApproved?: boolean;
}): PolicyGateEvaluation {
  const base = {
    gateRef: `gate_privacy_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    policyRef: "POL-POPIA-001",
    candidateRef: input.candidateRef,
    gateName: "POPIA privacy boundary",
    actionRequested: input.actionRequested,
    evidenceRefs: input.evidenceRefs,
    sourceConfidence: "HIGH" as const,
    evaluatedBy: "system"
  };

  if (input.evidenceRefs.length === 0) {
    return { ...base, gateStatus: "BLOCK" as const, decisionSummary: "Privacy-sensitive action blocked because evidence is missing.", blockedReason: "POPIA_EVIDENCE_REQUIRED" };
  }
  if (!input.consent || input.consent.consentStatus !== "ACTIVE") {
    return { ...base, gateStatus: "BLOCK" as const, decisionSummary: "Privacy-sensitive action blocked because active consent or lawful basis is missing.", blockedReason: "LAWFUL_BASIS_REQUIRED" };
  }
  if (input.sensitive && !input.humanApproved) {
    return { ...base, gateStatus: "REVIEW_REQUIRED" as const, decisionSummary: "Sensitive privacy action requires human/operator approval.", reviewReason: "SENSITIVE_PRIVACY_REVIEW_REQUIRED" };
  }
  return { ...base, gateStatus: "ALLOW" as const, decisionSummary: "POPIA privacy boundary passed." };
}

export function assertMinimumDataOnly(fields: string[], allowedFields: string[]): void {
  const allowed = new Set(allowedFields);
  const disallowed = fields.filter((field) => !allowed.has(field));
  if (disallowed.length > 0) {
    throw new Error(`POPIA_MINIMUM_DATA_BLOCKED: ${disallowed.join(", ")}`);
  }
}