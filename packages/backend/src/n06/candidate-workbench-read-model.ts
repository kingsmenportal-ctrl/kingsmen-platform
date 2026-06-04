export const N06_WORKBENCH_GATES = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
] as const;

export function buildN06CandidateWorkbenchReadModel(input: {
  candidateId: string;
  packageName?: string;
}) {
  if (!input.candidateId) {
    throw new Error("N06 candidate workbench read model requires candidateId");
  }

  return {
    schema: "kingsmen.n06-candidate-workbench-read-model.v1",
    candidateId: input.candidateId,
    packageName: input.packageName,
    gates: N06_WORKBENCH_GATES.map((gate) => ({
      gate,
      visible: true,
      assessable: true,
      packageControlsIntensityNotGateAccess: true
    })),
    candidateCanVerifySource: false,
    candidateCanMarkPaid: false,
    candidateCanMarkSubmitted: false,
    candidateCanVerifyOutcome: false,
    serviceRoleVisibleToBrowser: false,
    productionReady: false
  } as const;
}