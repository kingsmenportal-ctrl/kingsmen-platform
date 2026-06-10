import type { CandidateProfileFieldSource, CandidateSmartIntakeResult } from "./candidate-types";

export const REQUIRED_CANDIDATE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "idNumber",
  "dateOfBirth",
  "address",
  "highestGrade",
  "qualificationSummary",
  "workSummary"
] as const;

export type RequiredCandidateField = (typeof REQUIRED_CANDIDATE_FIELDS)[number];

export interface SmartIntakeInput {
  candidateId: string;
  extractedFields: CandidateProfileFieldSource[];
  userProvidedFields?: Record<string, string | undefined>;
}

export function buildSmartIntakeReview(input: SmartIntakeInput): CandidateSmartIntakeResult {
  const fieldMap = new Map<string, CandidateProfileFieldSource>();

  for (const field of input.extractedFields) {
    const current = fieldMap.get(field.fieldName);
    if (!current || confidenceRank(field.confidenceBand) > confidenceRank(current.confidenceBand)) {
      fieldMap.set(field.fieldName, field);
    }
  }

  for (const [fieldName, value] of Object.entries(input.userProvidedFields ?? {})) {
    if (!value) continue;

    fieldMap.set(fieldName, {
      fieldName,
      proposedValue: value,
      valueSummary: value,
      sourceType: "USER_INPUT",
      confidenceBand: "HIGH",
      candidateConfirmed: true,
      operatorReviewRequired: false
    });
  }

  const prefilledFields = [...fieldMap.values()].filter((field) => Boolean(field.proposedValue));
  const missingFields = REQUIRED_CANDIDATE_FIELDS.filter((field) => !fieldMap.get(field)?.proposedValue);
  const reviewRequiredFields = prefilledFields.filter(
    (field) => field.confidenceBand === "LOW" || field.confidenceBand === "REVIEW_REQUIRED" || field.operatorReviewRequired
  );

  let nextAction: CandidateSmartIntakeResult["nextAction"] = "READY";

  if (reviewRequiredFields.length > 0) {
    nextAction = "OPERATOR_REVIEW";
  } else if (missingFields.length > 0) {
    nextAction = "ASK_MISSING_FIELDS";
  } else if (prefilledFields.some((field) => !field.candidateConfirmed)) {
    nextAction = "CANDIDATE_REVIEW";
  }

  return {
    candidateId: input.candidateId,
    prefilledFields,
    missingFields: [...missingFields],
    reviewRequiredFields,
    nextAction
  };
}

function confidenceRank(confidence: CandidateProfileFieldSource["confidenceBand"]): number {
  if (confidence === "HIGH") return 4;
  if (confidence === "MEDIUM") return 3;
  if (confidence === "REVIEW_REQUIRED") return 2;
  return 1;
}

export function explainSmartIntake(result: CandidateSmartIntakeResult): string {
  if (result.nextAction === "READY") {
    return "Candidate profile has enough confirmed information to continue.";
  }

  if (result.nextAction === "ASK_MISSING_FIELDS") {
    return `Ask candidate only for missing fields: ${result.missingFields.join(", ")}.`;
  }

  if (result.nextAction === "OPERATOR_REVIEW") {
    return "Operator review required before sensitive or low-confidence fields become trusted.";
  }

  return "Candidate must review and confirm document-extracted fields.";
}