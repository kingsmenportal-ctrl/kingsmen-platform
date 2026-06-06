export type KingsmenFounderControlPlaneEntryLinkRuntimeProof = {
  schema: "kingsmen.founder-control-plane-entry-link-runtime-proof.v1";
  module: "BATCH 28 - Founder Control Plane Entry Link Runtime Proof";
  status:
    | "FOUNDER_CONTROL_PLANE_ENTRY_LINK_RUNTIME_PROVEN"
    | "FOUNDER_CONTROL_PLANE_ENTRY_LINK_RUNTIME_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "controlled_local_docker_runtime_ui_navigation_proof";
  composeUpSucceeded: boolean;
  composeDownSucceeded: boolean;
  webBuildSucceeded: boolean;
  apiHealthStatus: number;
  controlPlaneStatus: number;
  proofCentreStatus: number;
  entryLinkRendered: boolean;
  targetRouteReached: boolean;
  failed: Array<{ name: string; passed: false; detail: string }>;
};
