import type { CandidateDocumentType } from "./candidate-document-vault";

export const MAX_CANDIDATE_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const ALLOWED_CANDIDATE_DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png"
] as const;
export type AllowedCandidateDocumentContentType = typeof ALLOWED_CANDIDATE_DOCUMENT_CONTENT_TYPES[number];

export interface CandidateDocumentUploadIntent {
  candidateId: string;
  authUserId: string;
  documentType: CandidateDocumentType;
  displayName: string;
  contentType: string;
  byteSize: number;
  correlationId: string;
}

export interface CandidateDocumentUploadPlan {
  candidateId: string;
  authUserId: string;
  documentType: CandidateDocumentType;
  displayName: string;
  contentType: AllowedCandidateDocumentContentType;
  byteSize: number;
  correlationId: string;
  storageObjectKey: string;
  expiresInSeconds: 300;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_DISPLAY_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._()\-]{0,179}$/u;
const CORRELATION_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,119}$/;
const DOCUMENT_TYPES = new Set<CandidateDocumentType>([
  "IDENTITY", "ACADEMIC", "CV", "PROOF_OF_ADDRESS", "FINANCIAL", "CONSENT", "OTHER"
]);

/**
 * Creates a validated upload plan only after a trusted server has resolved the
 * candidate from verified auth identity and confirmed candidateId ownership.
 * This function does not sign URLs or access storage.
 */
export function buildCandidateDocumentUploadPlan(
  intent: CandidateDocumentUploadIntent,
  generatedObjectId: string
): CandidateDocumentUploadPlan | null {
  if (!UUID.test(intent.authUserId) || !UUID.test(intent.candidateId)) return null;
  if (!UUID.test(generatedObjectId)) return null;
  if (!DOCUMENT_TYPES.has(intent.documentType)) return null;
  if (!ALLOWED_CANDIDATE_DOCUMENT_CONTENT_TYPES.includes(intent.contentType as AllowedCandidateDocumentContentType)) return null;
  if (!Number.isSafeInteger(intent.byteSize) || intent.byteSize < 1 || intent.byteSize > MAX_CANDIDATE_DOCUMENT_BYTES) return null;
  if (!SAFE_DISPLAY_NAME.test(intent.displayName) || intent.displayName.trim() !== intent.displayName) return null;
  if (!CORRELATION_ID.test(intent.correlationId)) return null;

  // Client file names and candidate-provided paths never enter the storage key.
  return {
    candidateId: intent.candidateId,
    authUserId: intent.authUserId,
    documentType: intent.documentType,
    displayName: intent.displayName,
    contentType: intent.contentType as AllowedCandidateDocumentContentType,
    byteSize: intent.byteSize,
    correlationId: intent.correlationId,
    storageObjectKey: `candidate-documents/${intent.candidateId}/${generatedObjectId}`,
    expiresInSeconds: 300
  };
}
