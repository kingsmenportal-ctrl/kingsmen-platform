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

export type FreeDestinyMapLocalStatus =
  | "LOCAL_SHELL_RECEIVED"
  | "LOCAL_SHELL_ACCEPTED"
  | "LOCAL_SHELL_REJECTED"
  | "LOCAL_SHELL_WRITE_DISABLED";

export interface FreeDestinyMapAuditEvent {
  eventType: string;
  message: string;
  occurredAt: string;
  productionReady: false;
}

export interface StoredFreeDestinyMapIntakeSummary {
  reference: string;
  status: FreeDestinyMapLocalStatus;
  createdAt: string;
  productionReady: false;
  storesProductionData: false;
  payload: FreeDestinyMapIntakePayload;
  result: FreeDestinyMapIntakeResult;
  auditEvents: FreeDestinyMapAuditEvent[];
}

export interface FreeDestinyMapPersistenceResult {
  accepted: boolean;
  reference: string;
  productionReady: false;
  localPersistenceEnabled: boolean;
  localWriteAttempted: boolean;
  localWriteSucceeded: boolean;
  storageMode: "disabled" | "local_jsonl_shell";
  safeNotice: string;
  nextAction: string;
  issues: FreeDestinyMapIntakeResult["issues"];
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

export const FREE_DESTINY_MAP_LOCAL_PERSISTENCE_NOTICE =
  "Local persistence is a development/runtime shell only. It is not production database storage, not official submission, not payment, not email delivery, and not document upload.";

export function createFreeDestinyReference(seed: string): string {
  const cleanSeed = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "GUEST";
  return `KM-FDM-${cleanSeed}`;
}

export function hasMinimumFreeDestinyConsent(payload: FreeDestinyMapIntakePayload): boolean {
  return payload.consentToBeContacted === true && payload.consentToProcessBasicInfo === true;
}

export function buildFreeDestinyMapAuditEvent(eventType: string, message: string): FreeDestinyMapAuditEvent {
  return {
    eventType,
    message,
    occurredAt: new Date().toISOString(),
    productionReady: false
  };
}
