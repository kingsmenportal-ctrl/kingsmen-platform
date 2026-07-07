#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = path.join(root, "reports/validation/founder-proof-centre-page-wiring-latest.json");

const expectedFiles = [
  "docs/control-plane/founder-proof-centre-page-wiring.md",
  "manifests/control-plane/founder-proof-centre-page-wiring.json",
  "packages/contracts/src/founder-proof-centre-page.ts",
  "scripts/proof/prove-founder-proof-centre-page-wiring.mjs",
  "scripts/validators/validate-founder-proof-centre-page-wiring.mjs",
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "apps/web/public/founder/proof-centre/adapter.json",
  "reports/control-plane/founder-proof-centre-page-wiring-proof.json"
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

const pageModel = exists("apps/web/public/founder/proof-centre/adapter.json")
  ? readJson("apps/web/public/founder/proof-centre/adapter.json")
  : null;

const proof = exists("reports/control-plane/founder-proof-centre-page-wiring-proof.json")
  ? readJson("reports/control-plane/founder-proof-centre-page-wiring-proof.json")
  : null;

const route = exists("apps/web/src/app/founder/proof-centre/page.tsx") ? readText("apps/web/src/app/founder/proof-centre/page.tsx") : "";

check("web-next-route-path", exists("apps/web/src/app/founder/proof-centre/page.tsx"), "real Next route");
check("web-public-adapter-path", exists("apps/web/public/founder/proof-centre/adapter.json"), "static public adapter");
check("page-model-schema", pageModel?.schema === "kingsmen.founder-proof-centre-page.v1", pageModel?.schema ?? "missing");
check("page-model-local-only", pageModel?.runtimeScope === "local_static_founder_page_wiring_only", pageModel?.runtimeScope ?? "missing");
check("page-model-route-hint", pageModel?.routeHint === "/founder/proof-centre/", pageModel?.routeHint ?? "missing");
check("page-model-all-cards-passed", pageModel?.allCardsPassed === true, String(pageModel?.allCardsPassed));
check("page-model-no-production", pageModel?.productionReady === false && pageModel?.canClaimProduction === false && pageModel?.noProductionClaim === true, "production false");
check("page-model-no-oracle", pageModel?.deployedToOracle === false && pageModel?.noOracleClaim === true, "oracle false");
check("page-model-has-cards", Array.isArray(pageModel?.cards) && pageModel.cards.length >= 1, `cards=${pageModel?.cards?.length ?? 0}`);

check("route-has-founder-title", route.includes("Kingsmen Founder Control Plane"), "founder title");
check("route-has-proof-centre", route.includes("Build Proof Centre"), "proof centre");
check("route-has-local-warning", route.includes("proof display only") || route.includes("Boundary: proof display only"), "proof display warning");
check("route-has-no-production-claim", route.includes("does not claim production readiness"), "no production claim language");
check("route-has-proven-badge", route.includes("PROVEN"), "proven badge");

check("proof-schema", proof?.schema === "kingsmen.founder-proof-centre-page-wiring-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "FOUNDER_PROOF_CENTRE_PAGE_WIRING_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const forbiddenHtmlPatterns = [
  "service_role",
  "PAYFAST",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenHtmlPatterns) {
  check(`route-no-forbidden:${pattern}`, !route.includes(pattern), pattern);
}

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 25 - Smallest Founder Control Plane Page Wiring",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_static_web_page_only",
  control_plane_impact: "Founder can view BATCH 24 proof cards through a tiny static web page once the local web app is running.",
  route_hint: "/founder/proof-centre/",
  html: "apps/web/src/app/founder/proof-centre/page.tsx",
  public_adapter: "apps/web/public/founder/proof-centre/adapter.json",
  proof: "reports/control-plane/founder-proof-centre-page-wiring-proof.json",
  next_action: passed
    ? "Commit BATCH 25."
    : "Repair BATCH 25 founder proof centre page wiring before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
