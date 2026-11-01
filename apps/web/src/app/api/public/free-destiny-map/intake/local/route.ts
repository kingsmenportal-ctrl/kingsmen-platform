import { NextRequest, NextResponse } from "next/server";

import {
  createKingsmenWebCommandEnvelope,
  getKingsmenBackendBoundary,
  postKingsmenCommand
} from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = "/api/public/free-destiny-map/intake/local";
const MAX_BODY_BYTES = 16_384;

type LocalIssue = {
  field: string;
  code: string;
  message: string;
};

type BackendCommandResponse = {
  ok?: boolean;
  status?: string;
  commandId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  storageMode?: string;
  generatedAtIso?: string;
};

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

function isStringWithin(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function hasSafeConsent(payload: Record<string, unknown>): boolean {
  return payload.consentToBeContacted === true && payload.consentToProcessBasicInfo === true;
}

function buildLocalValidationIssues(payload: Record<string, unknown>): LocalIssue[] {
  const issues: LocalIssue[] = [];
  const keys = Object.keys(payload);
  const unsupportedKeys = keys.filter((key) => !allowedKeys.has(key));
  const sensitiveKeys = unsupportedKeys.filter((key) =>
    /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)
  );

  if (sensitiveKeys.length > 0) {
    issues.push({
      field: "payload",
      code: "SENSITIVE_FIELDS_BLOCKED",
      message: "Sensitive fields are blocked in the Free Destiny Map intake boundary."
    });
  } else if (unsupportedKeys.length > 0) {
    issues.push({
      field: "payload",
      code: "UNSUPPORTED_FIELDS_BLOCKED",
      message: "The intake contains fields that are not accepted by this public endpoint."
    });
  }

  if (!uuidPattern.test(String(payload.clientRequestId ?? ""))) {
    issues.push({
      field: "clientRequestId",
      code: "VALID_REQUEST_ID_REQUIRED",
      message: "A valid request identifier is required. Refresh the form and try again."
    });
  }
  if (!isStringWithin(payload.fullName, 1, 120)) {
    issues.push({ field: "fullName", code: "VALID_NAME_REQUIRED", message: "Enter a name of up to 120 characters." });
  }
  if (!isStringWithin(payload.email, 3, 254) || !emailPattern.test(String(payload.email).trim())) {
    issues.push({ field: "email", code: "VALID_EMAIL_REQUIRED", message: "Enter a valid email address." });
  }
  if (typeof payload.province !== "string" || !provinces.has(payload.province)) {
    issues.push({ field: "province", code: "VALID_PROVINCE_REQUIRED", message: "Select a valid South African province." });
  }
  if (typeof payload.currentSituation !== "string" || !currentSituations.has(payload.currentSituation)) {
    issues.push({ field: "currentSituation", code: "VALID_CURRENT_SITUATION_REQUIRED", message: "Select your current situation." });
  }
  if (
    !Array.isArray(payload.routeInterests) ||
    payload.routeInterests.length < 1 ||
    payload.routeInterests.length > routeInterests.size ||
    payload.routeInterests.some((value) => typeof value !== "string" || !routeInterests.has(value)) ||
    new Set(payload.routeInterests).size !== payload.routeInterests.length
  ) {
    issues.push({ field: "routeInterests", code: "VALID_ROUTE_INTERESTS_REQUIRED", message: "Select at least one valid route or support interest." });
  }
  if (payload.knownRoute !== undefined && !isStringWithin(payload.knownRoute, 0, 280)) {
    issues.push({ field: "knownRoute", code: "KNOWN_ROUTE_TOO_LONG", message: "Known route details must be 280 characters or fewer." });
  }
  if (typeof payload.urgency !== "string" || !urgencyValues.has(payload.urgency)) {
    issues.push({ field: "urgency", code: "VALID_TIMING_REQUIRED", message: "Select a valid timing option." });
  }

  for (const key of ["needsAccommodation", "needsFundingHelp", "needsCvHelp", "hasDocumentsReady", "consentToBeContacted", "consentToProcessBasicInfo"]) {
    if (typeof payload[key] !== "boolean") {
      issues.push({ field: key, code: "BOOLEAN_VALUE_REQUIRED", message: "The submitted form contains an invalid choice." });
    }
  }
  if (!hasSafeConsent(payload)) {
    issues.push({
      field: "consent",
      code: "CONSENT_REQUIRED",
      message: "Contact and basic-information processing consent are required."
    });
  }
  if (payload.accommodationArea !== undefined && !isStringWithin(payload.accommodationArea, 0, 180)) {
    issues.push({ field: "accommodationArea", code: "ACCOMMODATION_AREA_TOO_LONG", message: "Accommodation area must be 180 characters or fewer." });
  }
  if (payload.needsAccommodation === true && !isStringWithin(payload.accommodationArea, 1, 180)) {
    issues.push({ field: "accommodationArea", code: "ACCOMMODATION_AREA_REQUIRED", message: "Enter the campus, town or work area for accommodation support." });
  }

  return issues;
}

