export type N05AllowedMimeType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type N05DocumentSafetyDecision = {
  allowed: boolean;
  reason: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  maxSizeBytes: number;
  rawPublicUrlAllowed: false;
  serviceRoleBackendOnly: true;
  productionReady: false;
};