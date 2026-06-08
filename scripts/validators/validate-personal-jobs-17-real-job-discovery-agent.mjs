import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const proofScript = path.join(root, "scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs");
const proofReport = path.join(root, "reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json");
const validationReport = path.join(root, "reports/validation/personal-jobs-17-real-job-discovery-agent-latest.json");

const expectedFiles = [
  ".gitignore",
  "data/personal-job-desk/job-search-sources.local.example.json",
  "scripts/agents/personal-job-discovery-agent.mjs",
  "scripts/agents/playwright-job-source-scout.mjs",
  "apps/web/src/app/api/personal-jobs/job-finder/run/route.ts",
  "apps/web/src/app/personal-job-desk/job-finder/page.tsx",
  "apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx",
  "packages/contracts/src/personal-jobs-17-real-job-discovery-agent.ts",
  "docs/personal-jobs/personal-jobs-17-real-job-discovery-agent.md",
  "manifests/personal-jobs/personal-jobs-17-real-job-discovery-agent.json",
  "scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs",
  "scripts/validators/validate-personal-jobs-17-real-job-discovery-agent.mjs"
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

if (proof?.searchesRealSources !== true || proof?.manualJobEntryRequired !== false || proof?.exportsToPj02Shape !== true) {
  failedChecks.push({
    name: "real-job-finder-contract",
    passed: false,
    detail: "real search, no manual requirement, and PJ02 export must be true"
  });
}

if (proof?.sendsApplications !== false || proof?.sendsEmail !== false || proof?.sendsWhatsApp !== false || proof?.contactsEmployers !== false) {
  failedChecks.push({
    name: "no-send-no-contact-boundary",
    passed: false,
    detail: "PJ17 must not send/apply/contact employers"
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
  module: "PERSONAL-JOBS-17 - Real Job Discovery Agent / One-Profile Job Finder / Playwright Source Scout",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: expectedFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "PJ17 finds and scores leads from real source adapters, but it does not submit applications.",
    "Source availability depends on public source uptime and local internet access.",
    "Playwright scout is optional and must only be used on authorised careers pages.",
    "Human approval remains required before applying or contacting an employer."
  ],
  oracle_lite_impact: "low_local_agent_run_only",
  route: "/personal-job-desk/job-finder",
  api_route: "/api/personal-jobs/job-finder/run",
  proof: "reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json",
  next_action: passed
    ? "Commit PJ17 tracked files only, then run local dev server and test /personal-job-desk/job-finder."
    : "Repair PJ17 before moving forward."
};

fs.mkdirSync(path.dirname(validationReport), { recursive: true });
fs.writeFileSync(validationReport, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;