function validationResponse(backendBoundary: ReturnType<typeof getKingsmenBackendBoundary>, issues: LocalIssue[], status: number) {
  return NextResponse.json(
    {
      accepted: false,
      reference: "KM-FDM-WEB-BLOCKED",
      productionReady: false,
      canClaimProduction: false,
      deployedToOracle: false,
      backendBoundaryMode: backendBoundary.mode,
      backendConfigured: backendBoundary.configured,
      backendBoundaryReached: false,
      localWriteAttempted: false,
      localWriteSucceeded: false,
      storageMode: "validation_blocked_backend_boundary",
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false,
      safeNotice: "Payload validation failed before the backend API boundary. No command was sent and no local file write, shell command, payment, email, document upload, or official application submission occurred.",
      nextAction: "Correct the highlighted Free Destiny Map intake fields.",
      issues
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const backendBoundary = getKingsmenBackendBoundary();
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return validationResponse(backendBoundary, [{
      field: "payload",
      code: "REQUEST_TOO_LARGE",
      message: "The intake request exceeds the maximum allowed size."
    }], 413);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return validationResponse(backendBoundary, [{
      field: "payload",
      code: "INVALID_REQUEST_BODY",
      message: "The intake request body could not be read."
    }], 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return validationResponse(backendBoundary, [{
      field: "payload",
      code: "REQUEST_TOO_LARGE",
      message: "The intake request exceeds the maximum allowed size."
    }], 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return validationResponse(backendBoundary, [{
      field: "payload",
      code: "INVALID_JSON",
      message: "The intake request must contain valid JSON."
    }], 400);
  }

  if (!isRecord(parsed)) {
    return validationResponse(backendBoundary, [{
      field: "payload",
      code: "OBJECT_PAYLOAD_REQUIRED",
      message: "The intake request must be a JSON object."
    }], 400);
  }

  const issues = buildLocalValidationIssues(parsed);
  if (issues.length > 0) {
    return validationResponse(backendBoundary, issues, 400);
  }

  // Build the backend payload from the allowlist only. Never accept a public
  // candidate reference or let a caller attach an intake to another account.
  const safePayload = {
    clientRequestId: parsed.clientRequestId,
    fullName: String(parsed.fullName).trim(),
    email: String(parsed.email).trim().toLowerCase(),
    province: parsed.province,
    currentSituation: parsed.currentSituation,
    knownRoute: typeof parsed.knownRoute === "string" ? parsed.knownRoute.trim() : "",
    routeInterests: parsed.routeInterests,
    urgency: parsed.urgency,
    needsAccommodation: parsed.needsAccommodation,
    accommodationArea: typeof parsed.accommodationArea === "string" ? parsed.accommodationArea.trim() : "",
    needsFundingHelp: parsed.needsFundingHelp,
    needsCvHelp: parsed.needsCvHelp,
    hasDocumentsReady: parsed.hasDocumentsReady,
    consentToBeContacted: parsed.consentToBeContacted,
    consentToProcessBasicInfo: parsed.consentToProcessBasicInfo
  };

  const command = createKingsmenWebCommandEnvelope({
    commandType: "candidate.intake.received",
    commandIdPrefix: "web_fdm_intake",
    idempotencyKeyPrefix: "web_fdm_intake",
    idempotencyInput: {
      clientRequestId: safePayload.clientRequestId,
      email: safePayload.email,
      currentSituation: safePayload.currentSituation,
      routeInterests: safePayload.routeInterests
    },
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
    actor: {
      type: "candidate",
      id: "free_destiny_map_public_candidate",
      displayName: safePayload.fullName
    },
    source: "portal",
    payload: {
      ...safePayload,
      webBoundaryEndpoint: endpoint,
      submittedThrough: "free_destiny_map_web_boundary",
      localFileWriteDisabled: true,
      localShellDisabled: true
    }
  });

  const backend = await postKingsmenCommand<typeof command.payload, BackendCommandResponse>(command);
  const accepted = backend.ok && (backend.status === 202 || backend.status === 200) && backend.data?.ok !== false;

  return NextResponse.json(
    {
      accepted,
      reference: accepted ? "KM-FDM-WEB-BACKEND" : "KM-FDM-WEB-BACKEND-FAILED",
      backendReference: backend.data?.commandId ?? null,
      correlationId: backend.data?.correlationId ?? command.correlationId,
      idempotencyKey: backend.data?.idempotencyKey ?? command.idempotencyKey,
      productionReady: false,
      canClaimProduction: false,
      deployedToOracle: false,
      backendBoundaryMode: backend.boundary.mode,
      backendConfigured: backend.boundary.configured,
      backendBridgeAttempted: backend.boundary.configured,
      backendBridgeSucceeded: accepted,
      backendBridgeStatus: backend.status,
      backendBoundaryReached: accepted,
      backendStorageMode: backend.data?.storageMode ?? null,
      localWriteAttempted: false,
      localWriteSucceeded: false,
      storageMode: "web_to_backend_api_boundary",
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false,
      safeNotice: "Free Destiny Map intake is routed through the backend API command boundary only. The web route performs no local file writes, shell execution, direct database access, payment, email, document upload, or official application submission.",
      nextAction: accepted
        ? "Backend command boundary accepted the Free Destiny Map intake."
        : "Configure or repair KINGSMEN_BACKEND_BASE_URL before public deployment.",
      issues: accepted
        ? []
        : [
            {
              field: "backendBoundary",
              code: "BACKEND_BOUNDARY_FAILED",
              message: backend.error ?? "Backend API boundary did not accept the command."
            }
          ]
    },
    { status: accepted ? 202 : 502 }
  );
}

export async function GET() {
  const backendBoundary = getKingsmenBackendBoundary();

  return NextResponse.json(
    {
      accepted: false,
      productionReady: false,
      canClaimProduction: false,
      deployedToOracle: false,
      endpoint,
      backendBoundaryMode: backendBoundary.mode,
      backendConfigured: backendBoundary.configured,
      safeNotice: "Use POST with a safe Free Destiny Map intake payload. This route proxies to the backend API only.",
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false
    },
    { status: 405 }
  );
}
