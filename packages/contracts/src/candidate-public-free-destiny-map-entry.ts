export type KingsmenCandidatePublicFreeDestinyMapEntryProof = {
  schema: "kingsmen.candidate-public-free-destiny-map-entry-proof.v1";
  module: "BATCH 32 - Candidate Public Entry to Free Destiny Map";
  status:
    | "CANDIDATE_PUBLIC_FREE_DESTINY_MAP_ENTRY_PROVEN"
    | "CANDIDATE_PUBLIC_FREE_DESTINY_MAP_ENTRY_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  startsDocker: false;
  sourcePage: "apps/web/src/app/kingsmen/page.tsx";
  targetPage: "apps/web/src/app/free-destiny-map/page.tsx";
  sourceRoute: "/kingsmen";
  targetRoute: "/free-destiny-map/";
  failed: Array<{ name: string; passed: false; detail: string }>;
};
