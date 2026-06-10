export type KingsmenDocumentType =
  | "CV"
  | "ID_DOCUMENT"
  | "MATRIC_CERTIFICATE"
  | "ACADEMIC_RECORD"
  | "PROOF_OF_ADDRESS"
  | "BANK_LETTER"
  | "PARENT_GUARDIAN_ID"
  | "PAYSLIP"
  | "AFFIDAVIT"
  | "APPLICATION_PROOF"
  | "NSFAS_DOCUMENT"
  | "OTHER";

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "REJECTED" | "ARCHIVED" | "DELETED";
export type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "REVIEW_REQUIRED" | "REJECTED" | "EXPIRED";
export type DocumentExtractionStatus = "NOT_STARTED" | "EXTRACTING" | "EXTRACTED" | "FAILED" | "REVIEW_REQUIRED";
export type DocumentReadinessStatus = "MISSING" | "PARTIAL" | "READY" | "REVIEW_REQUIRED";
export type DocumentPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface DocumentFileRecord {
  id?: string;
  candidateId: string;
  applicationId?: string;
  documentRef: string;
  documentType: KingsmenDocumentType;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256?: string;
  storageProvider: string;
  storageBucket: string;
  storagePath: string;
  protectedData: boolean;
  sourceChannel: "PORTAL" | "EMAIL" | "OPERATOR" | "IMPORT" | "WHATSAPP_URGENT";
  documentStatus: DocumentStatus;
  verificationStatus: DocumentVerificationStatus;
  extractionStatus: DocumentExtractionStatus;
  evidenceRef?: string;
}

export interface DocumentRequestRecord {
  requestRef: string;
  candidateId: string;
  applicationId?: string;
  documentType: KingsmenDocumentType;
  reason: string;
  requirementSource: string;
  sourceUrl?: string;
  priority: DocumentPriority;
  requestStatus: "OPEN" | "FULFILLED" | "WAIVED" | "CANCELLED" | "EXPIRED";
}

export interface DocumentReadinessSnapshot {
  candidateId: string;
  applicationId?: string;
  readinessStatus: DocumentReadinessStatus;
  missingDocumentTypes: KingsmenDocumentType[];
  readyDocumentTypes: KingsmenDocumentType[];
  reviewRequiredDocumentTypes: KingsmenDocumentType[];
  summary: string;
}