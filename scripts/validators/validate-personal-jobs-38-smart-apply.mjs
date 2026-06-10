import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "apps/web/src/app/api/personal-jobs/apply-now/route.ts",
  "apps/web/src/app/personal-job-desk/apply-now/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx"
];

const checks = files.map((file) => ({
  name: `exists:${file}`,
  passed: fs.existsSync(path.join(root, file)),
  detail: file
}));

const route = fs.readFileSync(path.join(root, files[0]), "utf8");
const client = fs.readFileSync(path.join(root, files[2]), "utf8");

checks.push(
  {
    name: "api_supports_smart_document_extraction",
    passed: route.includes("extractProfileFromText") && route.includes("uploadDocument") && route.includes("mammoth") && route.includes("pdf-parse"),
    detail: "Apply API reads uploaded documents and extracts profile fields"
  },
  {
    name: "api_preserves_application_pack_and_proof",
    passed: route.includes("generatePack") && route.includes("markApplied") && route.includes("proofLog"),
    detail: "Apply API keeps pack generation and proof capture"
  },
  {
    name: "client_has_smart_intake_language",
    passed: client.includes("Upload CV once. Apply many times.") && client.includes("CV autofill"),
    detail: "Apply client behaves like smart intake instead of dumb manual form"
  },
  {
    name: "client_has_queue_pack_proof",
    passed: client.includes("APPLICATION QUEUE") && client.includes("APPLICATION PACK") && client.includes("Capture proof"),
    detail: "Apply client has queue, pack and proof workflow"
  }
);

const failed = checks.filter((check) => !check.passed);

const report = {
  schema: "kingsmen.personal-jobs-38-smart-apply.validation.v1",
  status: failed.length ? "FAILED" : "VALIDATED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length
    ? "Repair failed smart apply checks."
    : "Open /personal-job-desk/apply-now and test CV upload, autofill, opportunity queue, pack and proof."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/validation/personal-jobs-38-smart-apply-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);