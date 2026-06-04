export const N04_SIX_GATES = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
] as const;

export function assertN04CandidateIntakeSafe(input: {
  visibleGates: string[];
  assessableGates: string[];
  packageControlsIntensityNotGateAccess: boolean;
  candidateAction?: string;
}) {
  for (const gate of N04_SIX_GATES) {
    if (!input.visibleGates.includes(gate)) {
      throw new Error(`N04 intake blocked: gate not visible: ${gate}`);
    }

    if (!input.assessableGates.includes(gate)) {
      throw new Error(`N04 intake blocked: gate not assessable: ${gate}`);
    }
  }

  if (input.packageControlsIntensityNotGateAccess !== true) {
    throw new Error("N04 intake blocked: package must control intensity, not gate access");
  }

  if (["mark_paid", "mark_submitted", "verify_outcome"].includes(input.candidateAction || "")) {
    throw new Error(`N04 candidate cannot self-verify: ${input.candidateAction}`);
  }

  return true;
}