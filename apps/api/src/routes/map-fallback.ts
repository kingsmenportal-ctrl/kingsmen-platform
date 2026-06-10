export type MapFallbackReasonCode =
  | "OTP_REQUIRED"
  | "CAPTCHA_BLOCKED"
  | "PORTAL_DOWN"
  | "MANUAL_ONLY"
  | "SOURCE_REVIEW_REQUIRED"
  | "OTHER";

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
}

export function buildManualApplicationPackage(input: ManualApplicationPackageInput): ManualApplicationPackage {
  if (!input.applicationId) throw new Error("applicationId is required.");
  if (!input.candidateId) throw new Error("candidateId is required.");
  if (!input.reasonSummary || input.reasonSummary.trim().length < 5) throw new Error("reasonSummary is required.");

  return {
    mapRef: `map_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
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
    packageStatus: "DRAFT"
  };
}