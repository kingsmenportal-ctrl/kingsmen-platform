const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const client = fs.readFileSync(path.resolve(__dirname, "../src/app/personal-job-desk/apply-now/ApplyNowClient.tsx"), "utf8");

test("manual export requires a workspace-owned opportunity and is review-only", () => {
  assert.match(route, /action === "prepareManualExport"/);
  assert.match(route, /store\.opportunities\.find\(\(item\) => item\.opportunityId === opportunityId\)/);
  assert.match(route, /status: "PREPARED_FOR_CANDIDATE_REVIEW"/);
  assert.match(route, /candidateMustConfirmEveryItem: true/);
  assert.match(route, /applicationSubmitted: false/);
  assert.match(route, /automaticSending: false/);
});

test("manual export checklist distinguishes document records from verified authenticity", () => {
  assert.match(route, /CANONICAL_REGISTRY_RECORD_PRESENT/);
  assert.match(route, /LOCAL_OR_UNVERIFIED_RECORD/);
  assert.match(route, /authenticityVerified: false/);
  assert.match(route, /documentAuthenticityVerified: false/);
  assert.match(route, /employerRequirementsVerified: false/);
});

test("manual export inventory excludes private storage paths and internal canonical references", () => {
  assert.match(route, /storageLocationIncluded: false/);
  assert.doesNotMatch(route.slice(route.indexOf('if (action === "prepareManualExport")'), route.indexOf('if (action === "generatePack")')), /storagePath:|canonicalDocumentRef:|evidenceRef:/);
});

test("application queue offers the checklist and warns candidate nothing is submitted", () => {
  assert.match(client, /Export checklist/);
  assert.match(client, /prepareManualExport/);
  assert.match(client, /Nothing has been submitted or sent/);
  assert.match(client, /Copy checklist/);
});
