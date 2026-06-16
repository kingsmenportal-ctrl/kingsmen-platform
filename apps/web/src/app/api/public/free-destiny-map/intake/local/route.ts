import { NextRequest, NextResponse } from "next/server";

import {
  createKingsmenWebCommandEnvelope,
  getKingsmenBackendBoundary,
  postKingsmenCommand
} from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = "/api/public/free-destiny-map/intake/local";

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

function hasSafeConsent(payload: Record<string, unknown>): boolean {
  return payload.consentToBeContacted === true && payload.consentToProcessBasicInfo === true;
}

function hasRouteIntent(payload: Record<string, unknown>): boolean {
  return (
    (Array.isArray(payload.routeInterests) && payload.routeInterests.length > 0) ||
    Boolean(payload.currentSituation) ||
    Boolean(payload.knownRoute) ||
    Boolean(payload.randomSourceName)
  );
}

function sensitiveKeys(payload: Record<string, unknown>): string[] {
  return Object.keys(payload).filter((key) =>
    /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)
  );
}

function buildLocalValidationIssues(payload: Record<string, unknown>): LocalIssue[] {
  const issues: LocalIssue[] = [];

  if (!hasSafeConsent(payload)) {
    issues.push({
      field: "consent",
      code: "CONSENT_REQUIRED",
      message: "Contact and basic-info processing consent are required for the Free Destiny Map intake boundary."
    });
  }

  if (!hasRouteIntent(payload)) {
    issues.push({
      field: "intent",
      code: "INTENT_REQUIRED",
      message: "At least one route interest, current situation, known route, or source-check item is required."
    });
  }

  const blockedSensitiveKeys = sensitiveKeys(payload);

  if (blockedSensitiveKeys.length > 0) {
    issues.push({
      field: "payload",
      code: "SENSITIVE_FIELDS_BLOCKED",
      message: "Sensitive fields are blocked in the Free Destiny Map intake boundary."
    });
  }

  return issues;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown> = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const issues = buildLocalValidationIssues(payload);
  const backendBoundary = getKingsmenBackendBoundary();

  if (issues.length > 0) {
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
        safeNotice: "Payload validation failed before the backend API boundary. No local file write, shell command, payment, email, document upload, or official application submission occurred.",
        nextAction: "Fix Free Destiny Map intake payload issues.",
        issues
      },
      { status: 400 }
    );
  }

  const command = createKingsmenWebCommandEnvelope({
    commandType: "candidate.intake.received",
    commandIdPrefix: "web_fdm_intake",
    idempotencyKeyPrefix: "web_fdm_intake",
    idempotencyInput: {
      clientRequestId: payload.clientRequestId,
      email: payload.email,
      currentSituation: payload.currentSituation,
      routeInterests: payload.routeInterests
    },
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
    actor: {
      type: "candidate",
      id: optionalString(payload.candidatePublicRef) ?? "free_destiny_map_public_candidate",
      displayName: optionalString(payload.fullName) ?? optionalString(payload.name)
    },
    candidateId: optionalString(payload.candidatePublicRef),
    source: "portal",
    payload: {
      ...payload,
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
