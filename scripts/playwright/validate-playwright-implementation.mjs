import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "scripts/playwright/provider-scout-policy.mjs",
  "scripts/playwright/run-kingsmen-browser-qa.mjs",
  "scripts/playwright/test-provider-scout-policy.mjs",
  "apps/workers/src/provider-source-scout.mjs",
  "apps/workers/Dockerfile.playwright-scout",
  "data/providers/playwright-source-scout.example.json",
  ".github/workflows/kingsmen-playwright-qa.yml",
  "docs/playwright/KINGSMEN_PLAYWRIGHT_OPERATING_MODEL.md"
];
const missing = required.filter((file) => !existsSync(file));
assert.deepEqual(missing, [], `Missing Playwright implementation files: ${missing.join(", ")}`);

const scout = readFileSync("apps/workers/src/provider-source-scout.mjs", "utf8");
const policy = readFileSync("scripts/playwright/provider-scout-policy.mjs", "utf8");
const workflow = readFileSync(".github/workflows/kingsmen-playwright-qa.yml", "utf8");
const dockerfile = readFileSync("apps/workers/Dockerfile.playwright-scout", "utf8");

for (const marker of [
  "validateProviderScoutPlan",
  "public_read_only",
  "BLOCKED_UNAPPROVED_REDIRECT",
  "formsInteractedWith: false",
  "applicationsSubmitted: false",
  "paymentsAttempted: false",
  "catalogueOpenStatusAssigned: false"
]) assert.ok(scout.includes(marker), `Provider scout is missing policy marker: ${marker}`);

for (const marker of [
  "FOUNDER_APPROVAL_REQUIRED",
  "CONCURRENCY_MUST_EQUAL_ONE",
  "SOURCE_HOST_NOT_ALLOWLISTED",
  "SOURCE_URL_CONTAINS_SENSITIVE_QUERY",
  "BLOCKED_BY_CAPTCHA"
]) assert.ok(policy.includes(marker), `Policy is missing fail-closed marker: ${marker}`);

assert.ok(workflow.includes("playwright:qa"), "CI must execute browser QA.");
assert.ok(workflow.includes("playwright:policy:test"), "CI must execute policy regression tests.");
assert.ok(workflow.includes("playwright:policy:validate"), "CI must execute the implementation validator.");
assert.ok(dockerfile.includes("mcr.microsoft.com/playwright:v1.60.0-noble"), "Scout image must pin its Playwright browser image.");
assert.ok(!scout.includes("KINGSMEN_DATABASE_URL"), "Scout must not obtain a database credential.");
assert.ok(!scout.includes("KINGSMEN_E2E_CANDIDATE_A_TOKEN"), "Scout must not use candidate sessions.");

console.log(JSON.stringify({
  schema: "kingsmen.playwright-implementation-validation.v1",
  status: "PASSED",
  filesChecked: required.length,
  providerScoutIsPublicReadOnly: true,
  providerSubmissionEnabled: false,
  productionSecretsRequired: false
}, null, 2));
