export type N03SourceConfidenceBand =
  | "unverified"
  | "low"
  | "medium"
  | "high"
  | "official_verified";

export type N03SourceAuthorityRecord = {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  authorityType: "institution" | "government" | "provider" | "employer" | "partner" | "manual_review";
  confidenceBand: N03SourceConfidenceBand;
  verifiedAt?: string;
  officialInstructionAllowed: boolean;
  createdAt: string;
};