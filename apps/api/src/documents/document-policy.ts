import type { KingsmenDocumentType } from "./document-types";

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export interface DocumentUploadPolicyInput {
  documentType: KingsmenDocumentType;
  mimeType: string;
  fileSizeBytes: number;
  originalFilename: string;
  sourceChannel?: string;
}

export interface DocumentUploadPolicyDecision {
  allowed: boolean;
  reasons: string[];
  protectedData: boolean;
  operatorReviewRequired: boolean;
}

export function evaluateDocumentUploadPolicy(input: DocumentUploadPolicyInput): DocumentUploadPolicyDecision {
  const reasons: string[] = [];
  let allowed = true;
  let operatorReviewRequired = false;

  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(input.mimeType as any)) {
    allowed = false;
    reasons.push(`Unsupported document type: ${input.mimeType}.`);
  }

  if (input.fileSizeBytes <= 0) {
    allowed = false;
    reasons.push("Document file is empty.");
  }

  if (input.fileSizeBytes > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    allowed = false;
    reasons.push("Document file exceeds the starting Oracle Lite upload limit.");
  }

  if (!input.originalFilename || input.originalFilename.trim().length < 2) {
    allowed = false;
    reasons.push("Original filename is required.");
  }

  if (input.sourceChannel === "WHATSAPP_URGENT") {
    operatorReviewRequired = true;
    reasons.push("WhatsApp document intake is urgent-only and requires operator review.");
  }

  if (allowed && reasons.length === 0) {
    reasons.push("Document upload follows Kingsmen Document Vault policy.");
  }

  return {
    allowed,
    reasons,
    protectedData: true,
    operatorReviewRequired
  };
}

export function isSensitiveDocumentType(documentType: KingsmenDocumentType): boolean {
  return [
    "ID_DOCUMENT",
    "BANK_LETTER",
    "PARENT_GUARDIAN_ID",
    "PAYSLIP",
    "NSFAS_DOCUMENT"
  ].includes(documentType);
}