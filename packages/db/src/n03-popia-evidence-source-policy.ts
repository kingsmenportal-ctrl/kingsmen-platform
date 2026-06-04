export const N03_POPIA_EVIDENCE_SOURCE_POLICY = {
  productionReady: false,
  popiaAccessLogAppendFirst: true,
  evidenceImmutableAppendFirst: true,
  evidenceDeleteBlocked: true,
  evidenceOverwriteBlocked: true,
  sourceConfidenceBandsRequired: true,
  officialInstructionsRequireVerifiedSource: true,
  candidateDataAccessMustBeLogged: true
} as const;

export function assertN03PopiaEvidenceSourcePolicySafe() {
  if (N03_POPIA_EVIDENCE_SOURCE_POLICY.productionReady !== false) {
    throw new Error("N03 POPIA/evidence/source policy cannot claim productionReady=true");
  }

  return true;
}