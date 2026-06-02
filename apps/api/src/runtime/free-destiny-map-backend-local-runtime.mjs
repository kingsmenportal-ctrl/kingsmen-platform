import fs from "node:fs";
import http from "node:http";
import path from "node:path";

export const FREE_DESTINY_MAP_BACKEND_RUNTIME_MODULE =
  "BATCH 17 - Backend Runtime Integration Shell / Local API Service Boundary";

export const FREE_DESTINY_MAP_BACKEND_HEALTH_ENDPOINT = "/health";

export const FREE_DESTINY_MAP_BACKEND_INTAKE_ENDPOINT =
  "/api/public/free-destiny-map/intake/local";

export const FREE_DESTINY_MAP_BACKEND_LOCAL_WRITE_FLAG =
  "KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE";

export const FREE_DESTINY_MAP_BACKEND_LOCAL_DATA_DIR =
  "data/local/free-destiny-map/backend-runtime-boundary";

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error("Body too large for backend runtime boundary proof."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });

    request.on("error", reject);
  });
}

function writeJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}

function hasSafeConsent(payload) {
  return payload.consentToBeContacted === true && payload.consentToProcessBasicInfo === true;
}

function hasRouteIntent(payload) {
  return (
    (Array.isArray(payload.routeInterests) && payload.routeInterests.length > 0) ||
    Boolean(payload.currentSituation) ||
    Boolean(payload.knownRoute) ||
    Boolean(payload.randomSourceName)
  );
}

function sensitiveKeys(payload) {
  return Object.keys(payload).filter((key) =>
    /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)
  );
}

export function buildFreeDestinyMapBackendResponse(payload, options = {}) {
  const issues = [];

  if (!hasSafeConsent(payload)) {
    issues.push({
      field: "consent",
      code: "CONSENT_REQUIRED",
      message: "Contact and basic-info processing consent are required for the backend local intake boundary."
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
      message: "Sensitive fields are blocked in the backend local intake boundary."
    });
  }

  const accepted = issues.length === 0;
  const localPersistenceEnabled = options.localPersistenceEnabled === true;

  return {
    accepted,
    reference: "KM-FDM-BACKEND17",
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    localPersistenceEnabled,
    localWriteAttempted: localPersistenceEnabled,
    localWriteSucceeded: false,
    storageMode: "backend_local_jsonl_shell",
    officialApplicationSubmitted: false,
    paymentInstructionSent: false,
    documentUploadAccepted: false,
    emailSent: false,
    backendBoundaryReached: true,
    safeNotice:
      "Controlled local backend boundary proof only. No production storage, no Oracle runtime, no payment, no email, no documents, no official application submission.",
    nextAction: accepted
      ? "Backend local boundary accepted the safe demo Free Destiny Map payload."
      : "Fix backend local Free Destiny Map intake payload issues.",
    issues
  };
}

export function writeBackendLocalProofRecord(repoRoot, payload, responseBody) {
  const localDataDir = path.join(repoRoot, FREE_DESTINY_MAP_BACKEND_LOCAL_DATA_DIR);
  const localDataFile = path.join(localDataDir, "backend-runtime-demo-intakes.jsonl");

  fs.mkdirSync(localDataDir, { recursive: true });
  fs.appendFileSync(
    localDataFile,
    `${JSON.stringify({
      schema: "kingsmen.free-destiny-map.backend-runtime-boundary-record.v1",
      module: FREE_DESTINY_MAP_BACKEND_RUNTIME_MODULE,
      productionReady: false,
      storesProductionData: false,
      endpoint: FREE_DESTINY_MAP_BACKEND_INTAKE_ENDPOINT,
      createdAt: new Date().toISOString(),
      requestPayload: payload,
      response: responseBody
    })}\n`,
    "utf8"
  );

  return {
    localDataFile,
    localWriteSucceeded: fs.existsSync(localDataFile)
  };
}

export function createFreeDestinyMapBackendLocalServer(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();

  return http.createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === FREE_DESTINY_MAP_BACKEND_HEALTH_ENDPOINT) {
        writeJson(response, 200, {
          ok: true,
          module: FREE_DESTINY_MAP_BACKEND_RUNTIME_MODULE,
          productionReady: false,
          canClaimProduction: false,
          deployedToOracle: false,
          oracleLiteImpact: "none_runtime_yet",
          endpoints: {
            health: FREE_DESTINY_MAP_BACKEND_HEALTH_ENDPOINT,
            intake: FREE_DESTINY_MAP_BACKEND_INTAKE_ENDPOINT
          }
        });
        return;
      }

      if (request.method !== "POST" || request.url !== FREE_DESTINY_MAP_BACKEND_INTAKE_ENDPOINT) {
        writeJson(response, 404, {
          accepted: false,
          productionReady: false,
          canClaimProduction: false,
          deployedToOracle: false,
          safeNotice: "Backend local runtime boundary only supports health and Free Destiny Map local intake.",
          issues: [
            {
              field: "route",
              code: "NOT_FOUND",
              message: "Use /health or the Free Destiny Map backend local intake endpoint."
            }
          ]
        });
        return;
      }

      const payload = await readJsonBody(request);
      const localPersistenceEnabled =
        process.env[FREE_DESTINY_MAP_BACKEND_LOCAL_WRITE_FLAG] === "true" ||
        options.enableLocalWrite === true;

      const responseBody = buildFreeDestinyMapBackendResponse(payload, {
        localPersistenceEnabled
      });

      if (responseBody.accepted && localPersistenceEnabled) {
        const writeResult = writeBackendLocalProofRecord(repoRoot, payload, responseBody);
        responseBody.localWriteSucceeded = writeResult.localWriteSucceeded;
      }

      writeJson(response, responseBody.accepted ? 202 : 400, responseBody);
    } catch (error) {
      writeJson(response, 500, {
        accepted: false,
        productionReady: false,
        canClaimProduction: false,
        deployedToOracle: false,
        safeNotice: "Backend runtime boundary proof error.",
        issues: [
          {
            field: "backend",
            code: "BACKEND_RUNTIME_BOUNDARY_ERROR",
            message: error instanceof Error ? error.message : "Unknown backend runtime boundary error"
          }
        ]
      });
    }
  });
}
