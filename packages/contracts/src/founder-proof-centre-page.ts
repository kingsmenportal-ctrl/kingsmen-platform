export type KingsmenFounderProofCentrePageCard = {
  id: string;
  title: string;
  badge: "PROVEN" | "FAILED" | "UNKNOWN";
  tone: "safe" | "danger" | "neutral";
  subtitle: string;
  reportPath: string;
  validationPath: string;
  metrics: Record<string, string | number | boolean | null>;
};

export type KingsmenFounderProofCentrePage = {
  schema: "kingsmen.founder-proof-centre-page.v1";
  module: "BATCH 25 - Smallest Founder Control Plane Page Wiring";
  generated_at: string;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "local_static_founder_page_wiring_only";
  routeHint: "/founder/proof-centre/";
  sourceAdapter: string;
  publicAdapterPath: string;
  htmlPath: string;
  allCardsPassed: boolean;
  noProductionClaim: boolean;
  noOracleClaim: boolean;
  cards: KingsmenFounderProofCentrePageCard[];
  founderWarning: string;
  nextAction: string;
};
