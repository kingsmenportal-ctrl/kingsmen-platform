export type KingsmenControlPlaneProofCard = {
  id: string;
  title: string;
  badge: "PROVEN" | "FAILED" | "UNKNOWN";
  tone: "safe" | "danger" | "neutral";
  subtitle: string;
  reportPath: string;
  validationPath: string;
  metrics: Record<string, string | number | boolean | null>;
};

export type KingsmenControlPlaneProofDisplayAdapter = {
  schema: "kingsmen.control-plane-proof-display-adapter.v1";
  module: "BATCH 24 - Smallest Useful Control-Plane Proof Display Adapter";
  generated_at: string;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "local_control_plane_display_adapter_only";
  sourceReadModel: string;
  allCardsPassed: boolean;
  noProductionClaim: boolean;
  noOracleClaim: boolean;
  cards: KingsmenControlPlaneProofCard[];
  founderWarning: string;
  nextAction: string;
};
