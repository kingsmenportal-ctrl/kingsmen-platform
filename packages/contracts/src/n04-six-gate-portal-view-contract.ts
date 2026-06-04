export type N04SixGatePortalView = {
  schema: "kingsmen.n04-six-gate-portal-view.v1";
  candidateId: string;
  visibleGates: [
    "higher_education",
    "tvet",
    "seta_learnership",
    "internship",
    "apprenticeship",
    "employment"
  ];
  assessableGates: [
    "higher_education",
    "tvet",
    "seta_learnership",
    "internship",
    "apprenticeship",
    "employment"
  ];
  gatesHiddenByPackage: false;
  capLimitsVolumeNotCapability: true;
  productionReady: false;
};