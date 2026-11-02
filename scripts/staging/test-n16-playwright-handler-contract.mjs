#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const handler = await readFile(new URL("../../apps/api/src/orchestrator/playwright-readonly-handler.ts", import.meta.url), "utf8");
const runner = await readFile(new URL("../../apps/api/src/orchestrator/worker-runner.ts", import.meta.url), "utf8");
const checks = [
  ["worker handler is opt-in", runner, 'env.KINGSMEN_BROWSER_AUTOMATION_ENABLED === "true"'],
  ["only browser read-only scout is registered", runner, 'handlers.set("browser.readonly_scout"'],
  ["handler is read-only and non-side-effecting", handler, "sideEffect: false"],
  ["handler never requests human approval for read-only reads", handler, "requiresHumanApproval: false"],
  ["exact origin allowlist is required", handler, "KINGSMEN_BROWSER_ALLOWED_ORIGINS"],
  ["exact path allowlist is required", handler, "KINGSMEN_BROWSER_ALLOWED_PATHS"],
  ["HTTPS required except explicit test-mode loopback", handler, 'const secure = target.protocol === "https:"'],
  ["task accepts URL only", handler, 'keys[0] !== "url"'],
  ["only GET/HEAD network requests", handler, 'request.method() === "GET" || request.method() === "HEAD"'],
  ["all requests stay on origin", handler, "requestUrl.origin === target.origin"],
  ["navigation cannot escape approved paths", handler, "allowedPaths.has(requestUrl.pathname)"],
  ["downloads are disabled", handler, "acceptDownloads: false"],
  ["service workers are blocked", handler, 'serviceWorkers: "block"'],
  ["no screenshots or page text retained", handler, "contentCaptured: false"],
  ["no screenshot artifacts retained", handler, "screenshotsCaptured: false"],
  ["page title is hashed, not stored", handler, "titleSha256"],
  ["navigation timeout bounded", handler, "N16_BROWSER_TIMEOUT_INVALID"],
  ["unknown dispatch stays manual by default", runner, "WORKER_CODE_NOT_REGISTERED"]
];
for (const [label, source, token] of checks) {
  assert.ok(source.includes(token), "Missing: " + label + " (" + token + ")");
  console.log("PASS", label);
}
assert.ok(!handler.includes("storageState:"), "Browser handler must not import session state.");
assert.ok(!handler.includes("addCookies("), "Browser handler must not inject cookies.");
assert.ok(!handler.includes(".click("), "Browser handler must not click page controls.");
assert.ok(!handler.includes(".fill("), "Browser handler must not fill forms.");
assert.ok(!handler.includes(".screenshot("), "Browser handler must not capture screenshots.");
console.log(JSON.stringify({ schema: "kingsmen.validation-report.v1", module: "N16 Playwright read-only handler", passed: true, checks: checks.length + 5, runtimeExecuted: false }, null, 2));
