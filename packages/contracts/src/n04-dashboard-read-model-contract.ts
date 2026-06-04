export type N04DashboardGateCard = {
  gate: "higher_education" | "tvet" | "seta_learnership" | "internship" | "apprenticeship" | "employment";
  visible: true;
  assessable: true;
  status: "not_started" | "in_review" | "ready" | "active" | "blocked" | "completed";
  candidateSafeSummary: string;
};

export type N04CandidateDashboardReadModel = {
  schema: "kingsmen.n04-dashboard-read-model.v1";
  candidateId: string;
  displayName?: string;
  lifecycleState: string;
  packageName?: string;
  packageControlsIntensityNotGateAccess: true;
  gates: N04DashboardGateCard[];
  serviceRoleVisibleToBrowser: false;
  truthAuthorityActionsAvailableInBrowser: false;
  productionReady: false;
};