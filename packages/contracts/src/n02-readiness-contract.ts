export type KingsmenBackendReadiness = {
  schema: "kingsmen.n02-readiness.v1";
  readyForNextLayer: boolean;
  productionReady: false;
  n00ConstitutionProofPresent: boolean;
  n02Kernel01ProofPresent: boolean;
  n02Kernel02ProofPresent: boolean;
  livePaymentsAllowed: false;
  liveEmailAllowed: false;
  officialSubmissionsAllowed: false;
  rawShellAllowed: false;
  nextAction: string;
  checkedAt: string;
};