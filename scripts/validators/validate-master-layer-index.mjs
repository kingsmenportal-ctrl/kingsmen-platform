#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  "docs/master/KINGSMEN_MASTER_LAYER_INDEX.md",
  "docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md",
  "docs/master/KINGSMEN_BUILD_ORDER_AND_PROOF_RULES.md",
  "manifests/master/kingsmen-master-layer-index.json",
  "scripts/proof/prove-master-layer-index-and-provider-gates.mjs"
];

const failures = [];

function full(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

for (const file of required) {
  if (!fs.existsSync(full(file))) failures.push(`Missing ${file}`);
  else if (fs.statSync(full(file)).size === 0) failures.push(`Empty ${file}`);
}

if (fs.existsSync(full("manifests/master/kingsmen-master-layer-index.json"))) {
  const manifest = JSON.parse(read("manifests/master/kingsmen-master-layer-index.json"));

  if (manifest.productionReady !== false) failures.push("productionReady must be false.");
  if (manifest.deployedToOracle !== false) failures.push("deployedToOracle must be false.");
  if (!Array.isArray(manifest.layers) || manifest.layers.length < 10) failures.push("Master index must contain at least 10 layers.");

  for (const requiredLayer of ["N04", "N05", "N06", "N07", "N08", "MASTER-INDEX-01", "BATCH-21C", "BATCH-22"]) {
    if (!manifest.layers.some((layer) => layer.id === requiredLayer)) failures.push(`Missing layer ${requiredLayer}.`);
  }
}

if (fs.existsSync(full("docs/master/KINGSMEN_MASTER_LAYER_INDEX.md"))) {
  const doc = read("docs/master/KINGSMEN_MASTER_LAYER_INDEX.md");
  for (const token of [
    "No chat message proves a file exists",
    "Oracle Free / Oracle Lite",
    "N04 Candidate Core and Portal closeout",
    "BATCH 21C remains the next runtime proof gate"
  ]) {
    if (!doc.includes(token)) failures.push(`Master doc missing token: ${token}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "MASTER-INDEX-01 - Master Layer Index",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  productionReady: false,
  failed_checks: failures,
  generated_at: new Date().toISOString(),
  next_action: passed ? "Validate provider gates and no-production-claims boundary." : "Repair master layer index."
};

fs.mkdirSync(full("reports/validation"), { recursive: true });
fs.writeFileSync(full("reports/validation/master-layer-index-validation-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
