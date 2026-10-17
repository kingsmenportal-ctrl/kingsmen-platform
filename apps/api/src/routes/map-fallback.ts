import { randomUUID } from "node:crypto";

export type MapFallbackReasonCode =
  | "OTP_REQUIRED"
  | "CAPTCHA_BLOCKED"
  | "PORTAL_DOWN"
  | "MANUAL_ONLY"
  | "SOURCE_REVIEW_REQUIRED"
  | "OTHER";

export const MAP_FALLBACK_LABEL = "Manual Application Package";

export interface ManualApplicationPackageInput {
  applicationId: string;
  candidateId: string;
  reasonCode: MapFallbackReasonCode;
  reasonSummary: string;
  sourceLinks: string[];
  requiredDocuments: string[];
}

export interface ManualApplicationPackage {
  mapRef: string;
  applicationId: string;
  candidateId: string;
  reasonCode: MapFallbackReasonCode;
  reasonSummary: string;
  manualSteps: string[];
  requiredDocuments: string[];
  sourceLinks: string[];
  packageStatus: "DRAFT" | "READY" | "SENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  packageLabel: typeof MAP_FALLBACK_LABEL;
}

export function buildManualApplicationPackage(input: ManualApplicationPackageInput): ManualApplicationPackage {
  if (!input.applicationId) throw new Error("applicationId is required.");
  if (!input.candidateId) throw new Error("candidateId is required.");
  if (!input.reasonSummary || input.reasonSummary.trim().length < 5) throw new Error("reasonSummary is required.");
  if (!Array.isArray(input.sourceLinks) || input.sourceLinks.length === 0) {
    throw new Error("At least one independently verified official HTTPS source link is required.");
  }
  for (const value of input.sourceLinks) {
    let source: URL;
    try { source = new URL(value); } catch { throw new Error("Every MAP source link must be a valid HTTPS URL."); }
    if (source.protocol !== "https:" || source.username || source.password) {
      throw new Error("Every MAP source link must be an HTTPS URL without embedded credentials.");
    }
  }
  if (!Array.isArray(input.requiredDocuments) || input.requiredDocuments.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error("requiredDocuments must contain only non-empty document labels; do not invent missing requirements.");
  }

  return {
    mapRef: `map_${randomUUID()}`,
    applicationId: input.applicationId,
    candidateId: input.candidateId,
    reasonCode: input.reasonCode,
    reasonSummary: input.reasonSummary,
    manualSteps: [
      "Open the verified official source link.",
      "Confirm programme, fee, deadline, requirements, and portal status.",
      "Prepare required documents.",
      "Submit manually or guide candidate with operator approval.",
      "Record evidence and update application workbench."
    ],
    requiredDocuments: input.requiredDocuments,
    sourceLinks: input.sourceLinks,
    packageStatus: "DRAFT",
    packageLabel: MAP_FALLBACK_LABEL
  };
}

export function mapFallbackIsManualApplicationPackage(): true {
  return true;
}