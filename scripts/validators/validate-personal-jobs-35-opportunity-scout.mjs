import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "scripts/agents/personal-job-opportunity-scout.mjs",
  "apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts",
  "apps/web/src/app/personal-job-desk/opportunity-scout/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx"
];

const checks = files.map((file) => ({
  name: `exists:${file}`,
  passed: fs.existsSync(path.join(root, file)),
  detail: file
}));

const agent = fs.readFileSync(path.join(root, files[0]), "utf8");
const api = fs.readFileSync(path.join(root, files[1]), "utf8");
const ui = fs.readFileSync(path.join(root, files[3]), "utf8");

checks.push(
  {
    name: "uses_playwright",
    passed: agent.includes('import("playwright")') && agent.includes("chromium.launch"),
    detail: "Scout agent must use Playwright"
  },
  {
    name: "has_safe_boundaries",
    passed: agent.includes("bypassesOtp") && agent.includes("bypassesCaptcha") && agent.includes("autoApplies"),
    detail: "Scout must declare automation boundaries"
  },
  {
    name: "can_import_lead_to_apply_now",
    passed: api.includes('action === "importLead"') && api.includes("apply-now.local.json"),
    detail: "API imports lead into Apply Now store"
  },
  {
    name: "ui_has_run_scout",
    passed: ui.includes("Run connected scout") && ui.includes("Import to Apply Now"),
    detail: "UI can run scout and import leads"
  }
);

const failed = checks.filter((x) => !x.passed);

const report = {
  schema: "kingsmen.personal-jobs-35-opportunity-scout.validation.v1",
  status: failed.length ? "FAILED" : "VALIDATED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length
    ? "Repair failed checks."
    : "Open /personal-job-desk/opportunity-scout and run scout."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/validation/personal-jobs-35-opportunity-scout-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);