export type KingsmenFounderProofCentreRuntimeReachabilityReport = {
  schema: "kingsmen.founder-proof-centre-runtime-reachability-proof.v1";
  module: "BATCH 26 - Founder Proof Centre Local Web Runtime Reachability Proof";
  status:
    | "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABLE_LOCAL"
    | "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABILITY_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "local_web_runtime_reachability_only";
  apiHealthStatus: number;
  pageStatus: number;
  adapterStatus: number;
  pageUrl: string;
  adapterUrl: string;
  apiHealthUrl: string;
  webBuildSucceeded: boolean;
  composeUpSucceeded: boolean;
  composeDownSucceeded: boolean;
  portsReleasedAfterDown: boolean;
  failed: Array<{ name: string; passed: false; detail: string }>;
};
