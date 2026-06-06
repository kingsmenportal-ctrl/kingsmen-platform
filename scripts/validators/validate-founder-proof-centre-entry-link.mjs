#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = path.join(root, "reports/validation/founder-proof-centre-entry-link-latest.json");

const expectedFiles = [
  "docs/control-plane/founder-proof-centre-entry-link.md",
  "manifests/control-plane/founder-proof-centre-entry-link.json",
  "packages/contracts/src/founder-proof-centre-entry-link.ts",
  "scripts/proof/prove-founder-proof-centre-entry-link.mjs",
  "scripts/validators/validate-founder-proof-centre-entry-link.mjs",
  "apps/web/src/app/founder/control-plane/page.tsx",
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "reports/control-plane/founder-proof-centre-entry-link-proof.json"
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

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const sourcePage = "apps/web/src/app/founder/control-plane/page.tsx";
const targetPage = "apps/web/src/app/founder/proof-centre/page.tsx";
const proofPath = "reports/control-plane/founder-proof-centre-entry-link-proof.json";

const source = exists(sourcePage) ? readText(sourcePage) : "";
const target = exists(targetPage) ? readText(targetPage) : "";
const proof = exists(proofPath) ? readJson(proofPath) : null;

check("source-page-has-entry-marker", source.includes('data-kingsmen-proof-centre-entry="true"'), "entry marker");
check("source-page-has-entry-href", source.includes('href="/founder/proof-centre/"'), "href");
check("source-page-has-entry-label", source.includes("Open Build Proof Centre"), "label");
check("target-page-has-founder-title", target.includes("Kingsmen Founder Control Plane"), "target founder title");
check("target-page-has-build-proof-centre", target.includes("Build Proof Centre"), "target proof centre text");

check("proof-schema", proof?.schema === "kingsmen.founder-proof-centre-entry-link-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "FOUNDER_PROOF_CENTRE_ENTRY_LINK_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`source-no-forbidden:${pattern}`, !source.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 27 - Founder Control Plane Proof Centre Entry Link",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_ui_link_only",
  control_plane_impact: "Existing Founder Control Plane page links to the proven Founder Proof Centre route.",
  source_page: sourcePage,
  target_route: "/founder/proof-centre/",
  proof: proofPath,
  next_action: passed
    ? "Commit BATCH 27."
    : "Repair BATCH 27 entry link before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
