export type KingsmenFreeDestinyMapIntakeRuntimeReachabilityProof = {
  schema: "kingsmen.free-destiny-map-intake-runtime-reachability-proof.v1";
  module: "BATCH 34 - Free Destiny Map Intake Local Runtime Reachability Proof";
  status:
    | "FREE_DESTINY_MAP_INTAKE_RUNTIME_REACHABLE_LOCAL"
    | "FREE_DESTINY_MAP_INTAKE_RUNTIME_REACHABILITY_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  startsDocker: true;
  touchesSecrets: false;
  touchesCandidateData: false;
  storesCandidateData: false;
  sendsCandidateData: false;
  touchesContactData: false;
  touchesPayments: false;
  touchesMessaging: false;
  composeUpSucceeded: boolean;
  composeDownSucceeded: boolean;
  pageStatus: number;
  sourceRoute: "/free-destiny-map/";
  sourcePage: "apps/web/src/app/free-destiny-map/page.tsx";
  failed: Array<{ name: string; passed: false; detail: string }>;
};
