import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "apps/web/src/app/personal-job-desk/PersonalJobDeskShell.tsx",
  "apps/web/src/app/personal-job-desk/page.tsx"
];

const checks = files.map((file) => ({
  name: `exists:${file}`,
  passed: fs.existsSync(path.join(root, file)),
  detail: file
}));

const shell = fs.readFileSync(path.join(root, files[0]), "utf8");
const home = fs.readFileSync(path.join(root, files[1]), "utf8");

checks.push(
  {
    name: "uses_professional_dashboard_language",
    passed: home.includes("Find. Prepare. Apply. Track.") && home.includes("Application status"),
    detail: "Dashboard uses product language instead of build-report language"
  },
  {
    name: "has_search_first_experience",
    passed: home.includes("Search role, company") && home.includes("Find opportunities"),
    detail: "Dashboard has search-first job platform structure"
  },
  {
    name: "has_profile_document_application_sections",
    passed: home.includes("Your application profile") && home.includes("DOCUMENT READINESS") && home.includes("Pipeline"),
    detail: "Dashboard includes real job-platform sections"
  },
  {
    name: "removes_internal_missing-controls_language",
    passed: !home.includes("What was missing") && !home.includes("Platform controls"),
    detail: "No internal build explanation on user home"
  },
  {
    name: "shell_has_clean_navigation",
    passed: shell.includes("Dashboard") && shell.includes("Apply") && shell.includes("Scout") && shell.includes("Documents"),
    detail: "Shell has clean professional navigation"
  }
);

const failed = checks.filter((x) => !x.passed);

const report = {
  schema: "kingsmen.personal-jobs-37-professional-workbench.validation.v1",
  status: failed.length ? "FAILED" : "VALIDATED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length
    ? "Repair failed checks."
    : "Open /personal-job-desk and review professional workbench."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/validation/personal-jobs-37-professional-workbench-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);