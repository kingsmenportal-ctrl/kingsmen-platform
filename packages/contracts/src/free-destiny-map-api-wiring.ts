export const FREE_DESTINY_MAP_PUBLIC_ROUTE = "/free-destiny-map" as const;

export const FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT = "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_LOCAL_WRITE_FLAG = "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE" as const;

export const FREE_DESTINY_MAP_API_WIRING_NOTICE =
  "This public form wiring targets a local intake shell. It is not production storage, not payment, not email delivery, not document upload, and not official application submission.";

export interface FreeDestinyMapClientSubmission {
  fullName?: string;
  province?: string;
  currentSituation?: string;
  knownRoute?: string;
  routeInterests?: string[];
  needsAccommodation?: boolean;
  accommodationArea?: string;
  needsFundingHelp?: boolean;
  needsCvHelp?: boolean;
  hasDocumentsReady?: boolean;
  randomSourceName?: string;
  consentToBeContacted?: boolean;
  consentToProcessBasicInfo?: boolean;
}

export interface FreeDestinyMapClientResponse {
  accepted: boolean;
  reference: string;
  productionReady: false;
  localPersistenceEnabled?: boolean;
  localWriteAttempted?: boolean;
  localWriteSucceeded?: boolean;
  storageMode?: "disabled" | "local_jsonl_shell";
  safeNotice: string;
  nextAction: string;
  issues: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}
