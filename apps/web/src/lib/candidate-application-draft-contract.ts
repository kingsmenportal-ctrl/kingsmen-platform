export type CandidateDraftAnswers = Record<string, unknown>;

export type CandidateDraftValidation = {
  valid: boolean;
  missingRequired: string[];
  errors: Record<string, string>;
};

export const CANDIDATE_DRAFT_REQUIRED_FIELDS = [
  "given_name",
  "family_name",
  "date_of_birth",
  "nationality",
  "contact_email",
] as const;

const MAX_DEPTH = 8;
const MAX_STRING_LENGTH = 10_000;
const MAX_KEYS = 250;

function safeValue(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false;
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return typeof value !== "number" || Number.isFinite(value);
  }
  if (typeof value === "string") return value.length <= MAX_STRING_LENGTH;
  if (Array.isArray(value)) return value.length <= MAX_KEYS && value.every((entry) => safeValue(entry, depth + 1));
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length <= MAX_KEYS && entries.every(([key, entry]) =>
      key.length > 0 && key.length <= 128 && !["__proto__", "prototype", "constructor"].includes(key)
      && safeValue(entry, depth + 1));
  }
  return false;
}

export function validateCandidateDraftAnswers(
  answers: unknown,
  requiredFields: readonly string[] = CANDIDATE_DRAFT_REQUIRED_FIELDS
): CandidateDraftValidation {
  const errors: Record<string, string> = {};
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return { valid: false, missingRequired: [...requiredFields], errors: { _root: "Answers must be a JSON object." } };
  }

  const record = answers as Record<string, unknown>;
  if (!safeValue(record)) {
    return { valid: false, missingRequired: [...requiredFields], errors: { _root: "Answers contain unsupported or oversized values." } };
  }

  const missingRequired = requiredFields.filter((field) => {
    const value = record[field];
    const missing = value === undefined || value === null || (typeof value === "string" && value.trim() === "");
    if (missing) errors[field] = "This field is required.";
    return missing;
  });

  if (typeof record.contact_email === "string"
    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contact_email.trim())) {
    errors.contact_email = "Enter a valid email address.";
  }

  if (typeof record.date_of_birth === "string") {
    const date = new Date(record.date_of_birth);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date_of_birth) || Number.isNaN(date.valueOf())
      || date.toISOString().slice(0, 10) !== record.date_of_birth) {
      errors.date_of_birth = "Enter a valid date in YYYY-MM-DD format.";
    }
  }

  return { valid: missingRequired.length === 0 && Object.keys(errors).length === 0, missingRequired, errors };
}

export type CandidateApplicationAnswerData = {
  motivation_statement?: unknown;
  relevant_experience?: unknown;
  qualifications_summary?: unknown;
  availability_date?: unknown;
  preferred_campus?: unknown;
  additional_answers?: unknown;
};

export function validateCandidateApplicationAnswerData(input: unknown): CandidateDraftValidation {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object" || Array.isArray(input) || !safeValue(input)) {
    return { valid: false, missingRequired: [], errors: { _root: "Answer data must be a bounded JSON object." } };
  }

  const record = input as CandidateApplicationAnswerData;
  const limits: Record<string, number> = {
    motivation_statement: 5000,
    relevant_experience: 4000,
    qualifications_summary: 3000,
    availability_date: 10,
    preferred_campus: 180
  };
  for (const [field, maxLength] of Object.entries(limits)) {
    const value = record[field as keyof CandidateApplicationAnswerData];
    if (value !== undefined && typeof value !== "string") errors[field] = "This field must be text.";
    else if (typeof value === "string" && value.length > maxLength) errors[field] = `This field exceeds ${maxLength} characters.`;
  }

  if (typeof record.availability_date === "string" && record.availability_date !== "") {
    const date = new Date(record.availability_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.availability_date) || Number.isNaN(date.valueOf())
      || date.toISOString().slice(0, 10) !== record.availability_date) {
      errors.availability_date = "Enter a valid date in YYYY-MM-DD format.";
    }
  }

  if (record.additional_answers !== undefined) {
    if (!Array.isArray(record.additional_answers) || record.additional_answers.length > 20) {
      errors.additional_answers = "Provide no more than 20 additional provider answers.";
    } else {
      record.additional_answers.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          errors[`additional_answers.${index}`] = "Each additional answer must be an object.";
          return;
        }
        const answer = item as Record<string, unknown>;
        if (typeof answer.question_key !== "string" || !/^[A-Za-z0-9._:-]{1,80}$/.test(answer.question_key.trim())) {
          errors[`additional_answers.${index}.question_key`] = "Use a valid provider question key (1–80 permitted characters).";
        }
        if (typeof answer.answer !== "string" || answer.answer.length > 2000) {
          errors[`additional_answers.${index}.answer`] = "Answer must be text of at most 2,000 characters.";
        }
      });
    }
  }

  return { valid: Object.keys(errors).length === 0, missingRequired: [], errors };
}

export type CandidateDraftLifecycle = "Draft" | "Submitted to Kingsmen" | "Action required";

export function canEditCandidateDraft(status: unknown): status is "Draft" | "Action required" {
  return status === "Draft" || status === "Action required";
}

export function submissionReadiness(answers: unknown): CandidateDraftValidation {
  return validateCandidateDraftAnswers(answers);
}

export function assertCandidateDraftVersion(expectedVersion: unknown, currentVersion: number): boolean {
  return Number.isInteger(expectedVersion) && expectedVersion === currentVersion;
}

export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{8,160}$/.test(value);
}
