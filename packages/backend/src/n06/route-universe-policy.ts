export const N06_ROUTE_GATES = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
] as const;

export function assertN06RouteUniverseSafe(input: {
  visibleGates: string[];
  assessableGates: string[];
  packageControlsIntensityNotGateAccess: boolean;
  capLimitsVolumeNotCapability: boolean;
}) {
  for (const gate of N06_ROUTE_GATES) {
    if (!input.visibleGates.includes(gate)) {
      throw new Error(`N06 route universe blocked: missing visible gate ${gate}`);
    }

    if (!input.assessableGates.includes(gate)) {
      throw new Error(`N06 route universe blocked: missing assessable gate ${gate}`);
    }
  }

  if (input.packageControlsIntensityNotGateAccess !== true) {
    throw new Error("N06 package must control service intensity, not route gate access");
  }

  if (input.capLimitsVolumeNotCapability !== true) {
    throw new Error("N06 cap must limit volume, not route capability");
  }

  return true;
}