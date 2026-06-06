export type KingsmenFounderProofCentreEntryLinkProof = {
  schema: "kingsmen.founder-proof-centre-entry-link-proof.v1";
  module: "BATCH 27 - Founder Control Plane Proof Centre Entry Link";
  status:
    | "FOUNDER_PROOF_CENTRE_ENTRY_LINK_PROVEN"
    | "FOUNDER_PROOF_CENTRE_ENTRY_LINK_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "local_founder_control_plane_link_only";
  sourcePage: "apps/web/src/app/founder/control-plane/page.tsx";
  targetRoute: "/founder/proof-centre/";
  targetPage: "apps/web/src/app/founder/proof-centre/page.tsx";
  failed: Array<{ name: string; passed: false; detail: string }>;
};
