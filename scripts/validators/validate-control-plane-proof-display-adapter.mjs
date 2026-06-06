#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = path.join(root, "reports/validation/control-plane-proof-display-adapter-latest.json");

const expectedFiles = [
  "docs/control-plane/build-proof-centre-display-adapter.md",
  "manifests/control-plane/build-proof-centre-display-adapter.json",
  "packages/contracts/src/control-plane-proof-display-adapter.ts",
  "scripts/proof/prove-control-plane-proof-display-adapter.mjs",
  "scripts/validators/validate-control-plane-proof-display-adapter.mjs",
  "reports/control-plane/build-proof-centre-display-adapter.json",
  "reports/control-plane/build-proof-centre-display-adapter-preview.html",
  "reports/control-plane/build-proof-centre-display-adapter-proof.json"
];

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

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const adapter = exists("reports/control-plane/build-proof-centre-display-adapter.json")
  ? readJson("reports/control-plane/build-proof-centre-display-adapter.json")
  : null;

const proof = exists("reports/control-plane/build-proof-centre-display-adapter-proof.json")
  ? readJson("reports/control-plane/build-proof-centre-display-adapter-proof.json")
  : null;

const html = exists("reports/control-plane/build-proof-centre-display-adapter-preview.html")
  ? readText("reports/control-plane/build-proof-centre-display-adapter-preview.html")
  : "";

check("adapter-schema", adapter?.schema === "kingsmen.control-plane-proof-display-adapter.v1", adapter?.schema ?? "missing");
check("adapter-local-only", adapter?.runtimeScope === "local_control_plane_display_adapter_only", adapter?.runtimeScope ?? "missing");
check("adapter-all-cards-passed", adapter?.allCardsPassed === true, String(adapter?.allCardsPassed));
check("adapter-no-production", adapter?.productionReady === false && adapter?.canClaimProduction === false && adapter?.noProductionClaim === true, "production false");
check("adapter-no-oracle", adapter?.deployedToOracle === false && adapter?.noOracleClaim === true, "oracle false");
check("adapter-two-cards", Array.isArray(adapter?.cards) && adapter.cards.length === 2, `cards=${adapter?.cards?.length ?? 0}`);

for (const card of adapter?.cards ?? []) {
  check(`card-${card.id}-proven`, card.badge === "PROVEN" && card.tone === "safe", `${card.badge}/${card.tone}`);
  check(`card-${card.id}-report-path`, typeof card.reportPath === "string" && card.reportPath.length > 0, card.reportPath);
  check(`card-${card.id}-validation-path`, typeof card.validationPath === "string" && card.validationPath.length > 0, card.validationPath);
}

check("html-preview-has-title", html.includes("Kingsmen Build Proof Centre"), "title");
check("html-preview-has-warning", html.includes("Local proof display only"), "warning");
check("html-preview-has-proven", html.includes("PROVEN"), "proven badge");

check("proof-schema", proof?.schema === "kingsmen.control-plane-proof-display-adapter-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "CONTROL_PLANE_PROOF_DISPLAY_ADAPTER_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 24 - Smallest Useful Control-Plane Proof Display Adapter",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_display_adapter_only",
  control_plane_impact: "Future Founder Control Plane can display BATCH 21 and BATCH 22 proof cards using this adapter.",
  adapter: "reports/control-plane/build-proof-centre-display-adapter.json",
  preview: "reports/control-plane/build-proof-centre-display-adapter-preview.html",
  proof: "reports/control-plane/build-proof-centre-display-adapter-proof.json",
  next_action: passed
    ? "Commit BATCH 24."
    : "Repair BATCH 24 proof display adapter before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
