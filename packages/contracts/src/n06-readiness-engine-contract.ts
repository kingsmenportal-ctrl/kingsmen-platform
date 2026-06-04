export type N06ReadinessStatus =
  | "not_ready"
  | "needs_documents"
  | "needs_source_verification"
  | "needs_payment"
  | "ready_for_workbench"
  | "ready_for_submission"
  | "blocked";

export type N06CandidateRouteReadiness = {
  candidateId: string;
  routeId: string;
  gate: string;
  knownRoute: boolean;
  documentReady: boolean;
  sourceVerified: boolean;
  paymentReady: boolean;
  deadlineRisk: boolean;
  readinessStatus: N06ReadinessStatus;
  blockers: string[];
  packageControlsIntensityNotGateAccess: true;
  capLimitsVolumeNotCapability: true;
  productionReady: false;
};