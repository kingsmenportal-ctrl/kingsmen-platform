#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = path.join(root, "reports/validation/docker-oracle-lite-runtime-health-hardening-latest.json");

const expectedFiles = [
  "docs/runtime/docker-oracle-lite-runtime-health-hardening.md",
  "manifests/runtime/docker-oracle-lite-runtime-health-hardening.json",
  "packages/contracts/src/docker-oracle-lite-runtime-health.ts",
  "scripts/runtime/Invoke-DockerOracleLiteRuntimeHealthHardening.ps1",
  "scripts/proof/prove-docker-oracle-lite-runtime-health-hardening.mjs",
  "scripts/validators/validate-docker-oracle-lite-runtime-health-hardening.mjs",
  "reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json"
];

const checks = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

let proof = null;

if (exists("reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json")) {
  proof = readJson("reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json");

  check("proof-schema", proof.schema === "kingsmen.docker-oracle-lite-runtime-health-hardening-report.v1", proof.schema);
  check("proof-status", proof.status === "DOCKER_RUNTIME_HEALTH_HARDENED_LOCAL", proof.status);
  check("proof-passed", proof.passed === true, String(proof.passed));
  check("proof-not-production", proof.productionReady === false && proof.canClaimProduction === false, "production false");
  check("proof-not-oracle", proof.deployedToOracle === false, "oracle false");
  check("proof-two-cycles", Array.isArray(proof.cycles) && proof.cycles.length === 2, `cycles=${proof.cycles?.length ?? 0}`);
  check("proof-no-failed-checks", Array.isArray(proof.failed) && proof.failed.length === 0, `failed=${proof.failed?.length ?? "unknown"}`);

  for (const cycle of proof.cycles ?? []) {
    check(`cycle-${cycle.cycle}-up`, cycle.composeUpSucceeded === true, "up");
    check(`cycle-${cycle.cycle}-down`, cycle.composeDownSucceeded === true, "down");
    check(`cycle-${cycle.cycle}-api-200`, cycle.apiHealthStatus === 200, `api=${cycle.apiHealthStatus}`);
    check(`cycle-${cycle.cycle}-web-200`, cycle.webStatus === 200, `web=${cycle.webStatus}`);
    check(`cycle-${cycle.cycle}-not-production`, cycle.apiProductionReady === false && cycle.apiCanClaimProduction === false, "production false");
    check(`cycle-${cycle.cycle}-not-oracle`, cycle.apiDeployedToOracle === false, "oracle false");
    check(`cycle-${cycle.cycle}-logs`, cycle.apiLogCaptured === true && cycle.webLogCaptured === true, "logs");
    check(`cycle-${cycle.cycle}-ports-released`, cycle.portsReleasedAfterDown === true, "ports");
  }
}

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 22 - Docker Oracle Lite Runtime Health Hardening",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "local_runtime_health_hardened_without_expanding_services",
  control_plane_impact: "Build Proof Centre can show repeated local runtime health proof.",
  runtime_proof: "reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json",
  next_action: passed
    ? "Commit BATCH 22."
    : "Repair BATCH 22 runtime health proof before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
