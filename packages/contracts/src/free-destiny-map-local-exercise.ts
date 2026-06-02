export const FREE_DESTINY_MAP_LOCAL_EXERCISE_MODULE =
  "BATCH 08 - Local API Boot Command / First End-to-End Local Route Exercise" as const;

export const FREE_DESTINY_MAP_LOCAL_EXERCISE_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_LOCAL_EXERCISE_WRITE_FLAG =
  "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE" as const;

export const FREE_DESTINY_MAP_LOCAL_EXERCISE_DIRECTORY =
  "data/local/free-destiny-map/exercise" as const;

export interface FreeDestinyMapLocalExercisePayload {
  fullName: "Kingsmen Demo Candidate";
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

export interface FreeDestinyMapLocalExerciseRecord {
  schema: "kingsmen.free-destiny-map.local-exercise-record.v1";
  module: typeof FREE_DESTINY_MAP_LOCAL_EXERCISE_MODULE;
  productionReady: false;
  storesProductionData: false;
  endpoint: typeof FREE_DESTINY_MAP_LOCAL_EXERCISE_ENDPOINT;
  createdAt: string;
  reference: string;
  accepted: boolean;
  payload: FreeDestinyMapLocalExercisePayload;
  safeNotice: string;
}
