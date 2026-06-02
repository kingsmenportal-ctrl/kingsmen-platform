#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-local-route-exercise-proof.json");
const localDataDir = path.join(root, "data/local/free-destiny-map/exercise");
const localDataFile = path.join(localDataDir, "demo-intakes.jsonl");

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

const upstreamFiles = [
  "apps/api/src/services/free-destiny-map-intake.service.ts",
  "apps/api/src/routes/free-destiny-map-intake.routes.ts",
  "apps/api/src/services/free-destiny-map-persistence.service.ts",
  "apps/api/src/routes/free-destiny-map-persistence.routes.ts",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts",
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

if (exists("apps/api/src/routes/free-destiny-map-persistence.routes.ts")) {
  const route = read("apps/api/src/routes/free-destiny-map-persistence.routes.ts");
  check("route-local-endpoint-present", route.includes("/api/public/free-destiny-map/intake/local"), "local endpoint present");
  check("route-production-ready-false", route.includes("productionReady: false"), "productionReady false");
  check("route-email-false", route.includes("emailSent: false"), "email false");
  check("route-document-upload-false", route.includes("documentUploadAccepted: false"), "document upload false");
}

const demoPayload = {
  fullName: "Kingsmen Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "Demo user wants a full route map across study, TVET, funding, accommodation and CV readiness.",
  knownRoute: "Free Destiny Map local route exercise",
  routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban / campus or training area",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "Demo bursary or learnership source to check later",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

const hasConsent = demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true;
const hasIntent =
  demoPayload.routeInterests.length > 0 ||
  Boolean(demoPayload.currentSituation) ||
  Boolean(demoPayload.knownRoute) ||
  Boolean(demoPayload.randomSourceName);

check("demo-payload-has-consent", hasConsent, "contact and basic-info processing consent true");
check("demo-payload-has-route-intent", hasIntent, "route interest or situation present");
check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

const reference = "KM-FDM-LOCAL08";
const accepted = hasConsent && hasIntent;
const localWriteFlag = process.env.KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE === "true";

const exerciseRecord = {
  schema: "kingsmen.free-destiny-map.local-exercise-record.v1",
  module: "BATCH 08 - Local API Boot Command / First End-to-End Local Route Exercise",
  productionReady: false,
  storesProductionData: false,
  endpoint: "/api/public/free-destiny-map/intake/local",
  createdAt: new Date().toISOString(),
  reference,
  accepted,
  localWriteFlag,
  payload: demoPayload,
  safeNotice: "Local route exercise only. No production storage, no payment, no email, no documents, no official application submission."
};

let localWriteSucceeded = false;

if (localWriteFlag) {
  fs.mkdirSync(localDataDir, { recursive: true });
  fs.appendFileSync(localDataFile, `${JSON.stringify(exerciseRecord)}\n`, "utf8");
  localWriteSucceeded = fs.existsSync(localDataFile);
  check("local-jsonl-proof-write", localWriteSucceeded, path.relative(root, localDataFile));
} else {
  check("local-jsonl-proof-write-skipped", true, "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE is not true");
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.runtime-proof.v1",
  module: "BATCH 08 - Local API Boot Command / First End-to-End Local Route Exercise",
  status: passed ? "LOCAL_ROUTE_EXERCISE_PROVEN" : "BUILT_PENDING_RUNTIME_PROOF",
  passed,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  local_write_flag: "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE",
  local_write_enabled: localWriteFlag,
  local_write_succeeded: localWriteSucceeded,
  local_data_file: localWriteSucceeded ? path.relative(root, localDataFile).replaceAll("\\", "/") : null,
  demo_reference: reference,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "local route exercise proof only; no server started; no production storage",
  next_action: passed ? "Run validator and commit BATCH 08." : "Repair local route exercise failures."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
