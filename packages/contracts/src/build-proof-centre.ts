export type KingsmenProofGateStatus =
  | "PROVEN"
  | "VALIDATED"
  | "FAILED"
  | "MISSING"
  | "UNKNOWN";

export type KingsmenBuildProofItem = {
  id: string;
  label: string;
  module: string;
  status: string;
  validationStatus: string;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  reportPath: string;
  validationPath: string;
  keyMetrics: Record<string, string | number | boolean | null>;
};

export type KingsmenBuildProofCentreReadModel = {
  schema: "kingsmen.build-proof-centre-read-model.v1";
  module: "BATCH 23 - Build Proof Centre Read Model";
  generated_at: string;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "local_file_read_model_only";
  allProofItemsPassed: boolean;
  noProductionClaim: boolean;
  noOracleClaim: boolean;
  proofItems: KingsmenBuildProofItem[];
  founderSummary: string;
  nextAction: string;
};

export type KingsmenBuildProofCentreProofReport = {
  schema: "kingsmen.build-proof-centre-proof.v1";
  module: "BATCH 23 - Build Proof Centre Read Model";
  status:
    | "BUILD_PROOF_CENTRE_READ_MODEL_PROVEN"
    | "BUILD_PROOF_CENTRE_READ_MODEL_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  generated_at: string;
  readModelPath: string;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
  failed: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
  next_action: string;
};
