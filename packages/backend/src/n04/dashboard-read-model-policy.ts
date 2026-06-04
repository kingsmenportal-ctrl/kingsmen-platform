export const N04_PORTAL_GATES = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
] as const;

export function buildN04CandidateDashboardReadModel(input: {
  candidateId: string;
  displayName?: string;
  lifecycleState: string;
  packageName?: string;
}) {
  if (!input.candidateId || !input.lifecycleState) {
    throw new Error("N04 dashboard read model requires candidateId and lifecycleState");
  }

  return {
    schema: "kingsmen.n04-dashboard-read-model.v1",
    candidateId: input.candidateId,
    displayName: input.displayName,
    lifecycleState: input.lifecycleState,
    packageName: input.packageName,
    packageControlsIntensityNotGateAccess: true,
    gates: N04_PORTAL_GATES.map((gate) => ({
      gate,
      visible: true,
      assessable: true,
      status: "not_started",
      candidateSafeSummary: "Available for assessment. Package changes service intensity, not access."
    })),
    serviceRoleVisibleToBrowser: false,
    truthAuthorityActionsAvailableInBrowser: false,
    productionReady: false
  } as const;
}