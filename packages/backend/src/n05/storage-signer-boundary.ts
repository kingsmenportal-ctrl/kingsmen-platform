import { assertN05DocumentUploadSafe } from "./document-safety-policy";

export function buildN05SignedUpload(input: {
  candidateId: string;
  documentTypeCode: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  auditId: string;
}) {
  if (!input.candidateId || !input.documentTypeCode || !input.auditId) {
    throw new Error("N05 signed upload requires candidateId, documentTypeCode, and auditId");
  }

  assertN05DocumentUploadSafe({
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    rawPublicUrlAllowed: false,
    serviceRoleVisibleToBrowser: false
  });

  const uploadId = `upload_${input.candidateId}_${Date.now()}`;
  const storageRef = `private/candidates/${input.candidateId}/documents/${uploadId}/${input.filename}`;

  return {
    uploadId,
    candidateId: input.candidateId,
    storageRef,
    signedUploadUrl: `SIGNER_RUNTIME_REQUIRED:${storageRef}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    rawPublicUrlAllowed: false,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  } as const;
}

export function buildN05SignedRead(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  candidateId: string;
  ownerCandidateId: string;
  documentId: string;
  auditId: string;
}) {
  if (!input.auditId || !input.documentId) {
    throw new Error("N05 signed read requires auditId and documentId");
  }

  if (input.actorType === "candidate" && input.candidateId !== input.ownerCandidateId) {
    throw new Error("N05 signed read blocked: candidate can read only own document");
  }

  return {
    documentId: input.documentId,
    candidateId: input.ownerCandidateId,
    signedReadUrl: `SIGNER_RUNTIME_REQUIRED:${input.documentId}`,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    rawPublicUrlAllowed: false,
    productionReady: false
  } as const;
}