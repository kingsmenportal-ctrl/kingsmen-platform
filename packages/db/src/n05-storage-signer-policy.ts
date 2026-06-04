export const N05_STORAGE_SIGNER_POLICY = {
  productionReady: false,
  signedUploadRequired: true,
  signedReadRequired: true,
  rawPublicUrlBlocked: true,
  serviceRoleBackendOnly: true,
  browserReceivesSignedUrlOnly: true,
  uploadUrlTtlMinutes: 15,
  readUrlTtlMinutes: 10,
  maxDocumentSizeBytes: 10485760
} as const;

export function assertN05StorageSignerPolicySafe() {
  if (N05_STORAGE_SIGNER_POLICY.productionReady !== false) {
    throw new Error("N05 storage signer policy cannot claim productionReady=true");
  }

  if (N05_STORAGE_SIGNER_POLICY.rawPublicUrlBlocked !== true) {
    throw new Error("N05 raw public URL must remain blocked");
  }

  return true;
}