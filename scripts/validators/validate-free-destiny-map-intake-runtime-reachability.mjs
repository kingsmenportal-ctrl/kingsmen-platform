#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/free-destiny-map-intake-runtime-reachability-latest.json";

const expectedFiles = [
  "docs/candidate/free-destiny-map-intake-runtime-reachability.md",
  "manifests/candidate/free-destiny-map-intake-runtime-reachability.json",
  "packages/contracts/src/free-destiny-map-intake-runtime-reachability.ts",
  "scripts/proof/prove-free-destiny-map-intake-runtime-reachability.mjs",
  "scripts/validators/validate-free-destiny-map-intake-runtime-reachability.mjs",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "docker/oracle-lite/docker-compose.local.yml",
  "reports/candidate/free-destiny-map-intake-capture-proof.json",
  "reports/validation/free-destiny-map-intake-capture-latest.json",
  "reports/candidate/free-destiny-map-intake-runtime-reachability-proof.json"
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

const proofPath = "reports/candidate/free-destiny-map-intake-runtime-reachability-proof.json";
const proof = exists(proofPath) ? readJson(proofPath) : null;

check("proof-schema", proof?.schema === "kingsmen.free-destiny-map-intake-runtime-reachability-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "FREE_DESTINY_MAP_INTAKE_RUNTIME_REACHABLE_LOCAL", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-starts-docker-declared", proof?.startsDocker === true, "startsDocker true");
check("proof-compose-up", proof?.composeUpSucceeded === true, "compose up true");
check("proof-compose-down", proof?.composeDownSucceeded === true, "compose down true");
check("proof-page-status-200", proof?.pageStatus === 200, `pageStatus=${proof?.pageStatus ?? "missing"}`);
check("proof-no-candidate-data-storage", proof?.storesCandidateData === false && proof?.sendsCandidateData === false, "no store/send");
check("proof-no-contact", proof?.touchesContactData === false, "contact false");
check("proof-no-payments", proof?.touchesPayments === false, "payments false");
check("proof-no-messaging", proof?.touchesMessaging === false, "messaging false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 34 - Free Destiny Map Intake Local Runtime Reachability Proof",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "controlled_local_docker_candidate_route_reachability_only",
  candidate_impact: "Free Destiny Map intake page is reachable through the local Oracle Lite web runtime.",
  source_route: "/free-destiny-map/",
  proof: proofPath,
  next_action: passed
    ? "Commit BATCH 34, then move to the smallest useful preview-result surface for the Free Destiny Map."
    : "Repair BATCH 34 runtime reachability before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
