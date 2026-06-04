export type N05StorageBoundary = {
  storageRef: string;
  candidateId: string;
  privateStorageRequired: true;
  signedUploadRequired: true;
  signedReadRequired: true;
  rawPublicAccessAllowed: false;
  serviceRoleBackendOnly: true;
  browserReceivesSignedUrlOnly: true;
  expiresAt: string;
  productionReady: false;
};