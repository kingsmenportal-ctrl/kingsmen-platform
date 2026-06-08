import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const proofScript = path.join(
  root,
  "scripts/proof/prove-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs"
);

const proofReport = path.join(
  root,
  "reports/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover-proof.json"
);

const validationReport = path.join(
  root,
  "reports/validation/personal-jobs-16-github-proof-index-build-ledger-founder-handover-latest.json"
);

const expectedFiles = [
  "apps/web/src/app/personal-job-desk/proof-index/page.tsx",
  "apps/web/src/app/personal-job-desk/proof-index/ProofIndexClient.tsx",
  "docs/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.md",
  "manifests/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.json",
  "packages/contracts/src/personal-jobs-16-github-proof-index-build-ledger-founder-handover.ts",
  "scripts/proof/prove-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs",
  "scripts/validators/validate-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const missingFiles = expectedFiles.filter((filePath) => !exists(filePath));

const proofRun = spawnSync(process.execPath, [proofScript], {
  cwd: root,
  stdio: "inherit"
});

let proof = null;

try {
  proof = JSON.parse(fs.readFileSync(proofReport, "utf8").replace(/^\uFEFF/, ""));
} catch {
  proof = null;
}

const failedChecks = [];

if (proofRun.status !== 0) {
  failedChecks.push({
    name: "proof-script-exit-zero",
    passed: false,
    detail: `exit ${proofRun.status}`
  });
}

if (missingFiles.length > 0) {
  failedChecks.push({
    name: "expected-files-present",
    passed: false,
    detail: missingFiles.join(", ")
  });
}

if (proof?.passed !== true) {
  failedChecks.push({
    name: "proof-passed",
    passed: false,
    detail: proof?.status ?? "proof report missing or failed"
  });
}

if (proof?.dependencyModuleCount !== 13) {
  failedChecks.push({
    name: "dependency-module-count",
    passed: false,
    detail: String(proof?.dependencyModuleCount ?? "missing")
  });
}

if (Array.isArray(proof?.failed) && proof.failed.length > 0) {
  failedChecks.push({
    name: "proof-failed-checks-empty",
    passed: false,
    detail: `${proof.failed.length} failed checks`
  });
}

if (proof?.productionReady !== false || proof?.canClaimProduction !== false || proof?.deployedToOracle !== false) {
  failedChecks.push({
    name: "no-production-claim",
    passed: false,
    detail: "production/oracle claim must stay false"
  });
}

const passed = failedChecks.length === 0;

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-16 - GitHub Proof Index / Build Ledger / Founder Handover",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: expectedFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "This is a local UI proof index and founder handover surface only.",
    "This does not prove production readiness.",
    "This does not deploy to Oracle.",
    "This does not send messages, contact employers, scrape websites, or touch payments.",
    "Runtime route clickability should still be checked separately through the local dev server."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/proof-index",
  proof: "reports/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover-proof.json",
  next_action: passed
    ? "Commit PERSONAL-JOBS-16 tracked files only."
    : "Repair PERSONAL-JOBS-16 before moving forward."
};

fs.mkdirSync(path.dirname(validationReport), { recursive: true });
fs.writeFileSync(validationReport, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(JSON.stringify(result, null, 2));

if (!passed) {
  process.exitCode = 1;
}