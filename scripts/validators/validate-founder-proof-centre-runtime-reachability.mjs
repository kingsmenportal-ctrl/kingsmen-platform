#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = path.join(root, "reports/validation/founder-proof-centre-runtime-reachability-latest.json");

const expectedFiles = [
  "docs/control-plane/founder-proof-centre-runtime-reachability.md",
  "manifests/control-plane/founder-proof-centre-runtime-reachability.json",
  "packages/contracts/src/founder-proof-centre-runtime-reachability.ts",
  "scripts/proof/prove-founder-proof-centre-runtime-reachability.mjs",
  "scripts/validators/validate-founder-proof-centre-runtime-reachability.mjs",
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "reports/control-plane/founder-proof-centre-runtime-reachability-proof.json",
  "reports/control-plane/founder-proof-centre-runtime-page-capture.html",
  "reports/control-plane/founder-proof-centre-runtime-adapter-capture.json"
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

const proof = exists("reports/control-plane/founder-proof-centre-runtime-reachability-proof.json")
  ? readJson("reports/control-plane/founder-proof-centre-runtime-reachability-proof.json")
  : null;

const pageHtml = exists("reports/control-plane/founder-proof-centre-runtime-page-capture.html")
  ? readText("reports/control-plane/founder-proof-centre-runtime-page-capture.html")
  : "";

const adapter = exists("reports/control-plane/founder-proof-centre-runtime-adapter-capture.json")
  ? readJson("reports/control-plane/founder-proof-centre-runtime-adapter-capture.json")
  : null;

check("proof-schema", proof?.schema === "kingsmen.founder-proof-centre-runtime-reachability-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABLE_LOCAL", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-api-200", proof?.apiHealthStatus === 200, `api=${proof?.apiHealthStatus}`);
check("proof-page-200", proof?.pageStatus === 200, `page=${proof?.pageStatus}`);
check("proof-adapter-200", proof?.adapterStatus === 200, `adapter=${proof?.adapterStatus}`);
check("proof-web-build", proof?.webBuildSucceeded === true, "web image build");
check("proof-compose-up", proof?.composeUpSucceeded === true, "compose up");
check("proof-compose-down", proof?.composeDownSucceeded === true, "compose down");
check("proof-ports-released", proof?.portsReleasedAfterDown === true, "ports released");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

check("page-capture-has-founder-title", pageHtml.includes("Kingsmen Founder Control Plane"), "founder title");
check("page-capture-has-proof-centre", pageHtml.includes("Build Proof Centre"), "proof centre");
check("page-capture-has-local-warning", pageHtml.includes("Local founder proof page only"), "local warning");
check("page-capture-has-proven", pageHtml.includes("PROVEN"), "proven");
check("page-capture-no-production-language", pageHtml.includes("does not claim production readiness"), "no production claim language");

check("adapter-capture-schema", adapter?.schema === "kingsmen.founder-proof-centre-page.v1", adapter?.schema ?? "missing");
check("adapter-capture-route", adapter?.routeHint === "/founder/proof-centre/", adapter?.routeHint ?? "missing");
check("adapter-capture-cards", adapter?.allCardsPassed === true && Array.isArray(adapter?.cards) && adapter.cards.length >= 1, `cards=${adapter?.cards?.length ?? 0}`);
check("adapter-capture-no-production", adapter?.productionReady === false && adapter?.canClaimProduction === false && adapter?.noProductionClaim === true, "production false");
check("adapter-capture-no-oracle", adapter?.deployedToOracle === false && adapter?.noOracleClaim === true, "oracle false");

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`page-no-forbidden:${pattern}`, !pageHtml.includes(pattern), pattern);
}

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 26 - Founder Proof Centre Local Web Runtime Reachability Proof",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "local_runtime_reachability_proof_only_no_service_expansion",
  control_plane_impact: "Founder Proof Centre static page is proven reachable through the local web runtime.",
  proof: "reports/control-plane/founder-proof-centre-runtime-reachability-proof.json",
  page_capture: "reports/control-plane/founder-proof-centre-runtime-page-capture.html",
  adapter_capture: "reports/control-plane/founder-proof-centre-runtime-adapter-capture.json",
  next_action: passed
    ? "Commit BATCH 26."
    : "Repair BATCH 26 runtime reachability proof before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
