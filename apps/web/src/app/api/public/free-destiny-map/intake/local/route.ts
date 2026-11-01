import { NextRequest, NextResponse } from "next/server";

import {
  createKingsmenWebCommandEnvelope,
  getKingsmenBackendBoundary,
  postKingsmenCommand
} from "@/lib/kingsmen-backend-client";
import { validateFreeDestinyMapIntake } from "@/lib/free-destiny-map-intake-validation";
import { readBoundedRequestBody } from "@/lib/free-destiny-map-intake-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = "/api/public/free-destiny-map/intake/local";
const MAX_BODY_BYTES = 16_384;

type BackendCommandResponse = {
  ok?: boolean;
  status?: string;
  commandId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  storageMode?: string;
  generatedAtIso?: string;
};

function blockedResponse(
  backendBoundary: ReturnType<typeof getKingsmenBackendBoundary>,
  issues: Array<{ field: string; code: string; message: string }>,
  status: number
) {
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
      safeNotice: "The request was rejected before the backend API boundary. No command was sent and no local file write, shell command, payment, email, document upload, or official application submission occurred.",
      nextAction: "Correct the highlighted Free Destiny Map intake fields.",
      issues
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const backendBoundary = getKingsmenBackendBoundary();
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return blockedResponse(backendBoundary, [{
      field: "contentType",
      code: "JSON_CONTENT_TYPE_REQUIRED",
      message: "The intake endpoint accepts application/json requests only."
    }], 415);
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!/^\\d+$/.test(contentLengthHeader) || !Number.isSafeInteger(contentLength)) {
      return blockedResponse(backendBoundary, [{
        field: "contentLength",
        code: "INVALID_CONTENT_LENGTH",
        message: "The intake request has an invalid content length."
      }], 400);
    }
    if (contentLength > MAX_BODY_BYTES) {
      return blockedResponse(backendBoundary, [{
        field: "payload",
        code: "REQUEST_TOO_LARGE",
        message: "The intake request exceeds the maximum allowed size."
      }], 413);
    }
  }

  const bodyResult = await readBoundedRequestBody(request, MAX_BODY_BYTES);
  if (!bodyResult.ok) {
    return blockedResponse(backendBoundary, [{
      field: "payload",
      code: bodyResult.code,
      message: bodyResult.message
    }], bodyResult.code === "REQUEST_TOO_LARGE" ? 413 : 400);
  }
  const rawBody = bodyResult.body;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return blockedResponse(backendBoundary, [{
      field: "payload",
      code: "INVALID_JSON",
      message: "The intake request must contain valid JSON."
    }], 400);
  }

  const validation = validateFreeDestinyMapIntake(parsed);
  if (!validation.ok) {
    return blockedResponse(backendBoundary, validation.issues, 400);
  }

  const safePayload = validation.payload;
  // This public route never accepts candidate IDs or attaches a lead to an
  // existing account. Identity binding is handled by authenticated candidate
  // workflows, not by caller-supplied public form fields.
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
