export const KINGSMEN_SIX_GATES = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
] as const;

export function assertSixGateVisibility(input: {
  visibleGates: string[];
  assessableGates: string[];
  packageControlsIntensityNotGateAccess: boolean;
  gatesHiddenByPackage: boolean;
  capLimitsVolumeNotCapability: boolean;
}) {
  for (const gate of KINGSMEN_SIX_GATES) {
    if (!input.visibleGates.includes(gate)) {
      throw new Error(`Gate must remain visible: ${gate}`);
    }
    if (!input.assessableGates.includes(gate)) {
      throw new Error(`Gate must remain assessable: ${gate}`);
    }
  }

  if (input.packageControlsIntensityNotGateAccess !== true) {
    throw new Error("Package must control intensity, not gate access");
  }

  if (input.gatesHiddenByPackage !== false) {
    throw new Error("Package must not hide gates");
  }

  if (input.capLimitsVolumeNotCapability !== true) {
    throw new Error("Cap limits volume, not capability");
  }

  return true;
}