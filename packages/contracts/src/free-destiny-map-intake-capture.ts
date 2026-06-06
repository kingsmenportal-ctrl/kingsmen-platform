export type KingsmenFreeDestinyMapIntakeCaptureProof = {
  schema: "kingsmen.free-destiny-map-intake-capture-proof.v1";
  module: "BATCH 33 - Free Destiny Map Intake Capture Proof";
  status:
    | "FREE_DESTINY_MAP_INTAKE_CAPTURE_PROVEN"
    | "FREE_DESTINY_MAP_INTAKE_CAPTURE_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  startsDocker: false;
  touchesCandidateData: true;
  candidateDataScope: "non_sensitive_static_ui_only_no_submit_no_storage";
  touchesSensitiveCandidateData: false;
  storesCandidateData: false;
  sendsCandidateData: false;
  touchesContactData: false;
  touchesPayments: false;
  touchesMessaging: false;
  sourceRoute: "/free-destiny-map/";
  sourcePage: "apps/web/src/app/free-destiny-map/page.tsx";
  failed: Array<{ name: string; passed: false; detail: string }>;
};
