import type { DocumentReadinessSnapshot } from "../documents/document-types";

export type CandidateIdentityLinkStatus = "VERIFIED" | "PENDING" | "REJECTED" | "MISSING";
export type CandidateProfileReadinessStatus = "READY" | "ACTION_REQUIRED" | "BLOCKED";

export interface CandidateProfileReadinessInput {
  candidateId: string;
  accountStatus: "ACTIVE" | "DISABLED" | "SUSPENDED";
  identityLinkStatus: CandidateIdentityLinkStatus;
  requiredFields: string[];
  profileFields: Record<string, string | null | undefined>;
  documentReadiness: DocumentReadinessSnapshot;
}

export interface CandidateProfileReadiness {
  candidateId: string;
  status: CandidateProfileReadinessStatus;
  ready: boolean;
  blockers: string[];
  missingFields: string[];
  nextActions: string[];
}

export function evaluateCandidateProfileReadiness(
  input: CandidateProfileReadinessInput
): CandidateProfileReadiness {
  if (!input.candidateId.trim()) throw new Error("CANDIDATE_ID_REQUIRED");
  if (input.documentReadiness.candidateId !== input.candidateId) {
    throw new Error("DOCUMENT_READINESS_OWNERSHIP_MISMATCH");
  }

  const blockers: string[] = [];
  const missingFields = [...new Set(input.requiredFields)]
    .filter((field) => typeof input.profileFields[field] !== "string" || !input.profileFields[field]!.trim());

  if (input.accountStatus !== "ACTIVE") blockers.push("CANDIDATE_ACCOUNT_NOT_ACTIVE");
  if (input.identityLinkStatus !== "VERIFIED") blockers.push(`IDENTITY_LINK_${input.identityLinkStatus}`);
  if (input.documentReadiness.readinessStatus === "REVIEW_REQUIRED") blockers.push("DOCUMENT_REVIEW_REQUIRED");

  const nextActions: string[] = [];
  if (input.accountStatus !== "ACTIVE") nextActions.push("Contact support to restore account access.");
  if (input.identityLinkStatus !== "VERIFIED") nextActions.push("Complete identity verification before accessing protected candidate workflows.");
  if (missingFields.length > 0) nextActions.push(`Complete profile fields: ${missingFields.join(", ")}.`);
  if (input.documentReadiness.readinessStatus !== "READY") {
    nextActions.push(input.documentReadiness.readinessStatus === "REVIEW_REQUIRED"
      ? "Resolve document review items."
      : `Complete required documents: ${input.documentReadiness.missingDocumentTypes.join(", ")}.`);
  }

  const status: CandidateProfileReadinessStatus =
    input.accountStatus !== "ACTIVE" || input.identityLinkStatus === "REJECTED" || input.identityLinkStatus === "MISSING"
      ? "BLOCKED"
      : blockers.length > 0 || missingFields.length > 0 || input.documentReadiness.readinessStatus !== "READY"
        ? "ACTION_REQUIRED"
        : "READY";

  return {
    candidateId: input.candidateId,
    status,
    ready: status === "READY",
    blockers,
    missingFields,
    nextActions
  };
}
