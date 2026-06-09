import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const proofScript = path.join(root, "scripts/proof/prove-personal-jobs-20-opportunity-command-queue.mjs");
const proofReport = path.join(root, "reports/personal-jobs/personal-jobs-20-opportunity-command-queue-proof.json");
const validationReport = path.join(root, "reports/validation/personal-jobs-20-opportunity-command-queue-latest.json");

const expectedFiles = [
  ".gitignore",
  "scripts/agents/personal-job-opportunity-command-queue.mjs",
  "apps/web/src/app/api/personal-jobs/opportunity-queue/build/route.ts",
  "apps/web/src/app/personal-job-desk/opportunity-queue/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx",
  "packages/contracts/src/personal-jobs-20-opportunity-command-queue.ts",
  "docs/personal-jobs/personal-jobs-20-opportunity-command-queue.md",
  "manifests/personal-jobs/personal-jobs-20-opportunity-command-queue.json",
  "scripts/proof/prove-personal-jobs-20-opportunity-command-queue.mjs",
  "scripts/validators/validate-personal-jobs-20-opportunity-command-queue.mjs"
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

if (proof?.combinesPj17Pj18Pj19Leads !== true || proof?.deduplicatesOpportunities !== true || proof?.classifiesApplyReadiness !== true) {
  failedChecks.push({
    name: "opportunity-command-queue-contract",
    passed: false,
    detail: "PJ20 must combine, dedupe, and classify apply readiness"
  });
}

if (proof?.sendsApplications !== false || proof?.sendsEmail !== false || proof?.sendsWhatsApp !== false || proof?.contactsEmployers !== false) {
  failedChecks.push({
    name: "no-send-no-contact-boundary",
    passed: false,
    detail: "PJ20 must not send/apply/contact employers"
  });
}

if (proof?.bypassesLoginOrCaptcha !== false) {
  failedChecks.push({
    name: "no-login-captcha-bypass",
    passed: false,
    detail: "PJ20 must not bypass login or CAPTCHA"
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
  module: "PERSONAL-JOBS-20 - Unified Opportunity Command Queue / Apply Readiness Selector",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: expectedFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "PJ20 selects opportunities for apply-pack preparation only.",
    "PJ20 does not submit applications or contact employers.",
    "Queue outputs are local/private and ignored by Git.",
    "Human approval remains required before any application action."
  ],
  oracle_lite_impact: "low_local_queue_build_only",
  route: "/personal-job-desk/opportunity-queue",
  api_route: "/api/personal-jobs/opportunity-queue/build",
  proof: "reports/personal-jobs/personal-jobs-20-opportunity-command-queue-proof.json",
  next_action: passed
    ? "Commit PJ20 tracked files, then test /personal-job-desk/opportunity-queue."
    : "Repair PJ20 before moving forward."
};

fs.mkdirSync(path.dirname(validationReport), { recursive: true });
fs.writeFileSync(validationReport, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;