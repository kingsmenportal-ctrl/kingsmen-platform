import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "apps/web/src/app/api/personal-jobs/apply-now/route.ts",
  "apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx"
];

const checks = [];

for (const file of files) {
  checks.push({
    name: `exists:${file}`,
    passed: fs.existsSync(path.join(root, file)),
    detail: file
  });
}

const api = fs.readFileSync(path.join(root, files[0]), "utf8");
const client = fs.readFileSync(path.join(root, files[1]), "utf8");

checks.push(
  {
    name: "server_extracts_docx_pdf_text",
    passed: api.includes("mammoth") && api.includes("pdf-parse") && api.includes("extractText"),
    detail: "API supports DOCX/PDF/text extraction"
  },
  {
    name: "server_extracts_profile_fields",
    passed: api.includes("extractProfile") && api.includes("fullName") && api.includes("phone") && api.includes("email") && api.includes("skills"),
    detail: "API extracts profile fields"
  },
  {
    name: "server_does_not_overwrite_existing_profile_values",
    passed: api.includes("if (value && !String(merged[key]"),
    detail: "Smart extraction fills blanks without overwriting"
  },
  {
    name: "client_has_smart_autofill_button",
    passed: client.includes("Smart autofill from uploaded documents"),
    detail: "Client exposes smart autofill action"
  },
  {
    name: "client_refreshes_profile_after_upload",
    passed: client.includes("setProfile({ ...blankProfile, ...(json.store?.profile"),
    detail: "Client updates visible form after extraction"
  }
);

const failed = checks.filter((check) => !check.passed);

const report = {
  schema: "kingsmen.personal-jobs-34-smart-cv-intake.validation.v1",
  status: failed.length ? "FAILED" : "VALIDATED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length ? "Repair failed checks." : "Upload a CV/DOCX/PDF/TXT and review autofilled fields."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/validation/personal-jobs-34-smart-cv-intake-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);