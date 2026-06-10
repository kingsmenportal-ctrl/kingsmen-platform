import type { DocumentFileRecord, DocumentReadinessSnapshot, KingsmenDocumentType } from "./document-types";

export const DEFAULT_CORE_DOCUMENT_TYPES: KingsmenDocumentType[] = [
  "CV",
  "ID_DOCUMENT",
  "MATRIC_CERTIFICATE",
  "PROOF_OF_ADDRESS"
];

export function buildDocumentReadinessSnapshot(input: {
  candidateId: string;
  applicationId?: string;
  requiredDocumentTypes?: KingsmenDocumentType[];
  documents: DocumentFileRecord[];
}): DocumentReadinessSnapshot {
  const required = input.requiredDocumentTypes ?? DEFAULT_CORE_DOCUMENT_TYPES;
  const readyDocumentTypes: KingsmenDocumentType[] = [];
  const reviewRequiredDocumentTypes: KingsmenDocumentType[] = [];
  const missingDocumentTypes: KingsmenDocumentType[] = [];

  for (const requiredType of required) {
    const matching = input.documents.filter((document) => document.documentType === requiredType);

    if (matching.length === 0) {
      missingDocumentTypes.push(requiredType);
      continue;
    }

    const ready = matching.some(
      (document) => document.documentStatus === "READY" && document.verificationStatus === "VERIFIED"
    );

    const review = matching.some(
      (document) =>
        document.verificationStatus === "REVIEW_REQUIRED" ||
        document.extractionStatus === "REVIEW_REQUIRED" ||
        document.documentStatus === "PROCESSING"
    );

    if (ready) {
      readyDocumentTypes.push(requiredType);
    } else if (review) {
      reviewRequiredDocumentTypes.push(requiredType);
    } else {
      missingDocumentTypes.push(requiredType);
    }
  }

  const readinessStatus =
    reviewRequiredDocumentTypes.length > 0
      ? "REVIEW_REQUIRED"
      : missingDocumentTypes.length === 0
        ? "READY"
        : readyDocumentTypes.length > 0
          ? "PARTIAL"
          : "MISSING";

  return {
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    readinessStatus,
    missingDocumentTypes,
    readyDocumentTypes,
    reviewRequiredDocumentTypes,
    summary: buildReadinessSummary(readinessStatus, missingDocumentTypes, reviewRequiredDocumentTypes)
  };
}

function buildReadinessSummary(
  status: DocumentReadinessSnapshot["readinessStatus"],
  missing: KingsmenDocumentType[],
  reviewRequired: KingsmenDocumentType[]
): string {
  if (status === "READY") return "Document set is ready.";
  if (status === "REVIEW_REQUIRED") return `Document review required: ${reviewRequired.join(", ")}.`;
  if (status === "PARTIAL") return `Some documents are ready; missing: ${missing.join(", ")}.`;
  return `Missing required documents: ${missing.join(", ")}.`;
}