#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/free-destiny-map-intake-capture-latest.json";

const expectedFiles = [
  "docs/candidate/free-destiny-map-intake-capture.md",
  "manifests/candidate/free-destiny-map-intake-capture.json",
  "packages/contracts/src/free-destiny-map-intake-capture.ts",
  "scripts/proof/prove-free-destiny-map-intake-capture.mjs",
  "scripts/validators/validate-free-destiny-map-intake-capture.mjs",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "reports/candidate/free-destiny-map-intake-capture-proof.json"
];

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const pagePath = "apps/web/src/app/free-destiny-map/page.tsx";
const proofPath = "reports/candidate/free-destiny-map-intake-capture-proof.json";
const page = exists(pagePath) ? readText(pagePath) : "";
const proof = exists(proofPath) ? readJson(proofPath) : null;

check("proof-schema", proof?.schema === "kingsmen.free-destiny-map-intake-capture-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "FREE_DESTINY_MAP_INTAKE_CAPTURE_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-does-not-start-docker", proof?.startsDocker === false, "startsDocker false");
check("proof-touches-candidate-ui-data-only", proof?.touchesCandidateData === true, "candidate UI data true");
check("proof-no-sensitive-candidate-data", proof?.touchesSensitiveCandidateData === false, "sensitive false");
check("proof-no-storage", proof?.storesCandidateData === false && proof?.sendsCandidateData === false, "no store/send");
check("proof-no-contact", proof?.touchesContactData === false, "contact false");
check("proof-no-payments", proof?.touchesPayments === false, "payments false");
check("proof-no-messaging", proof?.touchesMessaging === false, "messaging false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

check("page-has-intake-form", page.includes('data-kingsmen-free-destiny-map-intake="true"'), "form marker");
check("page-has-all-intake-fields",
  [
    "current-stage",
    "province",
    "route-interest",
    "biggest-blocker",
    "readiness-goal",
    "boundary-confirmation"
  ].every((field) => page.includes(`data-kingsmen-intake-field="${field}"`)),
  "all field markers"
);
check("page-preview-button-not-submit", page.includes('data-kingsmen-intake-button="preview-path"') && page.includes('type="button"'), "button marker");
check("page-no-submit-or-storage", !page.includes("fetch(") && !page.includes("localStorage") && !page.includes("sessionStorage") && !page.includes("onSubmit"), "no submit/storage");
check("page-no-sensitive-contact-fields", !/email|phone|cell|whatsapp|surname|id number|identity number/i.test(page), "no contact or ID fields");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 33 - Free Destiny Map Intake Capture Proof",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_candidate_ui_intake_surface_only",
  candidate_impact: "Free Destiny Map now has a safe non-sensitive intake capture surface.",
  source_page: pagePath,
  source_route: "/free-destiny-map/",
  proof: proofPath,
  next_action: passed
    ? "Commit BATCH 33, then move to BATCH 34 - Free Destiny Map intake local runtime reachability proof."
    : "Repair BATCH 33 intake capture before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
