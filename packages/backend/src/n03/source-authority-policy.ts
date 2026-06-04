const VERIFIED_CONFIDENCE = new Set(["high", "official_verified"]);

export function assertOfficialInstructionSourceAllowed(input: {
  instructionType: "fee" | "deadline" | "payment_channel" | "document_requirement" | "application_link" | "status";
  confidenceBand: "unverified" | "low" | "medium" | "high" | "official_verified";
  sourceUrl?: string;
}) {
  if (!VERIFIED_CONFIDENCE.has(input.confidenceBand)) {
    throw new Error(`Official instruction blocked without verified source confidence: ${input.instructionType}`);
  }

  if (!input.sourceUrl) {
    throw new Error(`Official instruction requires source URL: ${input.instructionType}`);
  }

  return true;
}

export function buildN03SourceAuthority(input: {
  sourceId: string;
  sourceName: string;
  authorityType: "institution" | "government" | "provider" | "employer" | "partner" | "manual_review";
  confidenceBand: "unverified" | "low" | "medium" | "high" | "official_verified";
  sourceUrl?: string;
}) {
  return {
    ...input,
    officialInstructionAllowed: VERIFIED_CONFIDENCE.has(input.confidenceBand),
    createdAt: new Date().toISOString()
  } as const;
}