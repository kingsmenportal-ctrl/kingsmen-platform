import { randomUUID } from "node:crypto";
import type { DocumentFileRecord, KingsmenDocumentType } from "./document-types";

export interface DocumentStorageIntent {
  candidateId: string;
  applicationId?: string;
  documentType: KingsmenDocumentType;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface PreparedDocumentStorage {
  documentRef: string;
  storageProvider: string;
  storageBucket: string;
  storagePath: string;
  protectedData: true;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export function prepareDocumentStorage(input: DocumentStorageIntent): PreparedDocumentStorage {
  if (!UUID_PATTERN.test(input.candidateId)) throw new Error("candidateId must be a valid UUID.");
  if (input.applicationId !== undefined && !UUID_PATTERN.test(input.applicationId)) {
    throw new Error("applicationId must be a valid UUID.");
  }
  if (!input.documentType) throw new Error("documentType is required.");
  if (typeof input.originalFilename !== "string" || input.originalFilename.trim().length < 2) {
    throw new Error("originalFilename is required.");
  }
  if (input.originalFilename.length > 255 || /[\u0000-\u001f\u007f]/.test(input.originalFilename)) {
    throw new Error("originalFilename is invalid.");
  }
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) throw new Error("Unsupported document MIME type.");
  if (!Number.isSafeInteger(input.fileSizeBytes) || input.fileSizeBytes <= 0 || input.fileSizeBytes > 15 * 1024 * 1024) {
    throw new Error("fileSizeBytes is outside the permitted range.");
  }

  const safeName = input.originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  const documentRef = `doc_${randomUUID()}`;

  return {
    documentRef,
    storageProvider: "LOCAL_OR_SUPABASE",
    storageBucket: "candidate-documents",
    storagePath: `${input.candidateId}/${input.documentType}/${documentRef}-${safeName}`,
    protectedData: true
  };
}

export function buildDocumentRecord(input: DocumentStorageIntent): DocumentFileRecord {
  const storage = prepareDocumentStorage(input);

  return {
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    documentRef: storage.documentRef,
    documentType: input.documentType,
    displayName: `${input.documentType} - ${input.originalFilename}`,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    storageProvider: storage.storageProvider,
    storageBucket: storage.storageBucket,
    storagePath: storage.storagePath,
    protectedData: true,
    sourceChannel: "PORTAL",
    documentStatus: "UPLOADED",
    verificationStatus: "PENDING",
    extractionStatus: "NOT_STARTED"
  };
}