#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const publicRoutes = ["/", "/free-destiny-map", "/kingsmen"];
const protectedRoutes = [
  "/candidate/dashboard",
  "/candidate/documents",
  "/candidate/workbench",
  "/candidate/finance",
  "/candidate/messages",
  "/candidate/saved-opportunities",
  "/founder/control-plane",
  "/founder/proof-centre",
  "/admin"
];

function fail(code) {
  console.error(JSON.stringify({ schema: "kingsmen.playwright-qa.v1", status: code }));
  process.exit(2);
}

const baseValue = process.env.KINGSMEN_QA_BASE_URL;
if (!baseValue) fail("BLOCKED_KINGSMEN_QA_BASE_URL_REQUIRED");
let base;
try { base = new URL(baseValue); } catch { fail("BLOCKED_INVALID_BASE_URL"); }
if (base.username || base.password || (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname))) {
  fail("BLOCKED_UNSAFE_BASE_URL");
}
const baseOrigin = base.origin;
const outputPath = resolve(process.env.KINGSMEN_QA_REPORT || "reports/playwright/qa-latest.json");

let chromium;
try { ({ chromium } = await import("playwright")); } catch { fail("BLOCKED_PLAYWRIGHT_NOT_INSTALLED"); }

const report = {
  schema: "kingsmen.playwright-qa.v1",
  status: "RUNNING",
  startedAt: new Date().toISOString(),
  baseOrigin,
  browser: "chromium",
  mode: "anonymous_read_only",
  networkMethods: ["GET"],
  candidateSessionsUsed: false,
  founderSessionsUsed: false,
  mutationRequestsMade: false,
  screenshotsCaptured: false,
  tracesCaptured: false,
  routes: [],
  failures: []
};

const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
try {
  const viewports = [
    { name: "desktop", width: 1365, height: 900 },
    { name: "mobile", width: 390, height: 844 }
  ];
  const cases = [
    ...publicRoutes.flatMap((route) => viewports.map((viewport) => ({ route, viewport, public: true }))),
    ...protectedRoutes.map((route) => ({ route, viewport: viewports[0], public: false }))
  ];

  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: { width: testCase.viewport.width, height: testCase.viewport.height },
      serviceWorkers: "block",
      acceptDownloads: false
    });
    const page = await context.newPage();
    let pageErrorCount = 0;
    let consoleErrorCount = 0;
    let blockedExternalRequestCount = 0;
    page.on("pageerror", () => { pageErrorCount += 1; });
    page.on("console", (message) => { if (message.type() === "error") consoleErrorCount += 1; });
    await page.route("**/*", async (route) => {
      let target;
      try { target = new URL(route.request().url()); } catch { await route.abort(); return; }
      if (target.origin !== baseOrigin || route.request().method() !== "GET") {
        blockedExternalRequestCount += 1;
        await route.abort();
        return;
      }
      await route.continue();
    });

    const started = Date.now();
    let response = null;
    let navigationFailure = null;
    try {
      response = await page.goto(new URL(testCase.route, baseOrigin).href, {
        waitUntil: "domcontentloaded",
        timeout: 35_000
      });
    } catch (error) {
      navigationFailure = error instanceof Error ? error.name : "UNKNOWN";
    }

    const status = response?.status() ?? null;
    let finalOrigin = null;
    try { finalOrigin = new URL(page.url()).origin; } catch {}
    let horizontalOverflowPx = null;
    try {
      horizontalOverflowPx = await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth,
        document.body?.scrollWidth ?? 0
      ) - window.innerWidth);
    } catch {}

    const item = {
      route: testCase.route,
      viewport: testCase.viewport.name,
      status,
      durationMs: Date.now() - started,
      finalOrigin,
      sameOrigin: finalOrigin === baseOrigin,
      navigationFailure,
      pageErrorCount,
      consoleErrorCount,
      blockedExternalRequestCount,
      horizontalOverflowPx
    };
    report.routes.push(item);

    if (!item.sameOrigin) report.failures.push({ route: item.route, viewport: item.viewport, code: "CROSS_ORIGIN_NAVIGATION" });
    if (status === null) report.failures.push({ route: item.route, viewport: item.viewport, code: "NAVIGATION_NO_RESPONSE" });
    if (status === 404) report.failures.push({ route: item.route, viewport: item.viewport, code: "ROUTE_NOT_FOUND" });
    if (status !== null && status >= 500) report.failures.push({ route: item.route, viewport: item.viewport, code: "SERVER_ERROR" });
    if (testCase.public && pageErrorCount > 0) report.failures.push({ route: item.route, viewport: item.viewport, code: "UNCAUGHT_BROWSER_ERROR" });
    if (testCase.public && item.viewport.name === "mobile" && horizontalOverflowPx > 2) {
      report.failures.push({ route: item.route, viewport: item.viewport, code: "MOBILE_HORIZONTAL_OVERFLOW" });
    }
    await context.close().catch(() => {});
  }
} finally {
  await browser.close().catch(() => {});
}

report.completedAt = new Date().toISOString();
report.failureCount = report.failures.length;
report.passed = report.failureCount === 0;
report.status = report.passed ? "PLAYWRIGHT_QA_PASSED" : "PLAYWRIGHT_QA_FAILED";
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
console.log(JSON.stringify({
  schema: report.schema,
  status: report.status,
  routeCases: report.routes.length,
  failureCount: report.failureCount,
  reportPath: outputPath
}, null, 2));
if (!report.passed) process.exitCode = 1;
