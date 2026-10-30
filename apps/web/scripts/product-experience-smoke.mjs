import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");
const port = Number(process.env.KINGSMEN_EXPERIENCE_PORT || 4179);
const baseUrl = process.env.KINGSMEN_EXPERIENCE_BASE_URL || "http://127.0.0.1:" + port;
const outputDir = path.join(webRoot, "test-results", "product-experience");
const externalServer = Boolean(process.env.KINGSMEN_EXPERIENCE_BASE_URL);
const routes = [
  { route: "/", label: "public-home" },
  { route: "/pricing", label: "packages" },
  { route: "/candidate/dashboard", label: "candidate-dashboard" },
  { route: "/candidate/mobile", label: "candidate-mobile" },
  { route: "/founder/control-plane", label: "founder-control-plane" },
  { route: "/reviewer/identity-reviews", label: "reviewer-identity-queue" }
];
const widths = [320, 360, 390, 768, 1024, 1440];
const failures = [];
const results = [];
let server;

async function waitForServer() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("NEXT_SERVER_DID_NOT_BECOME_READY");
}

async function startServer() {
  if (externalServer) return;
  const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
  server = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: webRoot,
    env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout.on("data", chunk => process.stdout.write(chunk));
  server.stderr.on("data", chunk => process.stderr.write(chunk));
  server.on("error", error => failures.push("NEXT_SERVER_START: " + error.message));
  await waitForServer();
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const item of routes) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      const response = await page.goto(new URL(item.route, baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
      if (!response || response.status() !== 200) failures.push(item.route + ": expected HTTP 200; got " + (response ? response.status() : "no response"));
      if (await page.locator("html").getAttribute("lang") !== "en-ZA") failures.push(item.route + ": expected lang=en-ZA");
      if (await page.locator("h1").count() !== 1) failures.push(item.route + ": expected exactly one primary h1");
      if (await page.locator(".km-skip-link").count() !== 1) failures.push(item.route + ": skip navigation link is missing");
      if (await page.locator("header.km-site-header").count() !== 1) failures.push(item.route + ": shared Kingsmen header is missing or duplicated");
      if (await page.locator("nav[aria-label]").count() < 1) failures.push(item.route + ": a labelled navigation landmark is missing");

      const unlabeledControls = await page.locator("input,select,textarea").evaluateAll(elements => elements.filter(element => {
        const aria = element.getAttribute("aria-label");
        const labelledBy = element.getAttribute("aria-labelledby");
        const id = element.id;
        const labelFor = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
        const wrappingLabel = element.closest("label");
        return !((aria && aria.trim()) || (labelledBy && document.getElementById(labelledBy)) || labelFor || wrappingLabel);
      }).length);
      if (unlabeledControls > 0) failures.push(item.route + ": " + unlabeledControls + " form control(s) have no programmatic label");

      const unnamedControls = await page.locator("a,button").evaluateAll(elements => elements.filter(element => {
        const text = (element.innerText || "").trim();
        const aria = (element.getAttribute("aria-label") || "").trim();
        const title = (element.getAttribute("title") || "").trim();
        return !(text || aria || title);
      }).length);
      if (unnamedControls > 0) failures.push(item.route + ": " + unnamedControls + " link/button(s) have no accessible name");

      const unlabeledImages = await page.locator("img").evaluateAll(elements => elements.filter(element => !element.hasAttribute("alt")).length);
      if (unlabeledImages > 0) failures.push(item.route + ": " + unlabeledImages + " image(s) have no alt attribute");

      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(80);
        const geometry = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          desktopNav: getComputedStyle(document.querySelector(".km-site-nav")).display,
          mobileMenu: getComputedStyle(document.querySelector(".km-site-menu")).display
        }));
        if (geometry.document > geometry.viewport + 1) failures.push(item.route + ": horizontal overflow at " + width + "px (" + geometry.document + "px)");
        if (width <= 860 && (geometry.desktopNav !== "none" || geometry.mobileMenu === "none")) failures.push(item.route + ": mobile navigation breakpoint failed at " + width + "px");
        if (width > 860 && (geometry.desktopNav === "none" || geometry.mobileMenu !== "none")) failures.push(item.route + ": desktop navigation breakpoint failed at " + width + "px");
      }

      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(outputDir, item.label + "-mobile.png"), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 960 });
      await page.screenshot({ path: path.join(outputDir, item.label + "-desktop.png"), fullPage: true });
      if (pageErrors.length) failures.push(item.route + ": browser errors: " + pageErrors.slice(0, 3).join(" | "));
      results.push({
        route: item.route,
        status: response ? response.status() : null,
        viewportWidths: widths,
        controlsChecked: await page.locator("input,select,textarea").count(),
        pageErrors: pageErrors.length
      });
      await page.close();
    }

    const keyboardPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await keyboardPage.goto(new URL("/", baseUrl).toString(), { waitUntil: "domcontentloaded" });
    await keyboardPage.keyboard.press("Tab");
    const focusedClass = await keyboardPage.evaluate(() => String(document.activeElement && document.activeElement.className));
    if (!focusedClass.includes("km-skip-link")) failures.push("Keyboard: first Tab does not focus the skip-navigation link.");
    await keyboardPage.locator(".km-site-menu summary").focus();
    await keyboardPage.keyboard.press("Enter");
    const menuOpen = await keyboardPage.locator(".km-site-menu").evaluate(element => element.open);
    if (!menuOpen) failures.push("Keyboard: mobile navigation cannot be opened with Enter.");
    await keyboardPage.emulateMedia({ reducedMotion: "reduce" });
    const scrollBehavior = await keyboardPage.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    if (scrollBehavior !== "auto") failures.push("Reduced motion: document scroll behaviour is not reduced.");
    await keyboardPage.screenshot({ path: path.join(outputDir, "mobile-navigation-keyboard.png") });
    await keyboardPage.close();
  } finally {
    await browser.close();
    if (server) {
      server.kill("SIGTERM");
      await new Promise(resolve => setTimeout(resolve, 500));
      if (server.exitCode === null) server.kill("SIGKILL");
    }
  }

  const report = {
    schema: "kingsmen.product-experience-smoke.v1",
    status: failures.length ? "FAILED" : "PASSED",
    passed: failures.length === 0,
    baseUrl,
    routes: results,
    viewportWidths: widths,
    screenshotDirectory: "apps/web/test-results/product-experience",
    limitations: [
      "Screenshots are CI review artifacts; pixel-diff comparison still requires an approved reference baseline.",
      "This browser suite does not replace screen-reader and manual assistive-technology testing.",
      "Authenticated candidate/reviewer mutations are not run by this public surface smoke suite; reviewer UI access is a backend-grant-gated route."
    ],
    failures
  };
  await writeFile(path.join(outputDir, "product-experience-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(JSON.stringify({ schema: "kingsmen.product-experience-smoke.v1", status: "FAILED", message: error instanceof Error ? error.message : "unknown failure" }));
  process.exitCode = 1;
});
