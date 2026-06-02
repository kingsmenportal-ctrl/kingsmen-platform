export type FreeDestinyRouteInterest =
  | "higher_education"
  | "tvet"
  | "seta_learnership"
  | "internship"
  | "apprenticeship"
  | "employment"
  | "nsfas_bursary"
  | "accommodation"
  | "cv_revamp"
  | "documents"
  | "source_check"
  | "phoenix_fallback"
  | "confused_full_map";

export type FreeDestinyUrgency = "normal" | "soon" | "urgent_deadline_risk";

export interface FreeDestinyMapIntakePayload {
  fullName?: string;
  province?: string;
  currentSituation?: string;
  knownRoute?: string;
  routeInterests?: FreeDestinyRouteInterest[];
  urgency?: FreeDestinyUrgency;
  needsAccommodation?: boolean;
  accommodationArea?: string;
  needsFundingHelp?: boolean;
  needsCvHelp?: boolean;
  hasDocumentsReady?: boolean;
  randomSourceName?: string;
  consentToBeContacted?: boolean;
  consentToProcessBasicInfo?: boolean;
}

export interface FreeDestinyMapIntakeValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface FreeDestinyMapIntakeResult {
  accepted: boolean;
  productionReady: false;
  reference: string;
  issues: FreeDestinyMapIntakeValidationIssue[];
  nextAction: string;
  safeNotice: string;
}

export const FREE_DESTINY_MAP_SAFE_NOTICE =
  "This Free Destiny Map intake shell does not submit official applications, take payments, upload documents, guarantee outcomes, or store production data yet.";

export const FREE_DESTINY_MAP_ALLOWED_ROUTE_INTERESTS: FreeDestinyRouteInterest[] = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment",
  "nsfas_bursary",
  "accommodation",
  "cv_revamp",
  "documents",
  "source_check",
  "phoenix_fallback",
  "confused_full_map"
];

export function createFreeDestinyReference(seed: string): string {
  const cleanSeed = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "GUEST";
  return `KM-FDM-${cleanSeed}`;
}

export function hasMinimumFreeDestinyConsent(payload: FreeDestinyMapIntakePayload): boolean {
  return payload.consentToBeContacted === true && payload.consentToProcessBasicInfo === true;
}
