const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const client = fs.readFileSync(path.resolve(__dirname, "../src/app/personal-job-desk/apply-now/ApplyNowClient.tsx"), "utf8");

test("uploading a document records extracted values as untrusted suggestions without mutating profile", () => {
  const upload = route.slice(route.indexOf('if (action === "uploadDocument")'), route.indexOf('if (action === "addOpportunity")'));
  assert.match(upload, /status: text\.includes\("extraction failed"\) \? "PARTIAL" : "NEEDS_CANDIDATE_CONFIRMATION"/);
  assert.match(upload, /reviewNotice: "Extracted values are suggestions until the candidate confirms them\."/);
  assert.doesNotMatch(upload, /store\.profile\s*=\s*mergeSmartProfile/);
});

test("confirmation accepts only values from a workspace extraction and validates field limits", () => {
  assert.match(route, /action === "confirmSmartExtraction"/);
  assert.match(route, /store\.smartExtraction\.find\(\(item\) => item && item\.extractionId === extractionId\)/);
  assert.match(route, /Only values present in this extraction can be confirmed/);
  assert.match(route, /validateProfilePatch\(requestedFields\)/);
  assert.match(route, /overwriteExisting === true/);
});

test("confirmation protects existing values by default and records confirmed fields", () => {
  const start = route.indexOf('if (action === "confirmSmartExtraction")');
  const end = route.indexOf('if (action === "uploadDocument")', start);
  const action = route.slice(start, end);
  assert.match(action, /if \(current && !overwriteExisting\)/);
  assert.match(action, /skippedExisting\.push\(key\)/);
  assert.match(action, /extraction\.confirmedFields/);
  assert.match(action, /EXTRACTION_FIELDS_CONFIRMED/);
});

test("candidate UI labels extracted values as suggestions and requires an explicit per-field confirmation", () => {
  assert.match(client, /Review CV suggestions/);
  assert.match(client, /Confirm value/);
  assert.match(client, /Allow replacing existing values/);
  assert.match(client, /confirmExtractedField/);
  assert.match(client, /CV parsing produces suggestions only/);
});
