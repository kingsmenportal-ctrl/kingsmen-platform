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

export function prepareDocumentStorage(input: DocumentStorageIntent): PreparedDocumentStorage {
  if (!input.candidateId) throw new Error("candidateId is required.");
  if (!input.documentType) throw new Error("documentType is required.");
  if (!input.originalFilename) throw new Error("originalFilename is required.");

  const safeName = input.originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  const documentRef = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

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