const OFFICIAL_INSTRUCTION_TYPES = new Set([
  "fee",
  "deadline",
  "payment_channel",
  "application_link",
  "document_requirement",
  "submission_status"
]);

const VERIFIED_CONFIDENCE = new Set(["high", "official_verified"]);

export function assertN06RouteInstructionSafety(input: {
  instructionType: string;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  sourceUrl?: string;
  noGuaranteeLanguageRequired?: boolean;
}) {
  if (OFFICIAL_INSTRUCTION_TYPES.has(input.instructionType) && !VERIFIED_CONFIDENCE.has(input.sourceConfidence)) {
    throw new Error(`N06 route instruction blocked without verified source: ${input.instructionType}`);
  }

  if (OFFICIAL_INSTRUCTION_TYPES.has(input.instructionType) && !input.sourceUrl) {
    throw new Error(`N06 route instruction requires source URL: ${input.instructionType}`);
  }

  if (input.noGuaranteeLanguageRequired !== true) {
    throw new Error("N06 route instruction requires no-guarantee language");
  }

  return true;
}