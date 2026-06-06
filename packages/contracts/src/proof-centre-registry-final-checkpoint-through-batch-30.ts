export type KingsmenProofCentreRegistryFinalCheckpointThroughBatch30Proof = {
  schema: "kingsmen.proof-centre-registry-final-checkpoint-through-batch-30-proof.v1";
  module: "BATCH 31 - Proof Centre Registry Final Checkpoint Through BATCH 30";
  status:
    | "PROOF_CENTRE_REGISTRY_FINAL_CHECKPOINT_THROUGH_BATCH_30_PROVEN"
    | "PROOF_CENTRE_REGISTRY_FINAL_CHECKPOINT_THROUGH_BATCH_30_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  startsDocker: false;
  expectedEntryCount: 10;
  entryCount: number;
  allEntriesPresentInRegistry: boolean;
  allEntriesPresentInPage: boolean;
  allEntriesProven: boolean;
  registryPath: "reports/control-plane/proof-centre-registry.json";
  pagePath: "apps/web/src/app/founder/proof-centre/page.tsx";
  failed: Array<{ name: string; passed: false; detail: string }>;
};
