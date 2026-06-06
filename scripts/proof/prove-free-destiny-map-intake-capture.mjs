#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const pagePath = "apps/web/src/app/free-destiny-map/page.tsx";
const proofPath = "reports/candidate/free-destiny-map-intake-capture-proof.json";
const batch32ProofPath = "reports/candidate/candidate-public-free-destiny-map-entry-proof.json";
const batch32ValidationPath = "reports/validation/candidate-public-free-destiny-map-entry-latest.json";

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

check(`required-file:${pagePath}`, exists(pagePath), pagePath);
check(`required-file:${batch32ProofPath}`, exists(batch32ProofPath), batch32ProofPath);
check(`required-file:${batch32ValidationPath}`, exists(batch32ValidationPath), batch32ValidationPath);

const batch32Proof = exists(batch32ProofPath) ? readJson(batch32ProofPath) : null;
const batch32Validation = exists(batch32ValidationPath) ? readJson(batch32ValidationPath) : null;
const page = exists(pagePath) ? readText(pagePath) : "";

check(
  "batch32-entry-proof-passed",
  batch32Proof?.status === "CANDIDATE_PUBLIC_FREE_DESTINY_MAP_ENTRY_PROVEN" && batch32Proof?.passed === true,
  batch32Proof?.status ?? "missing"
);

check(
  "batch32-entry-validation-passed",
  batch32Validation?.status === "VALIDATED" && batch32Validation?.passed === true,
  batch32Validation?.status ?? "missing"
);

check("page-identifies-free-destiny-map", page.includes("Free Destiny Map"), "Free Destiny Map text");
check("page-has-intake-form-marker", page.includes('data-kingsmen-free-destiny-map-intake="true"'), "form marker");
check("page-has-form-tag", /<form[\s\S]*data-kingsmen-free-destiny-map-intake="true"/.test(page), "form tag");
check("page-has-current-stage-field", page.includes('data-kingsmen-intake-field="current-stage"'), "current stage");
check("page-has-province-field", page.includes('data-kingsmen-intake-field="province"'), "province");
check("page-has-route-interest-field", page.includes('data-kingsmen-intake-field="route-interest"'), "route interest");
check("page-has-biggest-blocker-field", page.includes('data-kingsmen-intake-field="biggest-blocker"'), "biggest blocker");
check("page-has-readiness-goal-field", page.includes('data-kingsmen-intake-field="readiness-goal"'), "readiness goal");
check("page-has-boundary-confirmation", page.includes('data-kingsmen-intake-field="boundary-confirmation"'), "boundary confirmation");
check("page-has-preview-button", page.includes('data-kingsmen-intake-button="preview-path"'), "preview path button");
check("button-is-not-submit", page.includes('type="button"') && !page.includes('type="submit"'), "type button only");

check("form-has-no-action", !/<form[^>]*\saction=/.test(page), "no form action");
check("form-has-no-post-method", !/<form[^>]*\smethod=/.test(page), "no form method");
check("page-has-no-field-name-submit-values", !/\sname=/.test(page), "no HTML name attributes");
check("page-has-no-client-js-handler", !page.includes("onSubmit") && !page.includes("onClick"), "no handlers");
check("page-is-static-server-page", !page.includes('"use client"') && !page.includes("'use client'"), "no client component");
check("page-has-no-backend-fetch", !page.includes("fetch(") && !page.includes("axios") && !page.includes("/api/"), "no API calls");
check("page-has-no-storage", !page.includes("localStorage") && !page.includes("sessionStorage") && !page.includes("document.cookie"), "no browser storage");
check("page-has-no-contact-fields", !/email|phone|cell|whatsapp|surname|id number|identity number/i.test(page), "no contact or ID fields");
check("no-production-ready-claim", !page.includes("productionReady: true") && !page.includes("production ready"), "no production claim");
check("no-oracle-deployed-claim", !page.includes("deployedToOracle: true") && !page.includes("Oracle deployed"), "no Oracle claim");

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh",
  "WHATSAPP_TOKEN",
  "SUPABASE_SERVICE_ROLE",
  "PAYFAST_MERCHANT_KEY"
];

for (const pattern of forbiddenPatterns) {
  check(`page-no-forbidden:${pattern}`, !page.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.free-destiny-map-intake-capture-proof.v1",
  module: "BATCH 33 - Free Destiny Map Intake Capture Proof",
  status: passed
    ? "FREE_DESTINY_MAP_INTAKE_CAPTURE_PROVEN"
    : "FREE_DESTINY_MAP_INTAKE_CAPTURE_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  touchesSecrets: false,
  touchesCandidateData: true,
  candidateDataScope: "non_sensitive_static_ui_only_no_submit_no_storage",
  touchesSensitiveCandidateData: false,
  storesCandidateData: false,
  sendsCandidateData: false,
  touchesContactData: false,
  touchesPayments: false,
  touchesMessaging: false,
  generated_at: new Date().toISOString(),
  sourceRoute: "/free-destiny-map/",
  sourcePage: pagePath,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 33."
    : "Repair Free Destiny Map intake capture surface before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
