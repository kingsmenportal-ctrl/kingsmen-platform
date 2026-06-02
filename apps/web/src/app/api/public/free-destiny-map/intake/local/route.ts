import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = "/api/public/free-destiny-map/intake/local";
const localWriteFlagName = "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE";

type LocalIssue = {
  field: string;
  code: string;
  message: string;
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

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown> = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

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

  const accepted = issues.length === 0;
  const localPersistenceEnabled = process.env[localWriteFlagName] === "true";

  const responseBody = {
    accepted,
    reference: "KM-FDM-NEXT15B",
    productionReady: false,
    localPersistenceEnabled,
    localWriteAttempted: localPersistenceEnabled,
    localWriteSucceeded: false,
    storageMode: "local_jsonl_shell",
    officialApplicationSubmitted: false,
    paymentInstructionSent: false,
    documentUploadAccepted: false,
    emailSent: false,
    safeNotice:
      "Controlled local Next API proof only. No production storage, no payment, no email, no documents, no official application submission.",
    nextAction: accepted
      ? "Controlled local Next API accepted the safe demo Free Destiny Map payload."
      : "Fix local Free Destiny Map intake payload issues.",
    issues
  };

  if (accepted && localPersistenceEnabled) {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const localDataDir = path.join(repoRoot, "data/local/free-destiny-map/next-api-integration");
    const localDataFile = path.join(localDataDir, "next-api-demo-intakes.jsonl");

    fs.mkdirSync(localDataDir, { recursive: true });
    fs.appendFileSync(
      localDataFile,
      `${JSON.stringify({
        schema: "kingsmen.free-destiny-map.next-api-integration-record.v1",
        module: "BATCH 15B - Controlled Local Web + Local API Integration Proof",
        productionReady: false,
        storesProductionData: false,
        endpoint,
        createdAt: new Date().toISOString(),
        requestPayload: payload,
        response: responseBody
      })}\n`,
      "utf8"
    );

    responseBody.localWriteSucceeded = fs.existsSync(localDataFile);
  }

  return NextResponse.json(responseBody, { status: accepted ? 202 : 400 });
}

export async function GET() {
  return NextResponse.json(
    {
      accepted: false,
      productionReady: false,
      endpoint,
      safeNotice: "Use POST with a safe Free Destiny Map local intake payload.",
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false
    },
    { status: 405 }
  );
}
