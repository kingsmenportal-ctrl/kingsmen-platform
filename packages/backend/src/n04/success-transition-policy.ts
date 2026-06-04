export function assertN04SuccessTransitionSafe(input: {
  outcomeId?: string;
  proofId?: string;
  nextMode: string;
  consentId?: string;
  publicStoryRequested?: boolean;
}) {
  if (!input.outcomeId || !input.proofId) {
    throw new Error("N04 success transition requires proven outcome");
  }

  if (input.publicStoryRequested === true && !input.consentId) {
    throw new Error("N04 success transition public story requires consent");
  }

  return true;
}