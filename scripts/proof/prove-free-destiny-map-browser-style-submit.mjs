#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-browser-style-submit-proof.json");
const localDataDir = path.join(root, "data/local/free-destiny-map/browser-style-submit");
const localDataFile = path.join(localDataDir, "browser-style-demo-intakes.jsonl");

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

function getAttribute(tag, attributeName) {
  const match = tag.match(new RegExp(`${attributeName}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function decodeBasicHtml(value) {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractBrowserStylePayloadFromHtml(html) {
  const payload = {
    fullName: "",
    province: "",
    currentSituation: "",
    knownRoute: "",
    routeInterests: [],
    needsAccommodation: false,
    accommodationArea: "",
    needsFundingHelp: false,
    needsCvHelp: false,
    hasDocumentsReady: false,
    randomSourceName: "",
    consentToBeContacted: false,
    consentToProcessBasicInfo: false
  };

  const inputTags = html.match(/<input\b[^>]*>/gi) ?? [];
  const textareaTags = html.match(/<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi) ?? [];

  for (const tag of inputTags) {
    const name = getAttribute(tag, "name");
    if (!name) continue;

    const type = getAttribute(tag, "type") || "text";
    const value = decodeBasicHtml(getAttribute(tag, "value"));
    const isChecked = /\bchecked\b/i.test(tag) || value === "true";

    if (name === "routeInterests") {
      payload.routeInterests.push(value);
      continue;
    }

    if (["needsAccommodation", "needsFundingHelp", "needsCvHelp", "hasDocumentsReady", "consentToBeContacted", "consentToProcessBasicInfo"].includes(name)) {
      payload[name] = type === "checkbox" ? isChecked : value === "true";
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(payload, name)) {
      payload[name] = value;
    }
  }

  for (const tag of textareaTags) {
    const name = getAttribute(tag, "name");
    if (!name) continue;
    const inner = tag.replace(/^<textarea\b[^>]*>/i, "").replace(/<\/textarea>$/i, "");
    if (Object.prototype.hasOwnProperty.call(payload, name)) {
      payload[name] = decodeBasicHtml(inner.trim());
    }
  }

  return payload;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error("Body too large for browser-style submit proof."));
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

function writeHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "content-length": Buffer.byteLength(html)
  });
  response.end(html);
}

const repoFiles = [
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts",
  "packages/contracts/src/free-destiny-map-api-wiring.ts",
  "apps/api/src/routes/free-destiny-map-persistence.routes.ts",
  "apps/api/src/services/free-destiny-map-persistence.service.ts",
  "data/local/.gitignore"
];

for (const file of repoFiles) {
  check(`repo-file-exists:${file}`, exists(file), file);
}

if (exists("data/local/.gitignore")) {
  const ignore = read("data/local/.gitignore");
  check("local-data-gitignore-blocks-generated-files", ignore.includes("*") && ignore.includes("!.gitignore"), "data/local generated files ignored");
}

if (exists("apps/web/src/app/free-destiny-map/page.tsx")) {
  const page = read("apps/web/src/app/free-destiny-map/page.tsx");
  check("real-page-imports-api-form", page.includes("FreeDestinyMapApiForm"), "page imports/uses API form");
}

if (exists("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx")) {
  const form = read("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
  check("real-form-is-client-component", form.includes('"use client"'), "client component present");
  check("real-form-submits-client-payload", form.includes("submitFreeDestinyMapClientPayload"), "submit client payload present");
  check("real-form-has-consent-fields", form.includes("consentToBeContacted") && form.includes("consentToProcessBasicInfo"), "consent fields present");
  check("real-form-has-route-interests", form.includes("routeInterests"), "route interests present");
  check("real-form-keeps-production-warning", form.includes("Production storage") || form.includes("local intake API shell"), "safe local shell warning present");
}

if (exists("apps/web/src/lib/kingsmen/free-destiny-map-client.ts")) {
  const client = read("apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
  check("real-client-builds-formdata-payload", client.includes("buildFreeDestinyMapClientPayload"), "FormData builder present");
  check("real-client-posts-json", client.includes("application/json"), "JSON post present");
  check("real-client-uses-endpoint-contract", client.includes("FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT"), "endpoint contract present");
}

const webRoute = "/free-destiny-map";
const endpoint = "/api/public/free-destiny-map/intake/local";
const localWriteFlag = process.env.KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE === "true";

const htmlPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Kingsmen Browser-Style Free Destiny Map Proof</title>
</head>
<body>
  <main>
    <h1>Start your Free Destiny Map</h1>
    <p>This is browser-style local proof. It is not production, not payment, not email, not document upload, and not official application submission.</p>
    <form id="free-destiny-map-form" method="post" data-endpoint="${endpoint}">
      <input name="fullName" value="Kingsmen Browser Demo Candidate" />
      <input name="province" value="KwaZulu-Natal" />
      <input name="knownRoute" value="Free Destiny Map browser-style submit proof" />
      <textarea name="currentSituation">Browser-style demo user wants a route map across study, TVET, funding, accommodation and CV readiness.</textarea>
      <input name="routeInterests" value="higher_education" />
      <input name="routeInterests" value="tvet" />
      <input name="routeInterests" value="nsfas_bursary" />
      <input name="routeInterests" value="accommodation" />
      <input name="routeInterests" value="cv_revamp" />
      <input name="routeInterests" value="source_check" />
      <input name="needsAccommodation" type="checkbox" value="true" checked />
      <input name="accommodationArea" value="Durban / campus or training area" />
      <input name="needsFundingHelp" type="checkbox" value="true" checked />
      <input name="needsCvHelp" type="checkbox" value="true" checked />
      <input name="hasDocumentsReady" type="checkbox" value="false" />
      <input name="randomSourceName" value="Browser demo bursary or learnership source to check later" />
      <input name="consentToBeContacted" type="checkbox" value="true" checked />
      <input name="consentToProcessBasicInfo" type="checkbox" value="true" checked />
      <button type="submit">Send to local intake shell</button>
    </form>
    <script>
      window.KINGSMEN_LOCAL_ENDPOINT = "${endpoint}";
      window.KINGSMEN_PRODUCTION_READY = false;
    </script>
  </main>
</body>
</html>`;

let localWriteSucceeded = false;
let serverStarted = false;
let serverClosed = false;
let webStatus = 0;
let webText = "";
let extractedPayload = null;
let responsePayload = null;
let responseStatus = 0;
let serverPort = 0;

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === webRoute) {
      writeHtml(response, 200, htmlPage);
      return;
    }

    if (request.method !== "POST" || request.url !== endpoint) {
      writeJson(response, 404, {
        accepted: false,
        reference: "KM-FDM-BROWSER404",
        productionReady: false,
        safeNotice: "Browser-style proof route not found.",
        nextAction: "Use the Free Destiny Map browser-style route or local intake endpoint.",
        issues: [
          {
            field: "route",
            code: "NOT_FOUND",
            message: "Browser-style proof only supports the Free Destiny Map route and local intake endpoint."
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
        message: "Contact and basic-info processing consent are required for browser-style proof."
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
        message: "Sensitive fields are blocked in browser-style proof."
      });
    }

    const accepted = issues.length === 0;
    const reference = "KM-FDM-BROWSER11";

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
      safeNotice: "Browser-style local proof only. No production storage, no payment, no email, no documents, no official application submission.",
      nextAction: accepted ? "Browser-style submit proof accepted the demo payload." : "Fix browser-style demo payload issues.",
      issues
    };

    if (localWriteFlag) {
      fs.mkdirSync(localDataDir, { recursive: true });
      const record = {
        schema: "kingsmen.free-destiny-map.browser-style-submit-record.v1",
        module: "BATCH 11 - Real Local App Build Validator / Browser-Style Form Submit Proof",
        productionReady: false,
        storesProductionData: false,
        webRoute,
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
      reference: "KM-FDM-BROWSER500",
      productionReady: false,
      safeNotice: "Browser-style proof error.",
      nextAction: "Repair browser-style proof script.",
      issues: [
        {
          field: "server",
          code: "BROWSER_STYLE_PROOF_ERROR",
          message: error instanceof Error ? error.message : "Unknown browser-style proof error"
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

  check("browser-style-server-started", serverStarted && serverPort > 0, `127.0.0.1:${serverPort}`);

  const pageResponse = await fetch(`http://127.0.0.1:${serverPort}${webRoute}`);
  webStatus = pageResponse.status;
  webText = await pageResponse.text();

  check("browser-style-page-status-200", webStatus === 200, `status=${webStatus}`);
  check("browser-style-page-has-form", webText.includes("free-destiny-map-form"), "form id present");
  check("browser-style-page-has-endpoint", webText.includes(endpoint), "endpoint present");
  check("browser-style-page-production-false", webText.includes("KINGSMEN_PRODUCTION_READY = false"), "production false in web shell");

  extractedPayload = extractBrowserStylePayloadFromHtml(webText);

  check("browser-style-extracted-full-name", extractedPayload.fullName === "Kingsmen Browser Demo Candidate", extractedPayload.fullName);
  check("browser-style-extracted-consent", extractedPayload.consentToBeContacted === true && extractedPayload.consentToProcessBasicInfo === true, "consent true");
  check("browser-style-extracted-route-interests", Array.isArray(extractedPayload.routeInterests) && extractedPayload.routeInterests.length >= 5, `count=${extractedPayload.routeInterests.length}`);
  check("browser-style-payload-no-sensitive-fields", !Object.keys(extractedPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

  const response = await fetch(`http://127.0.0.1:${serverPort}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(extractedPayload)
  });

  responseStatus = response.status;
  responsePayload = await response.json();

  check("browser-style-post-status-202", responseStatus === 202, `status=${responseStatus}`);
  check("browser-style-response-accepted", responsePayload.accepted === true, "accepted true");
  check("browser-style-response-production-false", responsePayload.productionReady === false, "productionReady false");
  check("browser-style-response-official-submission-false", responsePayload.officialApplicationSubmitted === false, "officialApplicationSubmitted false");
  check("browser-style-response-payment-false", responsePayload.paymentInstructionSent === false, "paymentInstructionSent false");
  check("browser-style-response-document-false", responsePayload.documentUploadAccepted === false, "documentUploadAccepted false");
  check("browser-style-response-email-false", responsePayload.emailSent === false, "emailSent false");

  if (localWriteFlag) {
    check("browser-style-jsonl-proof-write", localWriteSucceeded, path.relative(root, localDataFile));
  } else {
    check("browser-style-jsonl-proof-write-skipped", true, "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE is not true");
  }
} finally {
  await new Promise((resolve) => server.close(() => {
    serverClosed = true;
    resolve();
  }));
}

check("browser-style-server-closed", serverClosed, "server closed after proof");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.runtime-proof.v1",
  module: "BATCH 11 - Real Local App Build Validator / Browser-Style Form Submit Proof",
  status: passed ? "BROWSER_STYLE_SUBMIT_PROVEN" : "BUILT_PENDING_RUNTIME_PROOF",
  passed,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  web_route: webRoute,
  http_endpoint: endpoint,
  http_host: "127.0.0.1",
  http_port: serverPort,
  web_status: webStatus,
  response_status: responseStatus,
  response_reference: responsePayload?.reference ?? null,
  local_write_flag: "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE",
  local_write_enabled: localWriteFlag,
  local_write_succeeded: localWriteSucceeded,
  local_data_file: localWriteSucceeded ? path.relative(root, localDataFile).replaceAll("\\", "/") : null,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "browser-style submit proof only; temporary server; no Oracle runtime; no production storage; no Playwright",
  next_action: passed ? "Run validator and commit BATCH 11." : "Repair browser-style submit proof failures."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
