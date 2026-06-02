export const FREE_DESTINY_MAP_BROWSER_STYLE_SUBMIT_MODULE =
  "BATCH 11 - Real Local App Build Validator / Browser-Style Form Submit Proof" as const;

export const FREE_DESTINY_MAP_BROWSER_STYLE_WEB_ROUTE = "/free-destiny-map" as const;

export const FREE_DESTINY_MAP_BROWSER_STYLE_API_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_BROWSER_STYLE_WRITE_FLAG =
  "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE" as const;

export const FREE_DESTINY_MAP_BROWSER_STYLE_DIRECTORY =
  "data/local/free-destiny-map/browser-style-submit" as const;

export interface FreeDestinyMapBrowserStyleSubmitPayload {
  fullName: "Kingsmen Browser Demo Candidate";
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

export interface FreeDestinyMapBrowserStyleSubmitResponse {
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
