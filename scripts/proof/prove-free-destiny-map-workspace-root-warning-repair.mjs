#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json");
const checks = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

check("next-config-exists", exists("apps/web/next.config.mjs"), "apps/web/next.config.mjs");
check("batch-14-proof-exists", exists("reports/runtime/free-destiny-map-controlled-next-boot-proof.json"), "reports/runtime/free-destiny-map-controlled-next-boot-proof.json");
check("web-package-lock-exists", exists("apps/web/package-lock.json"), "apps/web/package-lock.json");
check("repo-package-lock-preserved", exists("package-lock.json"), "package-lock.json");
check("no-external-delete-claim", true, "BATCH 15A does not delete C:\\Users\\dell\\package-lock.json or any external file.");

if (exists("apps/web/next.config.mjs")) {
  const config = read("apps/web/next.config.mjs");
  check("next-config-imports-path", config.includes('import path from "node:path"'), "node:path import present");
  check("next-config-imports-file-url", config.includes('fileURLToPath'), "fileURLToPath import present");
  check("next-config-defines-repo-root", config.includes("kingsmenRepoRoot") && config.includes("../.."), "repo root from apps/web");
  check("next-config-sets-output-file-tracing-root", config.includes("outputFileTracingRoot: kingsmenRepoRoot"), "explicit outputFileTracingRoot present");
  check("next-config-keeps-external-dir", config.includes("externalDir: true"), "externalDir still enabled");
  check("next-config-keeps-powered-header-off", config.includes("poweredByHeader: false"), "poweredByHeader false");
}

if (exists("reports/runtime/free-destiny-map-controlled-next-boot-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-controlled-next-boot-proof.json");
  check("batch-14-controlled-next-boot-proven", proof.status === "CONTROLLED_NEXT_BOOT_PROVEN" && proof.passed === true, `status=${proof.status}; passed=${proof.passed}`);
  check("batch-14-production-still-false", proof.productionReady === false && proof.canClaimProduction === false, "production false");
  check("batch-14-web-status-200", proof.webStatus === 200, `webStatus=${proof.webStatus}`);
}

const forbiddenFiles = [
  "apps/web/next.config.mjs",
  "packages/contracts/src/free-destiny-map-workspace-root-warning-repair.ts"
];

const forbiddenPatterns = [
  [/productionReady\s*[:=]\s*true/i, "productionReady true"],
  [/canClaimProduction\s*[:=]\s*true/i, "canClaimProduction true"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/documentUploadAccepted:\s*true/i, "document upload accepted true"]
];

for (const file of forbiddenFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    check(`forbidden-pattern-absent:${file}:${label}`, !pattern.test(content), label);
  }
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.workspace-root-warning-repair-report.v1",
  module: "BATCH 15A - Workspace Root / Lockfile Warning Repair",
  status: passed ? "WORKSPACE_ROOT_WARNING_REPAIR_APPLIED" : "WORKSPACE_ROOT_WARNING_REPAIR_BLOCKED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "Next workspace-root warning repair only; no server boot; no production deployment",
  next_action: passed
    ? "Rerun BATCH 14 controlled Next boot proof to confirm warning repair, then commit."
    : "Repair failed workspace-root warning checks."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
