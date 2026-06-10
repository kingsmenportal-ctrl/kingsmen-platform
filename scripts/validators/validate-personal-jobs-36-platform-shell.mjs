import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "apps/web/src/app/personal-job-desk/layout.tsx",
  "apps/web/src/app/personal-job-desk/PersonalJobDeskShell.tsx",
  "apps/web/src/app/personal-job-desk/page.tsx"
];

const checks = files.map((file) => ({
  name: `exists:${file}`,
  passed: fs.existsSync(path.join(root, file)),
  detail: file
}));

const shell = fs.readFileSync(path.join(root, "apps/web/src/app/personal-job-desk/PersonalJobDeskShell.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "apps/web/src/app/personal-job-desk/page.tsx"), "utf8");

checks.push(
  {
    name: "has_back_button",
    passed: shell.includes("← Back") && shell.includes("router.back"),
    detail: "Platform shell includes real back action"
  },
  {
    name: "has_home_button",
    passed: shell.includes("⌂ Home") && shell.includes("/personal-job-desk"),
    detail: "Platform shell includes home navigation"
  },
  {
    name: "has_menu_drawer",
    passed: shell.includes("☰ Menu") && shell.includes("Kingsmen Menu"),
    detail: "Platform shell includes menu drawer"
  },
  {
    name: "has_module_links",
    passed: shell.includes("/personal-job-desk/apply-now") && shell.includes("/personal-job-desk/opportunity-scout") && shell.includes("/personal-job-desk/document-pack-index"),
    detail: "Shell links to Apply, Scout and Document Pack"
  },
  {
    name: "home_has_workflow",
    passed: home.includes("Upload CV/documents") && home.includes("Capture proof"),
    detail: "Home explains the connected user workflow"
  }
);

const failed = checks.filter((check) => !check.passed);

const report = {
  schema: "kingsmen.personal-jobs-36-platform-shell.validation.v1",
  status: failed.length ? "FAILED" : "VALIDATED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length
    ? "Repair failed platform shell checks."
    : "Open /personal-job-desk and use the persistent menu/back/home controls."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/validation/personal-jobs-36-platform-shell-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);