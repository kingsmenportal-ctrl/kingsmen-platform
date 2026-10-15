import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/apply-now-latest.json");

const files = [
  "apps/web/src/app/personal-job-desk/apply-now/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx",
  "apps/web/src/app/api/personal-jobs/apply-now/route.ts"
];

const checks = files.map((file) => ({
  name: `file:${file}`,
  passed: fs.existsSync(path.join(root, file)),
  detail: file
}));

const api = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const client = fs.readFileSync(path.join(root, "apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx"), "utf8");

checks.push({
  name: "has_upload_document_action",
  passed: api.includes('action === "uploadDocument"'),
  detail: "Upload document action must exist."
});

checks.push({
  name: "enforces_upload_size_limit",
  passed: api.includes("MAX_UPLOAD_BYTES = 10 * 1024 * 1024") && api.includes("buffer.length > MAX_UPLOAD_BYTES"),
  detail: "Uploads must enforce the 10 MB byte limit."
});

checks.push({
  name: "validates_document_signatures",
  passed: api.includes("function validateDocumentSignature") &&
    api.includes('toString("ascii") !== "%PDF-"') &&
    api.includes("validateDocumentSignature(fileName, decoded.mimeType, decoded.buffer)"),
  detail: "PDF and DOCX content signatures must be checked before storage."
});

checks.push({
  name: "rejects_malformed_base64",
  passed: api.includes("Upload contains malformed base64 data.") &&
    api.includes('buffer.toString("base64").replace(/=+$/, "")'),
  detail: "Non-canonical base64 input must be rejected."
});

checks.push({
  name: "has_add_opportunity_action",
  passed: api.includes('action === "addOpportunity"'),
  detail: "Opportunity action must exist."
});

checks.push({
  name: "has_generate_pack_action",
  passed: api.includes('action === "generatePack"'),
  detail: "Pack generation action must exist."
});

checks.push({
  name: "has_mark_applied_proof_action",
  passed: api.includes('action === "markApplied"'),
  detail: "Proof capture action must exist."
});

checks.push({
  name: "has_real_source_links",
  passed: client.includes("https://sayouth.mobi/") && client.includes("https://essa.labour.gov.za/EssaOnline/WebBeans/") && client.includes("https://www.nyda.gov.za/"),
  detail: "Real source links must exist."
});

checks.push({
  name: "no_fake_submission_claim",
  passed: !client.toLowerCase().includes("auto submit"),
  detail: "Interface must not claim unsafe auto-submit."
});

const failed = checks.filter((x) => !x.passed);

const report = {
  schema: "kingsmen.today.apply-now.validation.v1",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  route: "/personal-job-desk/apply-now",
  checks,
  failed,
  nextAction: failed.length === 0 ? "Run npm/dev server and open /personal-job-desk/apply-now." : "Repair failed checks."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exit(1);