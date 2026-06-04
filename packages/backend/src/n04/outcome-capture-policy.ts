export function assertN04OutcomeCaptureSafe(input: {
  outcomeType: string;
  proofId?: string;
  evidenceId?: string;
  publicStoryRequested?: boolean;
  publicStoryConsentId?: string;
  guaranteeLanguageUsed?: boolean;
}) {
  if (!input.proofId || !input.evidenceId) {
    throw new Error("N04 outcome capture requires proof and evidence");
  }

  if (input.publicStoryRequested === true && !input.publicStoryConsentId) {
    throw new Error("N04 public success story requires proof and consent");
  }

  if (input.guaranteeLanguageUsed === true) {
    throw new Error("N04 outcome messaging blocked: no guarantee language allowed");
  }

  return true;
}