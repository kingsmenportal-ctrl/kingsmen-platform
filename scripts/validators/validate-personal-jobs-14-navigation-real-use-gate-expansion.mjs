import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const proofScript = "scripts/proof/prove-personal-jobs-14-navigation-real-use-gate-expansion.mjs";
const proofPath = "reports/personal-jobs/personal-jobs-14-navigation-real-use-gate-expansion-proof.json";
const validationPath = "reports/validation/personal-jobs-14-navigation-real-use-gate-expansion-latest.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8").replace(/^\uFEFF/, ""));
}

if (!exists(proofScript)) {
  throw new Error("Missing PJ14 proof script.");
}

const proofRun = spawnSync(process.execPath, [absolute(proofScript)], {
  cwd: root,
  encoding: "utf8"
});

if (proofRun.stdout) process.stdout.write(proofRun.stdout);
if (proofRun.stderr) process.stderr.write(proofRun.stderr);

const proof = exists(proofPath) ? readJson(proofPath) : null;
const passed = proofRun.status === 0 && proof && proof.passed === true;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-14 - Personal Job Desk Navigation / Real Use Gate Expansion",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: 8,
  missing_files: proof
    ? proof.checks
        .filter((check) => check.name.startsWith("expected-file:") && check.passed !== true)
        .map((check) => check.detail)
    : ["proof report missing"],
  failed_checks: proof ? proof.failed : ["proof did not run"],
  warnings: [
    "This is local UI navigation only.",
    "This does not prove production readiness.",
    "This does not deploy to Oracle.",
    "This does not send messages, contact employers, scrape websites, or touch payments."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/navigation",
  expanded_route: "/personal-job-desk/real-use-gate",
  proof: proofPath,
  next_action: passed
    ? "Commit PERSONAL-JOBS-14 tracked files only."
    : "Repair PERSONAL-JOBS-14 before moving forward."
};

fs.mkdirSync(path.dirname(absolute(validationPath)), { recursive: true });
fs.writeFileSync(absolute(validationPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);