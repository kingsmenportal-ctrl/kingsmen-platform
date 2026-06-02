import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = "/api/public/free-destiny-map/intake/local";
const localWriteFlagName = "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE";
const backendBridgeFlagName = "KINGSMEN_ENABLE_BACKEND_BRIDGE";
const backendBaseUrlEnvName = "KINGSMEN_BACKEND_BASE_URL";

type LocalIssue = {
  field: string;
  code: string;
  message: string;
};

type BackendBridgeResult = {
  attempted: boolean;
  succeeded: boolean;
  status: number;
  data: Record<string, unknown> | null;
  error: string | null;
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
      message: "Contact and basic-info processing consent are required for the local Free Destiny Map intake shell."
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
      message: "Sensitive fields are blocked in the local Free Destiny Map intake shell."
    });
  }

  return issues;
}

function normalizedBackendBaseUrl(): string | null {
  const value = process.env[backendBaseUrlEnvName];

  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, "");
}

async function postToBackendBoundary(payload: Record<string, unknown>): Promise<BackendBridgeResult> {
  const backendBaseUrl = normalizedBackendBaseUrl();

  if (!backendBaseUrl) {
    return {
      attempted: false,
      succeeded: false,
      status: 0,
      data: null,
      error: "KINGSMEN_BACKEND_BASE_URL is missing."
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const backendResponse = await fetch(`${backendBaseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = (await backendResponse.json().catch(() => null)) as Record<string, unknown> | null;

    return {
      attempted: true,
      succeeded: backendResponse.status === 202 && data?.accepted === true,
      status: backendResponse.status,
      data,
      error: null
    };
  } catch (error) {
    return {
      attempted: true,
      succeeded: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Unknown backend bridge error."
    };
  } finally {
    clearTimeout(timer);
  }
}

function writeNextLocalProofRecord(payload: Record<string, unknown>, responseBody: Record<string, unknown>) {
  const repoRoot = path.resolve(process.cwd(), "../..");
  const localDataDir = path.join(repoRoot, "data/local/free-destiny-map/next-api-integration");
  const localDataFile = path.join(localDataDir, "next-api-demo-intakes.jsonl");

  fs.mkdirSync(localDataDir, { recursive: true });
  fs.appendFileSync(
    localDataFile,
    `${JSON.stringify({
      schema: "kingsmen.free-destiny-map.next-api-integration-record.v1",
      module: "BATCH 18 - Controlled Next-to-Backend Bridge Proof",
      productionReady: false,
      storesProductionData: false,
      endpoint,
      createdAt: new Date().toISOString(),
      requestPayload: payload,
      response: responseBody
    })}\n`,
    "utf8"
  );

  return fs.existsSync(localDataFile);
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown> = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const issues = buildLocalValidationIssues(payload);
  const validLocalPayload = issues.length === 0;
  const backendBridgeEnabled = process.env[backendBridgeFlagName] === "true";
  const localPersistenceEnabled = process.env[localWriteFlagName] === "true";

  if (!validLocalPayload) {
    return NextResponse.json(
      {
        accepted: false,
        reference: "KM-FDM-NEXT18-BLOCKED",
        productionReady: false,
        canClaimProduction: false,
        deployedToOracle: false,
        backendBridgeEnabled,
        backendBridgeAttempted: false,
        backendBridgeSucceeded: false,
        backendBoundaryReached: false,
        localPersistenceEnabled,
        localWriteAttempted: false,
        localWriteSucceeded: false,
        storageMode: "validation_blocked_shell",
        officialApplicationSubmitted: false,
        paymentInstructionSent: false,
        documentUploadAccepted: false,
        emailSent: false,
        safeNotice:
          "Controlled local Next intake shell only. Payload validation failed before backend bridge.",
        nextAction: "Fix local Free Destiny Map intake payload issues.",
        issues
      },
      { status: 400 }
    );
  }

  if (backendBridgeEnabled) {
    const backendBridge = await postToBackendBoundary(payload);
    const backendData = backendBridge.data ?? {};
    const backendBoundaryReached = backendData.backendBoundaryReached === true;
    const accepted = backendBridge.succeeded && backendBoundaryReached;

    return NextResponse.json(
      {
        accepted,
        reference: "KM-FDM-NEXT18-BRIDGE",
        backendReference: backendData.reference ?? null,
        productionReady: false,
        canClaimProduction: false,
        deployedToOracle: false,
        backendBridgeEnabled: true,
        backendBridgeAttempted: backendBridge.attempted,
        backendBridgeSucceeded: accepted,
        backendBridgeStatus: backendBridge.status,
        backendBoundaryReached,
        backendLocalWriteSucceeded: backendData.localWriteSucceeded === true,
        backendStorageMode: backendData.storageMode ?? null,
        localPersistenceEnabled: false,
        localWriteAttempted: false,
        localWriteSucceeded: false,
        storageMode: "next_to_backend_bridge_shell",
        officialApplicationSubmitted: false,
        paymentInstructionSent: false,
        documentUploadAccepted: false,
        emailSent: false,
        safeNotice:
          "Controlled local Next-to-backend bridge proof only. No production storage, no Oracle runtime, no payment, no email, no documents, no official application submission.",
        nextAction: accepted
          ? "Next API route bridged the safe demo Free Destiny Map payload to the backend runtime boundary."
          : "Repair backend bridge failure before moving forward.",
        issues: accepted
          ? []
          : [
              {
                field: "backendBridge",
                code: "BACKEND_BRIDGE_FAILED",
                message: backendBridge.error ?? "Backend bridge did not return an accepted backend boundary response."
              }
            ]
      },
      { status: accepted ? 202 : 502 }
    );
  }

  const responseBody = {
    accepted: true,
    reference: "KM-FDM-NEXT18-LOCAL",
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    backendBridgeEnabled: false,
    backendBridgeAttempted: false,
    backendBridgeSucceeded: false,
    backendBoundaryReached: false,
    localPersistenceEnabled,
    localWriteAttempted: localPersistenceEnabled,
    localWriteSucceeded: false,
    storageMode: "local_jsonl_shell",
    officialApplicationSubmitted: false,
    paymentInstructionSent: false,
    documentUploadAccepted: false,
    emailSent: false,
    safeNotice:
      "Controlled local Next API proof only. Backend bridge is disabled. No production storage, no payment, no email, no documents, no official application submission.",
    nextAction: "Controlled local Next API accepted the safe demo Free Destiny Map payload.",
    issues: []
  };

  if (localPersistenceEnabled) {
    responseBody.localWriteSucceeded = writeNextLocalProofRecord(payload, responseBody);
  }

  return NextResponse.json(responseBody, { status: 202 });
}

export async function GET() {
  return NextResponse.json(
    {
      accepted: false,
      productionReady: false,
      canClaimProduction: false,
      deployedToOracle: false,
      endpoint,
      backendBridgeEnabled: process.env[backendBridgeFlagName] === "true",
      safeNotice: "Use POST with a safe Free Destiny Map local intake payload.",
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false
    },
    { status: 405 }
  );
}
