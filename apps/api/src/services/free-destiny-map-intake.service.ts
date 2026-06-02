import {
  FREE_DESTINY_MAP_ALLOWED_ROUTE_INTERESTS,
  FREE_DESTINY_MAP_SAFE_NOTICE,
  createFreeDestinyReference,
  hasMinimumFreeDestinyConsent,
  type FreeDestinyMapIntakePayload,
  type FreeDestinyMapIntakeResult,
  type FreeDestinyMapIntakeValidationIssue,
  type FreeDestinyRouteInterest
} from "../../../../packages/contracts/src/free-destiny-map-intake";

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: unknown): string | undefined {
  if (!isNonEmptyText(value)) return undefined;
  return value.trim().slice(0, 280);
}

function normalizeRouteInterests(value: unknown): FreeDestinyRouteInterest[] {
  if (!Array.isArray(value)) return [];

  const allowed = new Set<string>(FREE_DESTINY_MAP_ALLOWED_ROUTE_INTERESTS);

  return value
    .filter((item): item is string => typeof item === "string")
    .filter((item) => allowed.has(item))
    .slice(0, 8) as FreeDestinyRouteInterest[];
}

export function normalizeFreeDestinyMapIntakePayload(input: unknown): FreeDestinyMapIntakePayload {
  const source = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};

  return {
    fullName: normalizeText(source.fullName),
    province: normalizeText(source.province),
    currentSituation: normalizeText(source.currentSituation),
    knownRoute: normalizeText(source.knownRoute),
    routeInterests: normalizeRouteInterests(source.routeInterests),
    urgency:
      source.urgency === "soon" || source.urgency === "urgent_deadline_risk"
        ? source.urgency
        : "normal",
    needsAccommodation: source.needsAccommodation === true,
    accommodationArea: normalizeText(source.accommodationArea),
    needsFundingHelp: source.needsFundingHelp === true,
    needsCvHelp: source.needsCvHelp === true,
    hasDocumentsReady: source.hasDocumentsReady === true,
    randomSourceName: normalizeText(source.randomSourceName),
    consentToBeContacted: source.consentToBeContacted === true,
    consentToProcessBasicInfo: source.consentToProcessBasicInfo === true
  };
}

export function validateFreeDestinyMapIntakePayload(payload: FreeDestinyMapIntakePayload): FreeDestinyMapIntakeValidationIssue[] {
  const issues: FreeDestinyMapIntakeValidationIssue[] = [];

  if (!hasMinimumFreeDestinyConsent(payload)) {
    issues.push({
      field: "consent",
      code: "CONSENT_REQUIRED",
      message: "Kingsmen needs contact and basic-info processing consent before continuing."
    });
  }

  const hasIntent =
    Boolean(payload.knownRoute) ||
    Boolean(payload.currentSituation) ||
    Boolean(payload.randomSourceName) ||
    Boolean(payload.needsAccommodation) ||
    Boolean(payload.needsFundingHelp) ||
    Boolean(payload.needsCvHelp) ||
    Boolean(payload.hasDocumentsReady) ||
    (payload.routeInterests ?? []).length > 0;

  if (!hasIntent) {
    issues.push({
      field: "intent",
      code: "INTENT_REQUIRED",
      message: "Free Destiny Map needs at least one route, need, question, or current situation."
    });
  }

  if (payload.needsAccommodation === true && !payload.accommodationArea) {
    issues.push({
      field: "accommodationArea",
      code: "ACCOMMODATION_AREA_RECOMMENDED",
      message: "Accommodation needs should include a preferred area, campus, workplace, or training location when known."
    });
  }

  return issues;
}

export function buildFreeDestinyMapIntakeResult(payload: FreeDestinyMapIntakePayload): FreeDestinyMapIntakeResult {
  const issues = validateFreeDestinyMapIntakePayload(payload);
  const reference = createFreeDestinyReference(payload.fullName ?? payload.province ?? "guest");

  return {
    accepted: issues.length === 0,
    productionReady: false,
    reference,
    issues,
    safeNotice: FREE_DESTINY_MAP_SAFE_NOTICE,
    nextAction:
      issues.length === 0
        ? "Shell accepted. Later batches will persist, email, score, and route this intake safely."
        : "Fix the listed intake issues before continuing."
  };
}

export function processFreeDestinyMapIntakeShell(input: unknown): FreeDestinyMapIntakeResult {
  const payload = normalizeFreeDestinyMapIntakePayload(input);
  return buildFreeDestinyMapIntakeResult(payload);
}
