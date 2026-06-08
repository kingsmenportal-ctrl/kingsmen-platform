import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const proofScript = path.join(root, "scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs");
const proofReport = path.join(root, "reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json");
const validationReport = path.join(root, "reports/validation/personal-jobs-18-sa-source-expansion-latest.json");

const expectedFiles = [
  ".gitignore",
  "data/personal-job-desk/sa-job-sources.local.example.json",
  "scripts/agents/personal-job-sa-source-runner.mjs",
  "apps/web/src/app/api/personal-jobs/sa-sources/run/route.ts",
  "apps/web/src/app/personal-job-desk/sa-sources/page.tsx",
  "apps/web/src/app/personal-job-desk/sa-sources/SaSourcesClient.tsx",
  "packages/contracts/src/personal-jobs-18-sa-source-expansion.ts",
  "docs/personal-jobs/personal-jobs-18-sa-source-expansion.md",
  "manifests/personal-jobs/personal-jobs-18-sa-source-expansion.json",
  "scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs",
  "scripts/validators/validate-personal-jobs-18-sa-source-expansion.mjs"
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

if (proof?.countryFocus !== "South Africa" || proof?.searchesRealSources !== true || proof?.manualJobEntryRequired !== false || proof?.exportsToPj02Shape !== true) {
  failedChecks.push({
    name: "sa-source-expansion-contract",
    passed: false,
    detail: "SA focus, real sources, no manual job requirement, and PJ02 export must be true"
  });
}

if (proof?.sendsApplications !== false || proof?.sendsEmail !== false || proof?.sendsWhatsApp !== false || proof?.contactsEmployers !== false) {
  failedChecks.push({
    name: "no-send-no-contact-boundary",
    passed: false,
    detail: "PJ18 must not send/apply/contact employers"
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
  module: "PERSONAL-JOBS-18 - South African Job Source Expansion / Real Local Lead Adapters",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: expectedFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "PJ18 expands South African local source discovery, but it does not submit applications.",
    "Some public careers pages may be JavaScript-rendered and may require Playwright/manual review.",
    "Source URLs in sa-job-sources.local.json must be kept editable because employer portals change.",
    "Human approval remains required before applying or contacting an employer."
  ],
  oracle_lite_impact: "low_local_agent_run_only",
  route: "/personal-job-desk/sa-sources",
  api_route: "/api/personal-jobs/sa-sources/run",
  proof: "reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json",
  next_action: passed
    ? "Commit PJ18 tracked files only, then run local dev server and test /personal-job-desk/sa-sources."
    : "Repair PJ18 before moving forward."
};

fs.mkdirSync(path.dirname(validationReport), { recursive: true });
fs.writeFileSync(validationReport, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;