export type KingsmenProofCentreRegistryEntry = {
  id: string;
  batch: string;
  title: string;
  label: string;
  status: "PROVEN" | "FAILED" | "MISSING";
  proofStatus: string;
  validationStatus: string;
  proofPath: string;
  validationPath: string;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  metrics: Record<string, string | number | boolean | null>;
};

export type KingsmenProofCentreRegistry = {
  schema: "kingsmen.proof-centre-registry.v1";
  module: "BATCH 29 - Proof Centre Registry Refresh";
  generated_at: string;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "local_proof_registry_refresh_only";
  allEntriesProven: boolean;
  entryCount: number;
  entries: KingsmenProofCentreRegistryEntry[];
  pagePath: "apps/web/src/app/founder/proof-centre/page.tsx";
};

export type KingsmenProofCentreRegistryRefreshProof = {
  schema: "kingsmen.proof-centre-registry-refresh-proof.v1";
  module: "BATCH 29 - Proof Centre Registry Refresh";
  status:
    | "PROOF_CENTRE_REGISTRY_REFRESH_PROVEN"
    | "PROOF_CENTRE_REGISTRY_REFRESH_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  registryPath: string;
  pagePath: string;
  failed: Array<{ name: string; passed: false; detail: string }>;
};
