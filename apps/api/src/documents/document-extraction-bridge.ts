import type { CandidateProfileFieldSource } from "../candidate/candidate-types";
import type { DocumentFileRecord } from "./document-types";

export interface DocumentExtractionField {
  fieldName: string;
  proposedValue?: string;
  valueSummary: string;
  confidenceBand: "LOW" | "MEDIUM" | "HIGH" | "REVIEW_REQUIRED";
}

export function mapDocumentExtractionToCandidateFieldSources(input: {
  document: DocumentFileRecord;
  fields: DocumentExtractionField[];
}): CandidateProfileFieldSource[] {
  return input.fields.map((field) => ({
    fieldName: field.fieldName,
    proposedValue: field.proposedValue,
    valueSummary: field.valueSummary,
    sourceType: input.document.documentType === "CV" ? "CV" : mapSourceType(input.document.documentType),
    sourceRef: input.document.documentRef,
    sourceEvidenceRef: input.document.evidenceRef,
    confidenceBand: field.confidenceBand,
    candidateConfirmed: false,
    operatorReviewRequired:
      field.confidenceBand === "LOW" ||
      field.confidenceBand === "REVIEW_REQUIRED" ||
      input.document.verificationStatus === "REVIEW_REQUIRED"
  }));
}

function mapSourceType(documentType: DocumentFileRecord["documentType"]): CandidateProfileFieldSource["sourceType"] {
  if (documentType === "ID_DOCUMENT") return "ID_DOCUMENT";
  if (documentType === "MATRIC_CERTIFICATE" || documentType === "ACADEMIC_RECORD") return "ACADEMIC_RECORD";
  if (documentType === "PROOF_OF_ADDRESS") return "PROOF_OF_ADDRESS";
  if (documentType === "BANK_LETTER") return "BANK_LETTER";
  return "SYSTEM";
}