#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runner = path.join(root, "scripts/playwright/kingsmen-staging-smoke.mjs");
let postCount = 0;
let foreignRedirectRequests = 0;
const server = createServer((req, res) => {
  if (req.method === "POST") postCount += 1;
  if (req.url === "/escape") {
    res.statusCode = 302;
    res.setHeader("location", "https://example.com/external");
    res.end();
    return;
  }
  if (req.url === "/private") {
    res.statusCode = 302;
    res.setHeader("location", "/login?next=/private");
    res.end();
    return;
  }
  if (req.url === "/pricing") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<!doctype html><html><head><title>Kingsmen Pricing</title><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><main><h1>Pricing</h1><a href='/'>Home</a></main></body></html>");
    return;
  }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end("<!doctype html><html><head><title>Kingsmen Fixture</title><meta name='viewport' content='width=device-width, initial-scale=1'><style>body{max-width:100%;margin:0 auto;padding:1rem}input{max-width:100%}</style></head><body><main><h1>Kingsmen</h1><nav><a href='/pricing'>Pricing</a></nav><form><label for='email'>Email</label><input id='email' name='email' type='email'><button type='submit'>Continue</button></form></main></body></html>");
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const run = async (paths, protectedPaths, extraEnv = {}) => {
  const child = spawn(process.execPath, [runner], {
    cwd: root,
    env: {
      ...process.env,
      KINGSMEN_STAGING_BASE_URL: "http://127.0.0.1:" + address.port,
      KINGSMEN_SMOKE_PATHS: JSON.stringify(paths),
      KINGSMEN_SMOKE_PROTECTED_PATHS: JSON.stringify(protectedPaths),
      KINGSMEN_SMOKE_TIMEOUT_MS: "5000",
      ...extraEnv
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const [code] = await once(child, "close");
  return { code, stdout, stderr };
};
try {
  const good = await run(["/", "/pricing"], ["/private"]);
  assert.equal(good.code, 0, "Playwright local smoke failed: " + good.stderr + "\\n" + good.stdout);
  const report = JSON.parse(good.stdout);
  assert.equal(report.status, "STAGING_SMOKE_PASSED");
  assert.equal(report.failed, 0);
  assert.ok(report.results.some((item) => item.id === "route:/" && item.formCount === 1 && item.unlabeledControlCount === 0));
  assert.ok(report.results.some((item) => item.id === "anonymous-boundary:/private" && item.status === "PASS"));
  assert.equal(postCount, 0, "smoke checks must never submit forms");
  assert.ok(!good.stdout.includes("next=/private"), "report must not contain query strings");

  const beforeInvalidPath = postCount;
  const invalidPath = await run(["/pricing?token=must-not-be-sent"], []);
  assert.equal(invalidPath.code, 2, "query-bearing smoke paths must fail preflight");
  assert.ok(invalidPath.stderr.includes("BLOCKED_INVALID_PATH_CONFIGURATION"));
  assert.equal(postCount, beforeInvalidPath, "invalid route configuration must fail before any network request");

  const beforeEscape = postCount;
  const externalRedirect = await run(["/escape"], []);
  assert.equal(externalRedirect.code, 1, "off-origin redirect must fail the smoke run");
  assert.equal(postCount, beforeEscape, "off-origin redirect probe must not submit forms");

  console.log(JSON.stringify({
    schema: "kingsmen.playwright-smoke-test.v1",
    status: "PASSED",
    assertions: 11,
    scenarios: ["desktop/mobile read-only route smoke", "anonymous protected route", "form not submitted", "query-bearing path rejected before network", "off-origin redirect blocked"]
  }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
}
