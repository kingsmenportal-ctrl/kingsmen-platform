#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/creator-normalize-latest.json");

const requiredFiles = [
  "scripts/KINGSMEN_CREATOR.ps1",
  "scripts/testing/Test-KingsmenCreator.ps1",
  "scripts/validators/validate-creator-normalize.mjs",
  "reports/creator/test-kingsmen-creator-report.json",
  "reports/validation/creator-normalize-latest.json"
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const failures = [];
const checked = [];

for (const file of requiredFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty required file: ${file}`);
}

if (exists("scripts/KINGSMEN_CREATOR.ps1")) {
  const creator = read("scripts/KINGSMEN_CREATOR.ps1");

  for (const token of ["$Phase", "Invoke-Doctor", "Invoke-AuditExisting", "Invoke-Report", "productionReady"]) {
    if (!creator.includes(token)) failures.push(`Creator missing required phase token: ${token}`);
  }

  const forbidden = [
    [/productionReady\s*[:=]\s*true/i, "productionReady true"],
    [/service[_-]?role[_-]?key\s*[:=]/i, "raw service role key assignment"],
    [/sk-[A-Za-z0-9_-]{16,}/, "possible API key literal"]
  ];

  for (const [pattern, label] of forbidden) {
    if (pattern.test(creator)) failures.push(`Creator contains forbidden pattern: ${label}`);
  }
}

if (exists("reports/creator/test-kingsmen-creator-report.json")) {
  try {
    const testReport = JSON.parse(read("reports/creator/test-kingsmen-creator-report.json"));
    if (testReport.passed !== true) failures.push("Test-KingsmenCreator report did not pass.");
  } catch (err) {
    failures.push(`Could not parse test-kingsmen-creator-report.json: ${err.message}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 02 — Creator Normalize",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings: [
    "BATCH 02 currently validates CREATOR.1 phase stability and test harness proof. Action mode remains the next repair unless separately patched and proven."
  ],
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Build Proof Centre later reads Creator normalize status.",
  next_action: passed ? "Proceed to CREATOR.2 action-layer patch or next approved Kingsmen batch." : "Repair Creator normalize failures and rerun test plus validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
