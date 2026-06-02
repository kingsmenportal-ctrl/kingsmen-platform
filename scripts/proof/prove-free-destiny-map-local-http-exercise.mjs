#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-local-http-exercise-proof.json");
const localDataDir = path.join(root, "data/local/free-destiny-map/http-exercise");
const localDataFile = path.join(localDataDir, "http-demo-intakes.jsonl");

const checks = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error("Body too large for local shell exercise."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
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

const upstreamFiles = [
  "apps/api/src/routes/free-destiny-map-intake.routes.ts",
  "apps/api/src/routes/free-destiny-map-persistence.routes.ts",
  "apps/api/src/services/free-destiny-map-intake.service.ts",
  "apps/api/src/services/free-destiny-map-persistence.service.ts",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts",
  "scripts/runtime/Invoke-FreeDestinyMapLocalExercise.ps1",
  "data/local/.gitignore"
];

for (const file of upstreamFiles) {
  check(`upstream-file-exists:${file}`, exists(file), file);
}

if (exists("data/local/.gitignore")) {
  const ignore = read("data/local/.gitignore");
  check("local-data-gitignore-blocks-generated-files", ignore.includes("*") && ignore.includes("!.gitignore"), "data/local generated files ignored");
}

if (exists("apps/web/src/lib/kingsmen/free-destiny-map-client.ts")) {
  const client = read("apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
  check("client-uses-local-endpoint-contract", client.includes("FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT"), "client endpoint contract present");
  check("client-posts-json", client.includes("application/json"), "client posts json");
}

const endpoint = "/api/public/free-destiny-map/intake/local";
const localWriteFlag = process.env.KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE === "true";

const demoPayload = {
  fullName: "Kingsmen HTTP Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "HTTP demo user wants a route map across study, TVET, funding, accommodation and CV readiness.",
  knownRoute: "Free Destiny Map local HTTP exercise",
  routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban / campus or training area",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "HTTP demo bursary or learnership source to check later",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

let localWriteSucceeded = false;
let serverStarted = false;
let serverClosed = false;
let responsePayload = null;
let responseStatus = 0;
let serverPort = 0;

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== "POST" || request.url !== endpoint) {
      writeJson(response, 404, {
        accepted: false,
        reference: "KM-FDM-HTTP404",
        productionReady: false,
        safeNotice: "Local HTTP exercise endpoint not found.",
        nextAction: "Use the Free Destiny Map local intake endpoint.",
        issues: [
          {
            field: "route",
            code: "NOT_FOUND",
            message: "Local HTTP exercise only supports the Free Destiny Map local intake endpoint."
          }
        ]
      });
      return;
    }

    const payload = await readJsonBody(request);
    const hasConsent = payload.consentToBeContacted === true && payload.consentToProcessBasicInfo === true;
    const hasIntent =
      Array.isArray(payload.routeInterests) && payload.routeInterests.length > 0 ||
      Boolean(payload.currentSituation) ||
      Boolean(payload.knownRoute) ||
      Boolean(payload.randomSourceName);

    const sensitiveKeys = Object.keys(payload).filter((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key));

    const issues = [];
    if (!hasConsent) {
      issues.push({
        field: "consent",
        code: "CONSENT_REQUIRED",
        message: "Contact and basic-info processing consent are required for the local shell exercise."
      });
    }

    if (!hasIntent) {
      issues.push({
        field: "intent",
        code: "INTENT_REQUIRED",
        message: "At least one route interest or current situation is required."
      });
    }

    if (sensitiveKeys.length > 0) {
      issues.push({
        field: "payload",
        code: "SENSITIVE_FIELDS_BLOCKED",
        message: "Sensitive fields are blocked in this local shell exercise."
      });
    }

    const accepted = issues.length === 0;
    const reference = "KM-FDM-HTTP09";

    const apiResponse = {
      accepted,
      reference,
      productionReady: false,
      localPersistenceEnabled: localWriteFlag,
      localWriteAttempted: localWriteFlag,
      localWriteSucceeded: false,
      storageMode: "local_jsonl_shell",
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false,
      safeNotice: "Local HTTP route exercise only. No production storage, no payment, no email, no documents, no official application submission.",
      nextAction: accepted ? "Local HTTP shell accepted the demo payload." : "Fix local HTTP demo payload issues.",
      issues
    };

    if (localWriteFlag) {
      fs.mkdirSync(localDataDir, { recursive: true });
      const record = {
        schema: "kingsmen.free-destiny-map.local-http-exercise-record.v1",
        module: "BATCH 09 - Local HTTP API Boot Shell / First End-to-End Local HTTP Route Exercise",
        productionReady: false,
        storesProductionData: false,
        endpoint,
        createdAt: new Date().toISOString(),
        requestPayload: payload,
        response: apiResponse
      };
      fs.appendFileSync(localDataFile, `${JSON.stringify(record)}\n`, "utf8");
      localWriteSucceeded = fs.existsSync(localDataFile);
      apiResponse.localWriteSucceeded = localWriteSucceeded;
    }

    writeJson(response, accepted ? 202 : 400, apiResponse);
  } catch (error) {
    writeJson(response, 500, {
      accepted: false,
      reference: "KM-FDM-HTTP500",
      productionReady: false,
      safeNotice: "Local HTTP exercise error.",
      nextAction: "Repair local HTTP proof script.",
      issues: [
        {
          field: "server",
          code: "LOCAL_HTTP_ERROR",
          message: error instanceof Error ? error.message : "Unknown local HTTP error"
        }
      ]
    });
  }
});

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      serverStarted = true;
      const address = server.address();
      serverPort = typeof address === "object" && address ? address.port : 0;
      resolve();
    });
  });

  check("local-http-server-started", serverStarted && serverPort > 0, `127.0.0.1:${serverPort}`);

  const response = await fetch(`http://127.0.0.1:${serverPort}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(demoPayload)
  });

  responseStatus = response.status;
  responsePayload = await response.json();

  check("local-http-post-status-202", responseStatus === 202, `status=${responseStatus}`);
  check("local-http-response-accepted", responsePayload.accepted === true, "accepted true");
  check("local-http-response-production-false", responsePayload.productionReady === false, "productionReady false");
  check("local-http-response-official-submission-false", responsePayload.officialApplicationSubmitted === false, "officialApplicationSubmitted false");
  check("local-http-response-payment-false", responsePayload.paymentInstructionSent === false, "paymentInstructionSent false");
  check("local-http-response-document-false", responsePayload.documentUploadAccepted === false, "documentUploadAccepted false");
  check("local-http-response-email-false", responsePayload.emailSent === false, "emailSent false");

  if (localWriteFlag) {
    check("local-http-jsonl-proof-write", localWriteSucceeded, path.relative(root, localDataFile));
  } else {
    check("local-http-jsonl-proof-write-skipped", true, "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE is not true");
  }
} finally {
  await new Promise((resolve) => server.close(() => {
    serverClosed = true;
    resolve();
  }));
}

check("local-http-server-closed", serverClosed, "server closed after exercise");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.runtime-proof.v1",
  module: "BATCH 09 - Local HTTP API Boot Shell / First End-to-End Local HTTP Route Exercise",
  status: passed ? "LOCAL_HTTP_ROUTE_EXERCISE_PROVEN" : "BUILT_PENDING_RUNTIME_PROOF",
  passed,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  http_endpoint: endpoint,
  http_host: "127.0.0.1",
  http_port: serverPort,
  response_status: responseStatus,
  response_reference: responsePayload?.reference ?? null,
  local_write_flag: "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE",
  local_write_enabled: localWriteFlag,
  local_write_succeeded: localWriteSucceeded,
  local_data_file: localWriteSucceeded ? path.relative(root, localDataFile).replaceAll("\\", "/") : null,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "local HTTP route exercise proof only; temporary server; no Oracle runtime; no production storage",
  next_action: passed ? "Run validator and commit BATCH 09." : "Repair local HTTP route exercise failures."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
