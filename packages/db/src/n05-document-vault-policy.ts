export const N05_DOCUMENT_VAULT_POLICY = {
  productionReady: false,
  signedUploadBoundaryBuilt: true,
  privateStorageRequired: true,
  rawPublicFileAccessBlocked: true,
  candidateCanViewOwnDocuments: true,
  candidateCannotVerifyDocuments: true,
  ocrAssistiveOnly: true,
  fraudReviewRequiresEvidence: true,
  riskyDocumentRequiresHumanReview: true,
  documentStatusRequiresProof: true
} as const;

export function assertN05DocumentVaultPolicySafe() {
  if (N05_DOCUMENT_VAULT_POLICY.productionReady !== false) {
    throw new Error("N05 document vault policy cannot claim productionReady=true");
  }

  return true;
}