#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const master = readJson("manifests/master/kingsmen-master-layer-index.json");
const providers = readJson("manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json");

const checks = [];

checks.push({
  name: "master_manifest_present",
  passed: master.schema === "kingsmen.master-layer-index.v1"
});

checks.push({
  name: "provider_manifest_present",
  passed: providers.schema === "kingsmen.provider-gates.v1"
});

checks.push({
  name: "provider_count_25",
  passed: Array.isArray(providers.providers) && providers.providers.length === 25
});

checks.push({
  name: "production_claims_false",
  passed:
    master.productionReady === false &&
    master.deployedToOracle === false &&
    master.paymentsLive === false &&
    master.emailRuntimeLive === false &&
    providers.productionReady === false
});

checks.push({
  name: "next_runtime_gate_batch21c",
  passed: master.layers.some((layer) => layer.id === "BATCH-21C" && layer.status === "next_runtime_gate")
});

const failed = checks.filter((check) => !check.passed);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.master-index-provider-gates-proof.v1",
  module: "MASTER-INDEX-01 - KINGSMEN_MASTER_LAYER_INDEX / 25 Provider Gates / Build Order / Proof Matrix",
  status: passed ? "MASTER_INDEX_PROVIDER_GATES_BUILD_ORDER_PROOF_MATRIX_PROVEN" : "MASTER_INDEX_PROVIDER_GATES_BUILD_ORDER_PROOF_MATRIX_FAILED",
  passed,
  productionReady: false,
  checks,
  failed_checks: failed,
  generated_at: new Date().toISOString(),
  next_action: passed ? "Run validators, commit and push MASTER-INDEX-01." : "Repair master index/provider gate files."
};

fs.mkdirSync(path.join(root, "reports/master"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/master/master-layer-index-proof-latest.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
