import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientPath = path.join(root, "apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx");
const reportPath = path.join(root, "reports/validation/apply-now-v2-latest.json");

const client = fs.readFileSync(clientPath, "utf8");

const checks = [
  ["has_command_centre_title", client.includes("Apply Command Centre")],
  ["has_route_cards", client.includes("Learnerships") && client.includes("Internships") && client.includes("Funding")],
  ["has_source_hunter", client.includes("REAL SOURCE HUNTER")],
  ["has_document_vault", client.includes("DOCUMENT VAULT")],
  ["has_application_queue", client.includes("APPLICATION QUEUE")],
  ["has_application_pack", client.includes("APPLICATION PACK")],
  ["has_real_sources", client.includes("https://sayouth.mobi/") && client.includes("https://essa.labour.gov.za/EssaOnline/WebBeans/") && client.includes("https://www.nyda.gov.za/")],
  ["does_not_claim_auto_submit", !client.toLowerCase().includes("auto-submit everywhere")]
].map(([name, passed]) => ({ name, passed: Boolean(passed), detail: String(name) }));

const failed = checks.filter((x) => !x.passed);

const report = {
  schema: "kingsmen.apply-now-v2.validation.v1",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  route: "/personal-job-desk/apply-now",
  checks,
  failed,
  nextAction: failed.length === 0 ? "Refresh browser on /personal-job-desk/apply-now." : "Repair failed checks."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exit(1);