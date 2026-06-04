export type KingsmenSixGate =
  | "higher_education"
  | "tvet"
  | "seta_learnership"
  | "internship"
  | "apprenticeship"
  | "employment";

export type N03SixGateVisibilityRule = {
  candidateId: string;
  visibleGates: KingsmenSixGate[];
  assessableGates: KingsmenSixGate[];
  packageControlsIntensityNotGateAccess: true;
  gatesHiddenByPackage: false;
  capLimitsVolumeNotCapability: true;
};