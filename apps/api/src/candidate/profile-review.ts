import type { CandidateProfileFieldSource } from "./candidate-types";

export type ProfileChangeSensitivity = "NORMAL" | "SENSITIVE" | "LEGAL_IDENTITY" | "FINANCE" | "ACADEMIC";

export interface ProfileChangeRequestInput {
  candidateId: string;
  fieldName: string;
  oldValue?: string;
  requestedValue: string;
  reason: string;
  sourceEvidenceRef?: string;
}

export interface ProfileChangeDecision {
  sensitivity: ProfileChangeSensitivity;
  requiresOperatorApproval: boolean;
  reason: string;
}

const SENSITIVE_FIELDS = new Set([
  "idNumber",
  "dateOfBirth",
  "bankAccount",
  "bankName",
  "academicResults",
  "highestGrade",
  "qualificationSummary",
  "legalName"
]);

export function classifyProfileChange(input: ProfileChangeRequestInput): ProfileChangeDecision {
  if (SENSITIVE_FIELDS.has(input.fieldName)) {
    return {
      sensitivity: input.fieldName === "idNumber" || input.fieldName === "legalName" ? "LEGAL_IDENTITY" : "SENSITIVE",
      requiresOperatorApproval: true,
      reason: "Sensitive candidate profile correction requires operator approval."
    };
  }

  return {
    sensitivity: "NORMAL",
    requiresOperatorApproval: false,
    reason: "Normal candidate-editable profile correction."
  };
}

export function acceptCandidateConfirmedField(field: CandidateProfileFieldSource): CandidateProfileFieldSource {
  if (!field.proposedValue) {
    throw new Error(`Cannot accept empty proposed value for ${field.fieldName}.`);
  }

  if (field.operatorReviewRequired || field.confidenceBand === "REVIEW_REQUIRED") {
    throw new Error(`Operator review required before accepting ${field.fieldName}.`);
  }

  return {
    ...field,
    candidateConfirmed: true
  };
}