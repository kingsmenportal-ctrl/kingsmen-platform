#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/candidate-public-free-destiny-map-entry-latest.json";

const expectedFiles = [
  "docs/candidate/candidate-public-free-destiny-map-entry.md",
  "manifests/candidate/candidate-public-free-destiny-map-entry.json",
  "packages/contracts/src/candidate-public-free-destiny-map-entry.ts",
  "scripts/proof/prove-candidate-public-free-destiny-map-entry.mjs",
  "scripts/validators/validate-candidate-public-free-destiny-map-entry.mjs",
  "apps/web/src/app/kingsmen/page.tsx",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "reports/candidate/candidate-public-free-destiny-map-entry-proof.json"
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
  fs.writeFileSync(full(rel), JSON.stringify(value, null, 2) + "\n", "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const sourcePage = "apps/web/src/app/kingsmen/page.tsx";
const targetPage = "apps/web/src/app/free-destiny-map/page.tsx";
const proofPath = "reports/candidate/candidate-public-free-destiny-map-entry-proof.json";

const source = exists(sourcePage) ? readText(sourcePage) : "";
const target = exists(targetPage) ? readText(targetPage) : "";
const proof = exists(proofPath) ? readJson(proofPath) : null;

check("source-page-has-entry-marker", source.includes('data-kingsmen-free-destiny-map-entry="true"'), "entry marker");
check("source-page-has-entry-href", source.includes('href="/free-destiny-map/"'), "href");
check("source-page-has-entry-label", source.includes("Start Free Destiny Map"), "label");
check("target-page-has-destiny-map-language", /Free Destiny Map|Destiny Map|free-destiny-map/i.test(target), "target text");

check("proof-schema", proof?.schema === "kingsmen.candidate-public-free-destiny-map-entry-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "CANDIDATE_PUBLIC_FREE_DESTINY_MAP_ENTRY_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-starts-docker-false", proof?.startsDocker === false, "startsDocker false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh",
  "WHATSAPP_TOKEN"
];

for (const pattern of forbiddenPatterns) {
  check(`source-no-forbidden:${pattern}`, !source.includes(pattern), pattern);
  check(`target-no-forbidden:${pattern}`, !target.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 32 - Candidate Public Entry to Free Destiny Map",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_candidate_ui_link_only",
  candidate_impact: "Public Kingsmen page now links candidates to the Free Destiny Map entry route.",
  source_page: sourcePage,
  source_route: "/kingsmen",
  target_page: targetPage,
  target_route: "/free-destiny-map/",
  proof: proofPath,
  next_action: passed
    ? "Commit BATCH 32, then move to real Free Destiny Map intake capture proof."
    : "Repair BATCH 32 before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);

