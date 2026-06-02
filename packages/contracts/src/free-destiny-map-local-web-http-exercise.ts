export const FREE_DESTINY_MAP_LOCAL_WEB_HTTP_EXERCISE_MODULE =
  "BATCH 10 - Local Web-to-HTTP Exercise / Minimal App Boot Proof" as const;

export const FREE_DESTINY_MAP_LOCAL_WEB_HTTP_EXERCISE_HOST = "127.0.0.1" as const;

export const FREE_DESTINY_MAP_LOCAL_WEB_HTTP_EXERCISE_WEB_ROUTE =
  "/free-destiny-map" as const;

export const FREE_DESTINY_MAP_LOCAL_WEB_HTTP_EXERCISE_API_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_LOCAL_WEB_HTTP_EXERCISE_WRITE_FLAG =
  "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE" as const;

export const FREE_DESTINY_MAP_LOCAL_WEB_HTTP_EXERCISE_DIRECTORY =
  "data/local/free-destiny-map/web-http-exercise" as const;

export interface FreeDestinyMapLocalWebHttpExerciseRequest {
  fullName: "Kingsmen Web Demo Candidate";
  province: "KwaZulu-Natal";
  currentSituation: string;
  knownRoute: string;
  routeInterests: string[];
  needsAccommodation: boolean;
  accommodationArea: string;
  needsFundingHelp: boolean;
  needsCvHelp: boolean;
  hasDocumentsReady: boolean;
  randomSourceName: string;
  consentToBeContacted: true;
  consentToProcessBasicInfo: true;
}

export interface FreeDestinyMapLocalWebHttpExerciseResponse {
  accepted: boolean;
  reference: string;
  productionReady: false;
  localPersistenceEnabled: boolean;
  localWriteAttempted: boolean;
  localWriteSucceeded: boolean;
  storageMode: "local_jsonl_shell";
  officialApplicationSubmitted: false;
  paymentInstructionSent: false;
  documentUploadAccepted: false;
  emailSent: false;
  safeNotice: string;
  nextAction: string;
  issues: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}
