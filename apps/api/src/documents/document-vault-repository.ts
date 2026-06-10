import { buildDocumentRecord, type DocumentStorageIntent } from "./document-storage";
import { evaluateDocumentUploadPolicy } from "./document-policy";
import { buildDocumentReadinessSnapshot } from "./document-readiness";
import type { DocumentFileRecord, DocumentReadinessSnapshot, KingsmenDocumentType } from "./document-types";

export interface DocumentVaultWriteResult {
  ok: boolean;
  ref: string;
  message: string;
}

export class DocumentVaultRepository {
  prepareUpload(input: DocumentStorageIntent): DocumentVaultWriteResult {
    const policy = evaluateDocumentUploadPolicy(input);

    if (!policy.allowed) {
      return {
        ok: false,
        ref: "blocked",
        message: policy.reasons.join(" ")
      };
    }

    const document = buildDocumentRecord(input);

    return {
      ok: true,
      ref: document.documentRef,
      message: "Document upload record prepared for private vault storage."
    };
  }

  prepareReadinessSnapshot(input: {
    candidateId: string;
    applicationId?: string;
    requiredDocumentTypes?: KingsmenDocumentType[];
    documents: DocumentFileRecord[];
  }): DocumentReadinessSnapshot {
    return buildDocumentReadinessSnapshot(input);
  }
}