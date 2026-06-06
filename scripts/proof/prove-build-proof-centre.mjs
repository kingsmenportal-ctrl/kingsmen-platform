#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const paths = {
  batch21Proof: "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json",
  batch21Validation: "reports/validation/docker-oracle-lite-controlled-runtime-latest.json",
  batch22Proof: "reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json",
  batch22Validation: "reports/validation/docker-oracle-lite-runtime-health-hardening-latest.json",
  readModel: "reports/runtime/build-proof-centre-read-model.json",
  proof: "reports/runtime/build-proof-centre-proof.json"
};

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, ""));
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function safeFalse(value) {
  return value === false;
}

for (const rel of Object.values(paths).filter((p) => !p.includes("build-proof-centre"))) {
  check(`input-exists:${rel}`, exists(rel), rel);
}

const batch21 = exists(paths.batch21Proof) ? readJson(paths.batch21Proof) : null;
const batch21Validation = exists(paths.batch21Validation) ? readJson(paths.batch21Validation) : null;
const batch22 = exists(paths.batch22Proof) ? readJson(paths.batch22Proof) : null;
const batch22Validation = exists(paths.batch22Validation) ? readJson(paths.batch22Validation) : null;

check("batch21-proof-passed", batch21?.passed === true, batch21?.status ?? "missing");
check("batch21-validation-passed", batch21Validation?.passed === true && batch21Validation?.status === "VALIDATED", batch21Validation?.status ?? "missing");
check("batch21-no-production-claim", safeFalse(batch21?.productionReady) && safeFalse(batch21?.canClaimProduction), "BATCH 21 production flags");
check("batch21-no-oracle-claim", safeFalse(batch21?.deployedToOracle), "BATCH 21 oracle flag");

check("batch22-proof-passed", batch22?.passed === true, batch22?.status ?? "missing");
check("batch22-validation-passed", batch22Validation?.passed === true && batch22Validation?.status === "VALIDATED", batch22Validation?.status ?? "missing");
check("batch22-no-production-claim", safeFalse(batch22?.productionReady) && safeFalse(batch22?.canClaimProduction), "BATCH 22 production flags");
check("batch22-no-oracle-claim", safeFalse(batch22?.deployedToOracle), "BATCH 22 oracle flag");
check("batch22-two-cycles", batch22?.composeCyclesExpected === 2 && batch22?.composeCyclesCompleted === 2, `expected=${batch22?.composeCyclesExpected}; completed=${batch22?.composeCyclesCompleted}`);
check("batch22-no-failed-checks", Array.isArray(batch22?.failed) && batch22.failed.length === 0, `failed=${batch22?.failed?.length ?? "unknown"}`);

const proofItems = [
  {
    id: "docker-oracle-lite-controlled-runtime",
    label: "Docker Oracle Lite Controlled Runtime",
    module: batch21?.module ?? "BATCH 21",
    status: batch21?.status ?? "MISSING",
    validationStatus: batch21Validation?.status ?? "MISSING",
    passed: batch21?.passed === true && batch21Validation?.passed === true,
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    reportPath: paths.batch21Proof,
    validationPath: paths.batch21Validation,
    keyMetrics: {
      apiHealthStatus: batch21?.apiHealthStatus ?? null,
      webStatus: batch21?.webStatus ?? null,
      bridgeApiStatus: batch21?.bridgeApiStatus ?? null,
      composeUpSucceeded: batch21?.composeUpSucceeded ?? null,
      composeDownSucceeded: batch21?.composeDownSucceeded ?? null
    }
  },
  {
    id: "docker-oracle-lite-runtime-health-hardening",
    label: "Docker Oracle Lite Runtime Health Hardening",
    module: batch22?.module ?? "BATCH 22",
    status: batch22?.status ?? "MISSING",
    validationStatus: batch22Validation?.status ?? "MISSING",
    passed: batch22?.passed === true && batch22Validation?.passed === true,
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    reportPath: paths.batch22Proof,
    validationPath: paths.batch22Validation,
    keyMetrics: {
      composeCyclesExpected: batch22?.composeCyclesExpected ?? null,
      composeCyclesCompleted: batch22?.composeCyclesCompleted ?? null,
      failedChecks: Array.isArray(batch22?.failed) ? batch22.failed.length : null
    }
  }
];

const allProofItemsPassed = proofItems.every((item) => item.passed === true);
const noProductionClaim = proofItems.every((item) => item.productionReady === false && item.canClaimProduction === false);
const noOracleClaim = proofItems.every((item) => item.deployedToOracle === false);

check("read-model-two-proof-items", proofItems.length === 2, `items=${proofItems.length}`);
check("read-model-all-proof-items-passed", allProofItemsPassed, "all proof items passed");
check("read-model-no-production-claim", noProductionClaim, "no production claim");
check("read-model-no-oracle-claim", noOracleClaim, "no oracle claim");

const readModel = {
  schema: "kingsmen.build-proof-centre-read-model.v1",
  module: "BATCH 23 - Build Proof Centre Read Model",
  generated_at: new Date().toISOString(),
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  runtimeScope: "local_file_read_model_only",
  allProofItemsPassed,
  noProductionClaim,
  noOracleClaim,
  proofItems,
  founderSummary: allProofItemsPassed
    ? "BATCH 21 and BATCH 22 are locally proven and validated. This is local proof only, not production or Oracle deployment proof."
    : "One or more runtime proof gates are missing, failed, or unvalidated.",
  nextAction: allProofItemsPassed
    ? "Commit BATCH 23, then proceed to the smallest useful control-plane display adapter."
    : "Repair failed proof inputs before control-plane display work."
};

fs.mkdirSync(path.dirname(full(paths.readModel)), { recursive: true });
fs.writeFileSync(full(paths.readModel), `${JSON.stringify(readModel, null, 2)}\n`);

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0 && allProofItemsPassed && noProductionClaim && noOracleClaim;

const proof = {
  schema: "kingsmen.build-proof-centre-proof.v1",
  module: "BATCH 23 - Build Proof Centre Read Model",
  status: passed
    ? "BUILD_PROOF_CENTRE_READ_MODEL_PROVEN"
    : "BUILD_PROOF_CENTRE_READ_MODEL_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  readModelPath: paths.readModel,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 23."
    : "Repair failed Build Proof Centre checks before moving forward."
};

fs.writeFileSync(full(paths.proof), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));

if (!passed) process.exit(1);
