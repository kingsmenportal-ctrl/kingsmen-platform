const VERIFIED_CONFIDENCE = new Set(["high", "official_verified"]);

export function assertN06OfficialRouteInstructionAllowed(input: {
  instructionType: "fee" | "deadline" | "payment_channel" | "application_link" | "document_requirement" | "status";
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  sourceUrl?: string;
}) {
  if (!VERIFIED_CONFIDENCE.has(input.sourceConfidence)) {
    throw new Error(`N06 official route instruction blocked without verified source: ${input.instructionType}`);
  }

  if (!input.sourceUrl) {
    throw new Error(`N06 official route instruction requires source URL: ${input.instructionType}`);
  }

  return true;
}