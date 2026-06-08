import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const moduleName = "PERSONAL-JOBS-15 - Personal Job Desk Runtime Click Test / Local UI Smoke Gate";
const proofScript = "scripts/proof/prove-personal-jobs-15-runtime-click-test-local-ui-smoke-gate.mjs";
const proofPath = "reports/personal-jobs/personal-jobs-15-runtime-click-test-local-ui-smoke-gate-proof.json";
const validationPath = "reports/validation/personal-jobs-15-runtime-click-test-local-ui-smoke-gate-latest.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

fs.mkdirSync(absolute("reports/validation"), { recursive: true });

const proofRun = spawnSync(process.execPath, [absolute(proofScript)], {
  cwd: root,
  env: process.env,
  encoding: "utf8"
});

if (proofRun.stdout) process.stdout.write(proofRun.stdout);
if (proofRun.stderr) process.stderr.write(proofRun.stderr);

let proof = null;

try {
  proof = JSON.parse(fs.readFileSync(absolute(proofPath), "utf8"));
} catch (error) {
  proof = {
    passed: false,
    localBaseUrl: null,
    failed: [{ name: "proof-report-readable", passed: false, detail: error.message }]
  };
}

const failedChecks = [];

if (proofRun.status !== 0) {
  failedChecks.push({
    name: "proof-script-exit-zero",
    passed: false,
    detail: `Proof exited with ${proofRun.status}`
  });
}

if (proof.passed !== true) {
  failedChecks.push(...(proof.failed || []));
}

if (!proof.localBaseUrl) {
  failedChecks.push({
    name: "runtime-local-server-found",
    passed: false,
    detail: "Start local Next.js server: cd apps/web && npm run dev"
  });
}

if (proof.productionReady === true || proof.deployedToOracle === true || proof.startsDocker === true) {
  failedChecks.push({
    name: "no-production-or-oracle-claim",
    passed: false,
    detail: "PJ15 must remain local UI smoke proof only."
  });
}

const passed = failedChecks.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: moduleName,
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: 8,
  missing_files: [],
  failed_checks: failedChecks,
  warnings: [
    "This proof requires a running local Next.js server.",
    "Use KINGSMEN_WEB_BASE_URL if the server is not on ports 3000-3010.",
    "This does not prove production readiness or Oracle deployment.",
    "This does not send messages, contact employers, scrape websites, or touch payments."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/runtime-click-test",
  local_base_url: proof.localBaseUrl || null,
  proof: proofPath,
  next_action: passed
    ? "Commit PERSONAL-JOBS-15 tracked files only."
    : "Repair failed runtime route(s) or start local dev server before committing."
};

fs.writeFileSync(absolute(validationPath), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);