import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-access-guide-validation-report.json");
const checks = [];
function add(name, passed, detail = "") { checks.push({ name, passed: Boolean(passed), detail: String(detail) }); }
function file(p) { return fs.existsSync(path.join(root, p)); }
add("oracle11-report", file("reports/oracle/oracle-ssh-bootstrap-guide-report.json"), "required previous report");
add("guide-json", file("kingsmen/oracle/vm-bootstrap/security/oracle-ssh-bootstrap-guide.json"), "required generated guide");
add("guide-md", file("docs/oracle/oracle-ssh-bootstrap-guide.md"), "required generated guide doc");
add("oracle10-report", file("reports/oracle/oracle-vm-bootstrap-plan-validation-report.json"), "required previous validator report");
const failed = checks.filter((check) => !check.passed);
const report = {
  module: "ORACLE",
  submodule: "ORACLE.12",
  validator: "validate-oracle-ssh-bootstrap-guide.mjs",
  productionReady: false,
  generatedAt: new Date().toISOString(),
  passed: failed.length === 0,
  totalChecks: checks.length,
  failedChecks: failed.length,
  warningChecks: 0,
  failed,
  checks,
  nextTrackerRow: failed.length === 0 ? "ORACLE.13 - scripts/oracle/Prepare-OracleFirstLoginChecklist.ps1" : "ORACLE.12 repair - fix access-guide validation failures"
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
