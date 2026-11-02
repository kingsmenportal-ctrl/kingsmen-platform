#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { validateProviderScoutPlan, detectProviderPageBlocker, isSensitiveUrl } from "../../../scripts/playwright/provider-scout-policy.mjs";

const fail = (code, exit = 2) => {
  console.error(JSON.stringify({ schema: "kingsmen.provider-scout-run.v1", status: code }));
  process.exit(exit);
};

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function redactPublicText(value, maximum) {
  return String(value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, "[redacted-number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function classifyNavigationFailure(error) {
  const message = error instanceof Error ? error.name : "UNKNOWN";
  if (/timeout/i.test(message)) return "TIMEOUT";
  if (/net::ERR_ABORTED|navigation/i.test(message)) return "NAVIGATION_BLOCKED";
  return "SOURCE_UNAVAILABLE";
}

async function main() {
  const planPath = arg("--plan") || process.env.KINGSMEN_PROVIDER_SCOUT_PLAN;
  const outputPath = arg("--out") || process.env.KINGSMEN_PROVIDER_SCOUT_REPORT || "reports/playwright/provider-scout-latest.json";
  const dryRun = process.argv.includes("--dry-run");
  if (!planPath) fail("BLOCKED_PLAN_PATH_REQUIRED");

  let plan;
  try { plan = JSON.parse(readFileSync(resolve(planPath), "utf8")); }
  catch { fail("BLOCKED_PLAN_UNREADABLE"); }

  const validation = validateProviderScoutPlan(plan);
  if (!validation.valid) {
    console.error(JSON.stringify({ schema: "kingsmen.provider-scout-run.v1", status: "BLOCKED_INVALID_PLAN", errors: validation.errors }));
    process.exit(2);
  }

  const planSha256 = createHash("sha256").update(JSON.stringify(plan)).digest("hex");
  if (dryRun) {
    console.log(JSON.stringify({
      schema: "kingsmen.provider-scout-run.v1",
      status: "PLAN_VALIDATED_DRY_RUN",
      sourceCount: validation.sourceCount,
      planSha256,
      networkRequestsMade: 0,
      browserStarted: false
    }, null, 2));
    return;
  }

  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch { fail("BLOCKED_PLAYWRIGHT_NOT_INSTALLED"); }

  const startedAt = new Date().toISOString();
  const results = [];
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  try {
    for (const source of plan.sources) {
      const allowedHosts = new Set(source.allowedHosts.map((host) => host.toLowerCase()));
      const result = {
        sourceId: source.id,
        providerId: source.providerId,
        pathway: source.pathway,
        sourceUrl: source.officialSourceUrl,
        retrievedAt: new Date().toISOString(),
        httpStatus: null,
        finalUrl: null,
        pageTitle: null,
        metaDescription: null,
        headings: [],
        sameProviderLinks: [],
        status: "NOT_ASSESSED",
        blocker: null,
        requestFailureCount: 0,
        dialogCount: 0
      };

      const context = await browser.newContext({
        acceptDownloads: false,
        serviceWorkers: "block",
        ignoreHTTPSErrors: false
      });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(25_000);
      page.setDefaultTimeout(5_000);

      await page.route("**/*", async (route) => {
        let requestUrl;
        try { requestUrl = new URL(route.request().url()); }
        catch { await route.abort(); return; }
        const resourceType = route.request().resourceType();
        if (
          requestUrl.protocol !== "https:" ||
          route.request().method() !== "GET" ||
          !allowedHosts.has(requestUrl.hostname.toLowerCase()) ||
          isSensitiveUrl(requestUrl.href) ||
          ["image", "media", "font"].includes(resourceType)
        ) {
          await route.abort();
          return;
        }
        await route.continue();
      });
      page.on("requestfailed", () => { result.requestFailureCount += 1; });
      page.on("dialog", async (dialog) => {
        result.dialogCount += 1;
        await dialog.dismiss().catch(() => {});
      });
      page.on("popup", async (popup) => { await popup.close().catch(() => {}); });

      try {
        const response = await page.goto(source.officialSourceUrl, { waitUntil: "domcontentloaded", timeout: 25_000 });
        result.httpStatus = response?.status() ?? null;
        const final = new URL(page.url());
        if (final.protocol !== "https:" || !allowedHosts.has(final.hostname.toLowerCase()) || isSensitiveUrl(final.href)) {
          result.status = "BLOCKED_UNAPPROVED_REDIRECT";
        } else {
          result.finalUrl = final.origin + final.pathname;
          const title = await page.title().catch(() => "");
          const description = await page.locator('meta[name="description"]').getAttribute("content").catch(() => "");
          const headings = await page.locator("h1, h2").allTextContents().catch(() => []);
          const bodyText = await page.locator("body").innerText({ timeout: 4_000 }).catch(() => "");
          result.pageTitle = redactPublicText(title, 200);
          result.metaDescription = redactPublicText(description, 320);
          result.headings = headings.slice(0, 8).map((item) => redactPublicText(item, 120)).filter(Boolean);
          result.blocker = detectProviderPageBlocker({ title, bodyText, url: final.href });

          const links = await page.locator("a[href]").evaluateAll((anchors) =>
            anchors.slice(0, 200).map((anchor) => ({
              text: (anchor.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
              href: anchor.href
            }))
          ).catch(() => []);
          result.sameProviderLinks = links
            .filter((item) => /apply|application|admission|programme|program|career|vacanc|learnership|internship|opportunit|recruit|register/i.test(item.text))
            .filter((item) => {
              try {
                const link = new URL(item.href);
                return link.protocol === "https:" && allowedHosts.has(link.hostname.toLowerCase()) && !isSensitiveUrl(link.href);
              } catch { return false; }
            })
            .slice(0, 15)
            .map((item) => ({ text: redactPublicText(item.text, 100), url: new URL(item.href).origin + new URL(item.href).pathname }));

          if (result.blocker) result.status = result.blocker;
          else if (result.httpStatus === null || result.httpStatus >= 500 || result.httpStatus === 0) result.status = "SOURCE_UNAVAILABLE";
          else if (result.httpStatus >= 400) result.status = "HTTP_ERROR_REQUIRES_REVIEW";
          else if (result.dialogCount > 0) result.status = "DIALOG_REQUIRES_REVIEW";
          else result.status = "INSPECTED_PUBLIC_SOURCE";
        }
      } catch (error) {
        result.status = classifyNavigationFailure(error);
      } finally {
        await context.close().catch(() => {});
      }
      results.push(result);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const exceptions = results.filter((item) => item.status !== "INSPECTED_PUBLIC_SOURCE").length;
  const report = {
    schema: "kingsmen.provider-scout-run.v1",
    status: exceptions ? "SCOUT_COMPLETED_WITH_EXCEPTIONS" : "SCOUT_COMPLETED",
    startedAt,
    completedAt: new Date().toISOString(),
    planSha256,
    sourceCount: results.length,
    inspectedPublicSources: results.filter((item) => item.status === "INSPECTED_PUBLIC_SOURCE").length,
    exceptions,
    concurrency: 1,
    browser: "chromium",
    readOnly: true,
    networkMethodsAllowed: ["GET"],
    logBodies: false,
    screenshotsCaptured: false,
    tracesCaptured: false,
    loginAttempted: false,
    credentialsUsed: false,
    formsInteractedWith: false,
    documentsUploaded: false,
    applicationsSubmitted: false,
    paymentsAttempted: false,
    catalogueOpenStatusAssigned: false,
    providerIntegrationClaim: false,
    results
  };

  const output = resolve(outputPath);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  console.log(JSON.stringify({
    schema: report.schema,
    status: report.status,
    sourceCount: report.sourceCount,
    inspectedPublicSources: report.inspectedPublicSources,
    exceptions: report.exceptions,
    reportPath: output,
    planSha256
  }, null, 2));
  if (exceptions) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({
    schema: "kingsmen.provider-scout-run.v1",
    status: "SCOUT_FATAL",
    errorCode: error instanceof Error ? error.name : "UNKNOWN"
  }));
  process.exitCode = 1;
});
