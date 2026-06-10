import type { DocumentFileRecord } from "./document-types";
import { isSensitiveDocumentType } from "./document-policy";

export type DocumentVerificationType =
  | "FILE_INTEGRITY"
  | "TYPE_MATCH"
  | "IDENTITY_MATCH"
  | "EXPIRY_CHECK"
  | "ACADEMIC_MATCH"
  | "SOURCE_MATCH"
  | "MANUAL_REVIEW";

export interface DocumentVerificationDecision {
  verificationType: DocumentVerificationType;
  status: "PENDING" | "PASSED" | "FAILED" | "REVIEW_REQUIRED" | "WAIVED";
  resultSummary: string;
  operatorReviewRequired: boolean;
}

export function evaluateBasicDocumentVerification(document: DocumentFileRecord): DocumentVerificationDecision[] {
  const decisions: DocumentVerificationDecision[] = [];

  decisions.push({
    verificationType: "FILE_INTEGRITY",
    status: document.checksumSha256 ? "PASSED" : "REVIEW_REQUIRED",
    resultSummary: document.checksumSha256
      ? "Checksum is present for file integrity tracking."
      : "Checksum is missing and must be recorded.",
    operatorReviewRequired: !document.checksumSha256
  });

  decisions.push({
    verificationType: "TYPE_MATCH",
    status: document.mimeType && document.originalFilename ? "PASSED" : "FAILED",
    resultSummary: "Document MIME type and filename were checked.",
    operatorReviewRequired: false
  });

  if (isSensitiveDocumentType(document.documentType)) {
    decisions.push({
      verificationType: "MANUAL_REVIEW",
      status: "REVIEW_REQUIRED",
      resultSummary: "Sensitive document type requires operator review before trust upgrade.",
      operatorReviewRequired: true
    });
  }

  return decisions;
}

export function shouldBlockAutomaticSubmission(decisions: DocumentVerificationDecision[]): boolean {
  return decisions.some((decision) => decision.status === "FAILED" || decision.status === "REVIEW_REQUIRED");
}