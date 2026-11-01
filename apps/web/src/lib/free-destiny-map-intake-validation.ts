export type FreeDestinyMapIntakeIssue = {
  field: string;
  code: string;
  message: string;
};

export type SafeFreeDestinyMapIntakePayload = {
  clientRequestId: string;
  fullName: string;
  email: string;
  province: string;
  currentSituation: string;
  knownRoute: string;
  routeInterests: string[];
  urgency: "normal" | "soon" | "urgent_deadline_risk";
  needsAccommodation: boolean;
  accommodationArea: string;
  needsFundingHelp: boolean;
  needsCvHelp: boolean;
  hasDocumentsReady: boolean;
  consentToBeContacted: true;
  consentToProcessBasicInfo: true;
};

export type FreeDestinyMapValidationResult =
  | { ok: true; payload: SafeFreeDestinyMapIntakePayload }
  | { ok: false; issues: FreeDestinyMapIntakeIssue[] };

const allowedKeys = new Set([
  "clientRequestId",
  "fullName",
  "email",
  "province",
  "currentSituation",
  "knownRoute",
  "routeInterests",
  "urgency",
  "needsAccommodation",
  "accommodationArea",
  "needsFundingHelp",
  "needsCvHelp",
  "hasDocumentsReady",
  "consentToBeContacted",
  "consentToProcessBasicInfo"
]);

const provinces = new Set([
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
]);

const currentSituations = new Set([
  "Grade 9–11 learner",
  "Grade 12 / Matric learner",
  "Matric completed",
  "TVET / college student",
  "University student",
  "Graduate seeking opportunity",
  "Unemployed and seeking work",
  "Employed and seeking progression",
  "Career change / returning to work"
]);

const routeInterests = new Set([
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
]);

const urgencyValues = new Set(["normal", "soon", "urgent_deadline_risk"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length <= max;
}

export function validateFreeDestinyMapIntake(value: unknown): FreeDestinyMapValidationResult {
  if (!isRecord(value)) {
    return { ok: false, issues: [{ field: "payload", code: "OBJECT_PAYLOAD_REQUIRED", message: "The intake request must be a JSON object." }] };
  }

  const payload = value;
  const issues: FreeDestinyMapIntakeIssue[] = [];
  const unsupportedKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));
  const containsSensitiveKeys = unsupportedKeys.some((key) =>
    /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)
  );

  if (containsSensitiveKeys) {
    issues.push({ field: "payload", code: "SENSITIVE_FIELDS_BLOCKED", message: "Sensitive fields are blocked in the Free Destiny Map intake boundary." });
  } else if (unsupportedKeys.length > 0) {
    issues.push({ field: "payload", code: "UNSUPPORTED_FIELDS_BLOCKED", message: "The intake contains fields that are not accepted by this public endpoint." });
  }

  const clientRequestId = typeof payload.clientRequestId === "string" ? payload.clientRequestId.trim() : "";
  if (!uuidPattern.test(clientRequestId)) {
    issues.push({ field: "clientRequestId", code: "VALID_REQUEST_ID_REQUIRED", message: "A valid request identifier is required. Refresh the form and try again." });
  }

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  if (!fullName || fullName.length > 120) {
    issues.push({ field: "fullName", code: "VALID_NAME_REQUIRED", message: "Enter a name of up to 120 characters." });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (email.length > 254 || !emailPattern.test(email)) {
    issues.push({ field: "email", code: "VALID_EMAIL_REQUIRED", message: "Enter a valid email address." });
  }

  if (typeof payload.province !== "string" || !provinces.has(payload.province)) {
    issues.push({ field: "province", code: "VALID_PROVINCE_REQUIRED", message: "Select a valid South African province." });
  }
  if (typeof payload.currentSituation !== "string" || !currentSituations.has(payload.currentSituation)) {
    issues.push({ field: "currentSituation", code: "VALID_CURRENT_SITUATION_REQUIRED", message: "Select your current situation." });
  }

  const selectedRoutes = Array.isArray(payload.routeInterests) ? payload.routeInterests : [];
  if (
    selectedRoutes.length < 1 ||
    selectedRoutes.length > routeInterests.size ||
    selectedRoutes.some((route) => typeof route !== "string" || !routeInterests.has(route)) ||
    new Set(selectedRoutes).size !== selectedRoutes.length
  ) {
    issues.push({ field: "routeInterests", code: "VALID_ROUTE_INTERESTS_REQUIRED", message: "Select at least one valid route or support interest." });
  }

  const knownRoute = typeof payload.knownRoute === "string" ? payload.knownRoute.trim() : "";
  if (!boundedString(knownRoute, 280)) {
    issues.push({ field: "knownRoute", code: "KNOWN_ROUTE_TOO_LONG", message: "Known route details must be 280 characters or fewer." });
  }

  const urgency = payload.urgency;
  if (typeof urgency !== "string" || !urgencyValues.has(urgency)) {
    issues.push({ field: "urgency", code: "VALID_TIMING_REQUIRED", message: "Select a valid timing option." });
  }

  const booleanFields = [
    "needsAccommodation",
    "needsFundingHelp",
    "needsCvHelp",
    "hasDocumentsReady",
    "consentToBeContacted",
    "consentToProcessBasicInfo"
  ] as const;
  for (const key of booleanFields) {
    if (typeof payload[key] !== "boolean") {
      issues.push({ field: key, code: "BOOLEAN_VALUE_REQUIRED", message: "The submitted form contains an invalid choice." });
    }
  }

  if (payload.consentToBeContacted !== true || payload.consentToProcessBasicInfo !== true) {
    issues.push({ field: "consent", code: "CONSENT_REQUIRED", message: "Contact and basic-information processing consent are required." });
  }

  const accommodationArea = typeof payload.accommodationArea === "string" ? payload.accommodationArea.trim() : "";
  if (payload.accommodationArea !== undefined && !boundedString(accommodationArea, 180)) {
    issues.push({ field: "accommodationArea", code: "ACCOMMODATION_AREA_TOO_LONG", message: "Accommodation area must be 180 characters or fewer." });
  }
  if (payload.needsAccommodation === true && !accommodationArea) {
    issues.push({ field: "accommodationArea", code: "ACCOMMODATION_AREA_REQUIRED", message: "Enter the campus, town or work area for accommodation support." });
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    payload: {
      clientRequestId,
      fullName,
      email,
      province: payload.province as string,
      currentSituation: payload.currentSituation as string,
      knownRoute,
      routeInterests: selectedRoutes as string[],
      urgency: urgency as SafeFreeDestinyMapIntakePayload["urgency"],
      needsAccommodation: payload.needsAccommodation as boolean,
      accommodationArea,
      needsFundingHelp: payload.needsFundingHelp as boolean,
      needsCvHelp: payload.needsCvHelp as boolean,
      hasDocumentsReady: payload.hasDocumentsReady as boolean,
      consentToBeContacted: true,
      consentToProcessBasicInfo: true
    }
  };
}
