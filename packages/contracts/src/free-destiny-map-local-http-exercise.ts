export const FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_MODULE =
  "BATCH 09 - Local HTTP API Boot Shell / First End-to-End Local HTTP Route Exercise" as const;

export const FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_HOST = "127.0.0.1" as const;

export const FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_WRITE_FLAG =
  "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE" as const;

export const FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_DIRECTORY =
  "data/local/free-destiny-map/http-exercise" as const;

export interface FreeDestinyMapLocalHttpExerciseRequest {
  fullName: "Kingsmen HTTP Demo Candidate";
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

export interface FreeDestinyMapLocalHttpExerciseResponse {
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
