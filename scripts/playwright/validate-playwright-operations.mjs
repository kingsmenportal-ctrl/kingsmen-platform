import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { validateAdapterRegistry } from "../../apps/workers/src/providers/provider-adapter-policy.mjs";

const required = [
  "db/migrations/202611020001_n16_playwright_scout_worker_scope.sql",
  "apps/workers/src/providers/provider-adapter-policy.mjs",
  "apps/workers/src/playwright-operations-worker.mjs",
  "apps/workers/Dockerfile.playwright-operations",
  "data/providers/playwright-operations-adapters.example.json",
  "scripts/staging/test-n16-playwright-scout-claim-contract.mjs",
  "scripts/playwright/test-operations-worker-policy.mjs"
];
const missing = required.filter((path) => !existsSync(path));
assert.deepEqual(missing, [], "Missing scoped Playwright operations files: " + missing.join(", "));

const migration = readFileSync(required[0], "utf8").toLowerCase();
const worker = readFileSync(required[2], "utf8");
const dockerfile = readFileSync(required[3], "utf8");
const registry = JSON.parse(readFileSync(required[4], "utf8"));
const workflow = readFileSync(".github/workflows/kingsmen-playwright-qa.yml", "utf8");

for (const marker of [
  "create role kingsmen_playwright_scout_worker nologin noinherit",
  "function public.n16_claim_playwright_scout_dispatches",
  "q.worker_code = 'playwright.public_source.scout'",
  "for update skip locked",
  "function public.n16_record_playwright_scout_result",
  "q.locked_by is distinct from p_worker_id",
  "'same'",
  "revoke all on table public.orchestrator_dispatch_queue",
  "from public, anon, authenticated, service_role",
  "to kingsmen_playwright_scout_worker"
]) assert.ok(migration.includes(marker), "Missing scoped-claim migration marker: " + marker);

for (const marker of [
  "KINGSMEN_PLAYWRIGHT_OPERATIONS_ENABLED",
  "KINGSMEN_PLAYWRIGHT_DATABASE_URL",
  "ROLE_NAME = \"kingsmen_playwright_scout_worker\"",
  'client.query("SET ROLE " + ROLE_NAME)',
  "n16_claim_playwright_scout_dispatches",
  "n16_record_playwright_scout_result",
  "newContext(",
  "request.method() !== \"GET\"",
  "serviceWorkers: \"block\"",
  "applicationsSubmitted: false",
  "paymentsAttempted: false",
  "providerDecisionClaimed: false"
]) assert.ok(worker.includes(marker), "Missing read-only worker marker: " + marker);

assert.ok(!worker.includes("n16_claim_dispatches("), "Operations worker must not use the unfiltered generic N16 claim.");
assert.ok(!worker.includes("n16_mark_dispatch_sent("), "Read-only scout worker must never cross SENT.");
assert.ok(!worker.includes("KINGSMEN_DATABASE_URL"), "Operations worker must use its dedicated restricted database login.");
assert.ok(dockerfile.includes("mcr.microsoft.com/playwright:v1.60.0-noble"), "Operations image must pin the browser runtime.");
assert.ok(dockerfile.includes("USER pwuser"), "Operations container must use an unprivileged user.");
assert.equal(registry.schema, "kingsmen.playwright-provider-adapter-registry.v1");
assert.deepEqual(registry.adapters, [], "No provider adapter may be enabled without provider-specific authorisation evidence.");
assert.equal(validateAdapterRegistry(registry).valid, true, "empty registry is a valid disabled state");
assert.ok(workflow.includes("playwright:operations:policy:test"), "CI must run operations adapter policy tests.");
assert.ok(workflow.includes("playwright:operations:policy:validate"), "CI must run operations implementation validation.");
assert.ok(workflow.includes("Dockerfile.playwright-operations"), "CI must build the isolated operations image.");

console.log(JSON.stringify({
  schema: "kingsmen.playwright-operations-implementation-validation.v1",
  status: "PASSED",
  filesChecked: required.length,
  scopedQueue: true,
  dedicatedCredentialBoundary: true,
  operationsEnabledByDefault: false,
  enabledProviderAdapters: registry.adapters.length,
  providerSubmissionsEnabled: false
}, null, 2));
