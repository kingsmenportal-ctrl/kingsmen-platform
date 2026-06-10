import type { DocumentPriority, DocumentRequestRecord, KingsmenDocumentType } from "./document-types";

export interface BuildDocumentRequestInput {
  candidateId: string;
  applicationId?: string;
  documentType: KingsmenDocumentType;
  reason: string;
  requirementSource?: string;
  sourceUrl?: string;
  priority?: DocumentPriority;
}

export function createDocumentRequest(input: BuildDocumentRequestInput): DocumentRequestRecord {
  if (!input.candidateId) throw new Error("candidateId is required.");
  if (!input.documentType) throw new Error("documentType is required.");
  if (!input.reason || input.reason.trim().length < 5) throw new Error("Document request reason is required.");

  return {
    requestRef: `docreq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    documentType: input.documentType,
    reason: input.reason,
    requirementSource: input.requirementSource ?? "KINGSMEN",
    sourceUrl: input.sourceUrl,
    priority: input.priority ?? "NORMAL",
    requestStatus: "OPEN"
  };
}

export function createCoreDocumentRequests(candidateId: string): DocumentRequestRecord[] {
  return [
    createDocumentRequest({
      candidateId,
      documentType: "CV",
      reason: "Needed to extract work history, skills, education, and candidate profile fields.",
      priority: "HIGH"
    }),
    createDocumentRequest({
      candidateId,
      documentType: "ID_DOCUMENT",
      reason: "Needed to verify identity and prepare official application profiles.",
      priority: "HIGH"
    }),
    createDocumentRequest({
      candidateId,
      documentType: "MATRIC_CERTIFICATE",
      reason: "Needed to assess education readiness and route eligibility.",
      priority: "HIGH"
    }),
    createDocumentRequest({
      candidateId,
      documentType: "PROOF_OF_ADDRESS",
      reason: "Needed for accommodation, bursary, and candidate profile readiness.",
      priority: "NORMAL"
    })
  ];
}