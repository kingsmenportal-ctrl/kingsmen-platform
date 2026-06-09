import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const proofScript = path.join(root, "scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs");
const proofReport = path.join(root, "reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json");
const validationReport = path.join(root, "reports/validation/personal-jobs-19-playwright-source-scout-latest.json");

const expectedFiles = [
  ".gitignore",
  "data/personal-job-desk/source-scout-queue.local.example.json",
  "scripts/agents/personal-job-playwright-source-scout.mjs",
  "apps/web/src/app/api/personal-jobs/source-scout/run/route.ts",
  "apps/web/src/app/personal-job-desk/source-scout/page.tsx",
  "apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx",
  "packages/contracts/src/personal-jobs-19-playwright-source-scout.ts",
  "docs/personal-jobs/personal-jobs-19-playwright-source-scout.md",
  "manifests/personal-jobs/personal-jobs-19-playwright-source-scout.json",
  "scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs",
  "scripts/validators/validate-personal-jobs-19-playwright-source-scout.mjs"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const missingFiles = expectedFiles.filter((file) => !exists(file));

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
    detail: proof?.status ?? "proof report missing"
  });
}

if (proof?.usesPlaywrightScout !== true || proof?.reportsSourceHealth !== true || proof?.exportsToPj02Shape !== true || proof?.maxConcurrency !== 1) {
  failedChecks.push({
    name: "playwright-source-scout-contract",
    passed: false,
    detail: "Playwright scout, source health, PJ02 export, and max concurrency 1 must be true"
  });
}

if (proof?.sendsApplications !== false || proof?.sendsEmail !== false || proof?.sendsWhatsApp !== false || proof?.contactsEmployers !== false) {
  failedChecks.push({
    name: "no-send-no-contact-boundary",
    passed: false,
    detail: "PJ19 must not send/apply/contact employers"
  });
}

if (proof?.bypassesLoginOrCaptcha !== false) {
  failedChecks.push({
    name: "no-login-captcha-bypass",
    passed: false,
    detail: "PJ19 must not bypass login or CAPTCHA"
  });
}

if (proof?.productionReady !== false || proof?.deployedToOracle !== false || proof?.startsDocker !== false) {
  failedChecks.push({
    name: "no-production-or-oracle-claim",
    passed: false,
    detail: "production/oracle/docker claims must stay false"
  });
}

const passed = failedChecks.length === 0;

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-19 - Playwright Source Queue / Employer Career Page Scout / SA Source Health Report",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: expectedFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "PJ19 requires Playwright and Chromium browser install for live scouting.",
    "PJ19 is a scout only and must never submit applications or contact employers.",
    "Some portals may be blocked by login, CAPTCHA, timeout, or terms; those must become manual review, not bypass.",
    "Local scout results and health reports are private and ignored by Git."
  ],
  oracle_lite_impact: "low_local_browser_scout_only_max_concurrency_1",
  route: "/personal-job-desk/source-scout",
  api_route: "/api/personal-jobs/source-scout/run",
  proof: "reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json",
  next_action: passed
    ? "Commit PJ19 tracked files, install Playwright if missing, then test /personal-job-desk/source-scout."
    : "Repair PJ19 before moving forward."
};

fs.mkdirSync(path.dirname(validationReport), { recursive: true });
fs.writeFileSync(validationReport, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;