export type KingsmenProofCentreRegistryRuntimeRefreshProof = {
  schema: "kingsmen.proof-centre-registry-runtime-refresh-proof.v1";
  module: "BATCH 30 - Proof Centre Registry Runtime Refresh Proof";
  status:
    | "PROOF_CENTRE_REGISTRY_RUNTIME_REFRESH_PROVEN"
    | "PROOF_CENTRE_REGISTRY_RUNTIME_REFRESH_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "controlled_local_docker_runtime_proof_centre_registry_render_proof";
  webBuildSucceeded: boolean;
  composeUpSucceeded: boolean;
  composeDownSucceeded: boolean;
  apiHealthStatus: number;
  proofCentreStatus: number;
  renderedBatchCount: number;
  allEightBatchesRendered: boolean;
  portsReleasedAfterDown: boolean;
  failed: Array<{ name: string; passed: false; detail: string }>;
};
