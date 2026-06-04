export type N05SignedUploadRequest = {
  candidateId: string;
  documentTypeCode: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  requestedByActorType: "candidate" | "founder" | "operator" | "system" | "worker";
  auditId: string;
};

export type N05SignedUploadResponse = {
  uploadId: string;
  candidateId: string;
  storageRef: string;
  signedUploadUrl: string;
  expiresAt: string;
  rawPublicUrlAllowed: false;
  serviceRoleVisibleToBrowser: false;
  productionReady: false;
};

export type N05SignedReadRequest = {
  candidateId: string;
  documentId: string;
  requestedByActorType: "candidate" | "founder" | "operator" | "system" | "worker";
  auditId: string;
};

export type N05SignedReadResponse = {
  documentId: string;
  candidateId: string;
  signedReadUrl: string;
  expiresAt: string;
  rawPublicUrlAllowed: false;
  productionReady: false;
};