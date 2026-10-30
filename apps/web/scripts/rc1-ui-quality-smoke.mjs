import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const baseUrl = (process.env.KINGSMEN_UI_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const outputDir = process.env.KINGSMEN_UI_ARTIFACT_DIR || path.resolve("../../artifacts/ui-rc1");
const baselineDir = process.env.KINGSMEN_UI_BASELINE_DIR
  ? path.resolve(process.env.KINGSMEN_UI_BASELINE_DIR)
  : null;
const routes = [
  "/",
  "/free-destiny-map/",
  "/packages",
  "/candidate/login",
  "/candidate/dashboard",
  "/candidate/profile",
  "/candidate/identity-review",
  "/candidate/workbench",
  "/candidate/opportunity-matches",
  "/candidate/applications",
  "/candidate/documents",
  "/candidate/cao-choices",
  "/candidate/finance",
  "/reviewer/identity-reviews",
  "/founder/control-plane",
  "/control-plane"
];
const viewports = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1440x1000", width: 1440, height: 1000 }
];
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  baselineMode: baselineDir ? "comparison-requested" : "capture-only-baselines-not-approved",
  routes: routes.length,
  viewports: viewports.length,
  screenshots: [],
  checks: [],
  failures: [],
  warnings: []
};
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  for (const viewport of viewports) {
    for (const route of routes) {
      const page = await context.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      let responseStatus = null;
      try {
        const response = await page.goto(baseUrl + route, { waitUntil: "domcontentloaded", timeout: 30000 });
        responseStatus = response?.status() ?? null;
        await page.locator("body").waitFor({ state: "visible", timeout: 10000 });
        await page.evaluate(() => document.fonts?.ready);
        await page.waitForTimeout(250);

        const snapshot = await page.evaluate(() => {
          const visible = (el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
          };
          const interactive = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=link]")]
            .filter(visible);
          const accessibleNameOf = (el) => {
            const normalise = (value) => (value || "").replace(/\\s+/g, " ").trim();
            const ariaLabel = normalise(el.getAttribute("aria-label"));
            if (ariaLabel) return ariaLabel;

            const labelledBy = normalise(el.getAttribute("aria-labelledby"));
            if (labelledBy) {
              const referencedText = labelledBy.split(" ")
                .map(id => document.getElementById(id))
                .filter(Boolean)
                .map(node => normalise(node.innerText || node.textContent))
                .filter(Boolean)
                .join(" ");
              if (referencedText) return referencedText;
            }

            // HTML label association includes both <label for="id"> and an
            // input/select/textarea/button wrapped by a <label>. Do not report
            // those correctly labelled controls as inaccessible.
            const associatedLabels = el.labels
              ? Array.from(el.labels).map(label => normalise(label.innerText || label.textContent)).filter(Boolean).join(" ")
              : "";
            if (associatedLabels) return associatedLabels;

            const title = normalise(el.getAttribute("title"));
            if (title) return title;
            const alt = normalise(el.getAttribute("alt"));
            if (alt) return alt;
            const ownText = normalise(el.innerText || el.textContent);
            if (ownText) return ownText;

            if (el instanceof HTMLInputElement && ["submit", "button", "reset"].includes(el.type)) {
              return normalise(el.value);
            }
            return "";
          };
          const unlabeled = interactive.filter(el => !accessibleNameOf(el))
            .map(el => ({ tag: el.tagName.toLowerCase(), type: el.getAttribute("type"), id: el.id, name: el.getAttribute("name") }));
          const imagesWithoutAlt = [...document.images].filter(img => !img.hasAttribute("alt")).map(img => img.src);
          return {
            title: document.title,
            lang: document.documentElement.lang,
            bodyTextLength: (document.body.innerText || "").trim().length,
            hasMain: Boolean(document.querySelector("main")),
            h1Count: document.querySelectorAll("h1").length,
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            unlabeled,
            imagesWithoutAlt
          };
        });

        const label = `${route} @ ${viewport.name}`;
        const check = { label, responseStatus, ...snapshot, pageErrors };
        report.checks.push(check);
        if (responseStatus === null || responseStatus >= 500) report.failures.push(`${label}: server response ${responseStatus}`);
        if (responseStatus === 404) report.failures.push(`${label}: route not found`);
        if (snapshot.viewportWidth !== viewport.width) report.failures.push(`${label}: viewport mismatch; requested ${viewport.width}px but browser reports ${snapshot.viewportWidth}px`);
        if (!snapshot.bodyTextLength) report.failures.push(`${label}: blank page`);
        if (snapshot.lang !== "en-ZA") report.failures.push(`${label}: expected html lang=en-ZA, got ${snapshot.lang || "(missing)"}`);
        if (!snapshot.hasMain) report.failures.push(`${label}: missing main landmark`);
        if (snapshot.documentWidth > snapshot.viewportWidth + 1) report.failures.push(`${label}: horizontal overflow ${snapshot.documentWidth}px > ${snapshot.viewportWidth}px`);
        if (snapshot.unlabeled.length) report.failures.push(`${label}: ${snapshot.unlabeled.length} interactive controls without an accessible name`);
        if (snapshot.imagesWithoutAlt.length) report.failures.push(`${label}: ${snapshot.imagesWithoutAlt.length} images missing alt attributes`);
        if (pageErrors.length) report.failures.push(`${label}: browser runtime errors: ${pageErrors.join("; ")}`);
        if (snapshot.h1Count !== 1) report.warnings.push(`${label}: expected one h1, found ${snapshot.h1Count}`);

        const screenshotPath = path.join(outputDir, `${route.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") || "home"}--${viewport.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
        report.screenshots.push({ route, viewport: viewport.name, path: screenshotPath, baseline: baselineDir ? path.join(baselineDir, path.basename(screenshotPath)) : null });
      } catch (error) {
        report.failures.push(`${route} @ ${viewport.name}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        await page.close();
      }
    }
  }
  await context.close();
} finally {
  await browser.close();
}

if (baselineDir) {
  report.warnings.push("Baseline comparison is requested, but this harness intentionally does not auto-approve or overwrite golden screenshots. Wire a reviewed pixel-diff baseline implementation after the reference captures are reviewed.");
}
fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  routes: report.routes,
  viewports: report.viewports,
  checks: report.checks.length,
  screenshots: report.screenshots.length,
  failures: report.failures,
  warnings: report.warnings,
  reportPath: path.join(outputDir, "report.json")
}, null, 2));
if (report.failures.length) process.exitCode = 1;
