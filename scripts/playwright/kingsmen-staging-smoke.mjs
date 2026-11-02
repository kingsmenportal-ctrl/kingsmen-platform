#!/usr/bin/env node
import { chromium } from "playwright";

const fail = (code, message) => {
  console.error(JSON.stringify({ schema: "kingsmen.playwright-smoke.v1", status: code, message }));
  process.exit(2);
};
const base = process.env.KINGSMEN_STAGING_BASE_URL;
if (!base) fail("BLOCKED_CONFIGURATION_MISSING", "Set KINGSMEN_STAGING_BASE_URL.");
let origin;
try { origin = new URL(base); } catch { fail("BLOCKED_INVALID_BASE_URL", "Staging base URL is invalid."); }
if (origin.username || origin.password || (origin.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(origin.hostname))) {
  fail("BLOCKED_UNSAFE_BASE_URL", "Use HTTPS without embedded credentials (localhost is allowed for local tests).");
}
if (origin.pathname !== "/" || origin.search || origin.hash) fail("BLOCKED_BASE_URL_MUST_BE_ORIGIN", "Set origin only; configure routes separately.");
const parsePaths = (name, fallback) => {
  let values;
  try { values = process.env[name] ? JSON.parse(process.env[name]) : fallback; }
  catch { fail("BLOCKED_INVALID_PATH_CONFIGURATION", name + " must be a JSON array."); }
  if (!Array.isArray(values) || values.some((v) =>
    typeof v !== "string" ||
    !v.startsWith("/") ||
    v.startsWith("//") ||
    v.includes("\\") ||
    v.includes("?") ||
    v.includes("#") ||
    [...v].some((character) => character.charCodeAt(0) < 32) ||
    v.split("/").some((part) => part === "." || part === "..")
  )) {
    fail("BLOCKED_INVALID_PATH_CONFIGURATION", name + " must be an array of normalized absolute paths without query strings or fragments.");
  }
  for (const value of values) {
    const target = new URL(value, origin);
    if (
      target.origin !== origin.origin ||
      target.username ||
      target.password ||
      target.search ||
      target.hash ||
      target.pathname !== value
    ) {
      fail("BLOCKED_CROSS_ORIGIN_PATH", "Every path must be a normalized same-origin pathname without query strings or fragments.");
    }
  }
  return [...new Set(values)];
};
const paths = parsePaths("KINGSMEN_SMOKE_PATHS", ["/"]);
const protectedPaths = process.env.KINGSMEN_SMOKE_PROTECTED_PATHS ? parsePaths("KINGSMEN_SMOKE_PROTECTED_PATHS", []) : [];
if (!paths.length) fail("BLOCKED_EMPTY_PATHS", "At least one smoke path is required.");
const timeoutMs = Number(process.env.KINGSMEN_SMOKE_TIMEOUT_MS || 15000);
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 30000) fail("BLOCKED_INVALID_TIMEOUT", "Timeout must be 1000–30000 ms.");
const results = [];
const safePath = (value) => new URL(value, origin).pathname;
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, reducedMotion: "reduce" });
  // The smoke worker only reads the configured origin. This also blocks external
  // redirects, third-party trackers, mutation methods and off-origin resources.
  await context.route("**/*", async (route) => {
    let target;
    try { target = new URL(route.request().url()); }
    catch { await route.abort("blockedbyclient"); return; }
    if (target.origin !== origin.origin || !["GET", "HEAD"].includes(route.request().method())) {
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  for (const path of paths) {
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);
    let pageErrors = 0;
    page.on("pageerror", () => { pageErrors += 1; });
    try {
      const response = await page.goto(new URL(path, origin).href, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      const finalUrl = new URL(page.url());
      const httpStatus = response?.status() ?? 0;
      const sameOrigin = finalUrl.origin === origin.origin;
      const titlePresent = Boolean((await page.title()).trim());
      const navigationLinkCount = await page.locator("a[href]").count();
      const formCount = await page.locator("form").count();
      const unlabeledControlCount = await page.locator("input:not([type=hidden]),select,textarea,button").evaluateAll((nodes) =>
        nodes.filter((node) => {
          const el = node;
          if (el.tagName === "BUTTON" && (el.innerText || "").trim()) return false;
          if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
          if (el.labels && el.labels.length) return false;
          return true;
        }).length
      );
      const desktopHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      results.push({ id: "route:" + safePath(path), status: sameOrigin && httpStatus >= 200 && httpStatus < 400 && titlePresent ? "PASS" : "FAIL", httpStatus, sameOrigin, titlePresent, navigationLinkCount, formCount, unlabeledControlCount, desktopHorizontalOverflow, pageErrorCount: pageErrors });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);
      const mobileHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      results.push({ id: "responsive:" + safePath(path), status: mobileHorizontalOverflow ? "FAIL" : "PASS", mobileHorizontalOverflow });
      if (unlabeledControlCount) results.push({ id: "accessibility:" + safePath(path), status: "FAIL", unlabeledControlCount });
      if (desktopHorizontalOverflow || pageErrors || !sameOrigin) results.push({ id: "runtime-layout:" + safePath(path), status: "FAIL", desktopHorizontalOverflow, pageErrorCount: pageErrors, sameOrigin });
    } catch (error) {
      results.push({ id: "route:" + safePath(path), status: "FAIL", failureCode: error instanceof Error ? error.name : "UNKNOWN" });
    } finally { await page.close(); }
  }
  // Anonymous auth-boundary probe only; no credentials or mutations.
  for (const path of protectedPaths) {
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);
    try {
      const response = await page.goto(new URL(path, origin).href, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      const httpStatus = response?.status() ?? 0;
      const finalUrl = new URL(page.url());
      const expectedPath = new URL(path, origin).pathname;
      const landedPath = finalUrl.pathname;
      const blocked = finalUrl.origin === origin.origin && ([401, 403, 404].includes(httpStatus) || landedPath !== expectedPath);
      results.push({ id: "anonymous-boundary:" + safePath(path), status: blocked ? "PASS" : "FAIL", httpStatus, redirected: landedPath !== expectedPath, sameOrigin: finalUrl.origin === origin.origin });
    } catch (error) {
      results.push({ id: "anonymous-boundary:" + safePath(path), status: "FAIL", failureCode: error instanceof Error ? error.name : "UNKNOWN" });
    } finally { await page.close(); }
  }
  await context.close();
} finally { await browser.close(); }
const failures = results.filter((item) => item.status === "FAIL");
console.log(JSON.stringify({ schema: "kingsmen.playwright-smoke.v1", status: failures.length ? "STAGING_SMOKE_FAILED" : "STAGING_SMOKE_PASSED", origin: origin.origin, checkedAt: new Date().toISOString(), testCount: results.length, passed: results.length - failures.length, failed: failures.length, results }, null, 2));
if (failures.length) process.exitCode = 1;
