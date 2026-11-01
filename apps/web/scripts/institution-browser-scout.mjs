import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  validateScoutTarget,
  validateProbeRequest,
  safeEvidenceUrl,
  classifyPortal,
  proposeAccessibleLocator,
  healthFromStatus,
  handoffFromStatus,
  SCOUT_STATUSES
} from "../../../scripts/agents/institution-browser-scout-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const inputPath = path.resolve(root, arg("--targets", "manifests/institutions/browser-scout-targets.example.json"));
const outputPath = path.resolve(root, arg("--out", "artifacts/institution-browser-scout/latest.json"));
const targetFilter = arg("--target", null);
const browserName = arg("--browser", "chromium");
const profile = arg("--profile", "desktop");
const maxTargets = Math.min(12, Math.max(1, Number(arg("--limit", "8")) || 8));
const timeoutMs = Math.min(30000, Math.max(5000, Number(arg("--timeout", "15000")) || 15000));
if (!["chromium", "firefox", "webkit"].includes(browserName)) {
  process.stderr.write("Unsupported browser. Use chromium, firefox or webkit.\n");
  process.exit(2);
}
if (!["desktop", "mobile"].includes(profile)) {
  process.stderr.write("Unsupported profile. Use desktop or mobile.\n");
  process.exit(2);
}
if (profile === "mobile" && browserName === "firefox") {
  process.stderr.write("Mobile emulation is not supported for this Firefox profile.\n");
  process.exit(2);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}
function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
function safeId(value) {
  return String(value || "target").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80);
}
async function mapLimit(items, limit, callback) {
  const output = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await callback(items[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

async function inspectTarget(browser, target, runDir) {
  const validation = validateScoutTarget(target);
  if (!validation.valid) {
    return {
      institutionRef: target.id || "unknown",
      displayName: target.name || "Unnamed target",
      status: "TARGET_REJECTED",
      reasons: validation.problems,
      candidateFacingSafe: false,
      humanReviewRequired: true
    };
  }

  const context = await browser.newContext({
    acceptDownloads: false,
    serviceWorkers: "block",
    locale: "en-ZA",
    timezoneId: "Africa/Johannesburg",
    viewport: profile === "mobile" ? { width: 390, height: 844 } : { width: 1365, height: 900 },
    isMobile: profile === "mobile",
    hasTouch: profile === "mobile",
    deviceScaleFactor: profile === "mobile" ? 2 : 1
  });
  const blockedRequests = [];
  const requestMetadata = [];
  let blockedNonGet = 0;
  let blockedOrigins = 0;
  let responseStatus = null;
  let navigationFailure = null;
  let pageData = { title: "", headings: [], bodyText: "", forms: [] };
  let accessibilityHash = null;
  let screenshotRef = null;

  await context.route("**/*", async (route) => {
    const request = route.request();
    const safeUrl = safeEvidenceUrl(request.url());
    const permission = validateProbeRequest({
      url: request.url(),
      method: request.method(),
      approvedHosts: target.approvedHosts
    });
    const pathPart = safeUrl ? new URL(safeUrl).pathname.toLowerCase() : "";
    const sensitiveReadPath = /(^|\/)(logout|signout|delete|remove|submit|checkout|payment|pay|confirm|register|application-submit)(\/|$)/.test(pathPart);
    if (!permission.allowed || sensitiveReadPath) {
      if (permission.reason === "NON_GET_REQUEST_BLOCKED") blockedNonGet += 1;
      else blockedOrigins += 1;
      if (blockedRequests.length < 30) {
        blockedRequests.push({
          method: request.method(),
          url: safeUrl,
          reason: sensitiveReadPath ? "SENSITIVE_PATH_GET_BLOCKED" : permission.reason
        });
      }
      await route.abort("blockedbyclient").catch(() => {});
      return;
    }
    await route.continue();
  });

  const page = await context.newPage();
  const pageErrorTypes = [];
  page.on("pageerror", (error) => {
    if (pageErrorTypes.length < 12) pageErrorTypes.push(error?.name || "PAGE_ERROR");
  });
  page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
  page.on("popup", (popup) => popup.close().catch(() => {}));
  page.on("request", (request) => {
    if (requestMetadata.length < 40) {
      requestMetadata.push({
        event: "request",
        method: request.method(),
        resourceType: request.resourceType(),
        url: safeEvidenceUrl(request.url())
      });
    }
  });
  page.on("response", (response) => {
    if (requestMetadata.length < 40) {
      requestMetadata.push({
        event: "response",
        method: response.request().method(),
        status: response.status(),
        resourceType: response.request().resourceType(),
        url: safeEvidenceUrl(response.url())
      });
    }
  });

  const observedAt = new Date().toISOString();
  try {
    const response = await page.goto(validation.safeUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs
    });
    responseStatus = response ? response.status() : null;
    await page.locator("body").waitFor({ state: "visible", timeout: Math.min(timeoutMs, 8000) });
    await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
    pageData = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      };
      const labelOf = (element) => {
        const labels = element.labels
          ? Array.from(element.labels).map((label) => label.innerText || label.textContent || "")
          : [];
        return String(labels.join(" ") || element.getAttribute("aria-label") || "")
          .replace(/\s+/g, " ").trim().slice(0, 140);
      };
      const headings = Array.from(document.querySelectorAll("h1,h2,h3"))
        .filter(visible).slice(0, 24)
        .map((element) => String(element.innerText || element.textContent || "")
          .replace(/\s+/g, " ").trim().slice(0, 140));
      const forms = Array.from(document.querySelectorAll("form")).slice(0, 16).map((form) => {
        let actionPath = null;
        let externalAction = false;
        try {
          const parsed = new URL(form.action || location.href, location.href);
          externalAction = parsed.origin !== location.origin;
          if (!externalAction) actionPath = parsed.pathname;
        } catch {
          externalAction = true;
        }
        const fields = Array.from(form.querySelectorAll("input:not([type=hidden]),select,textarea"))
          .filter(visible).slice(0, 80).map((element) => ({
            tagName: element.tagName.toLowerCase(),
            inputType: String(element.getAttribute("type") || element.tagName.toLowerCase()).toLowerCase(),
            name: String(element.getAttribute("name") || "").slice(0, 100) || null,
            label: labelOf(element) || null,
            ariaLabel: String(element.getAttribute("aria-label") || "").slice(0, 140) || null,
            autoComplete: String(element.getAttribute("autocomplete") || "").slice(0, 80) || null,
            required: Boolean(element.required || element.getAttribute("aria-required") === "true"),
            multiple: Boolean(element.multiple),
            accept: String(element.getAttribute("accept") || "").slice(0, 120) || null,
            options: element.tagName.toLowerCase() === "select"
              ? Array.from(element.options).slice(0, 12).map((option) =>
                String(option.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100))
              : []
          }));
        return {
          method: String(form.getAttribute("method") || "GET").toUpperCase(),
          actionPath,
          externalAction,
          fields
        };
      });
      return {
        title: String(document.title || "").slice(0, 180),
        headings,
        bodyText: String(document.body?.innerText || "").slice(0, 40000),
        forms
      };
    });

    try {
      if (typeof page.locator("body").ariaSnapshot === "function") {
        accessibilityHash = hash(await page.locator("body").ariaSnapshot());
      }
    } catch {
      accessibilityHash = null;
    }

    const screenshotDir = path.join(runDir, "screenshots");
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotFile = path.join(screenshotDir, safeId(target.id) + "-" + profile + ".png");
    try {
      await page.addStyleTag({
        content: "input,textarea,select,option { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }"
      });
      await page.screenshot({
        path: screenshotFile,
        fullPage: true,
        animations: "disabled",
        timeout: 7000
      });
      screenshotRef = path.relative(root, screenshotFile).replace(/\\/g, "/");
    } catch {
      screenshotRef = null;
    }
  } catch (error) {
    navigationFailure = error?.name || "NAVIGATION_FAILED";
  }

  const finalUrl = safeEvidenceUrl(page.url());
  const fields = pageData.forms.flatMap((form) => form.fields.map((field) => ({
    ...field,
    formMethod: form.method,
    locatorProposal: proposeAccessibleLocator({
      label: field.label,
      ariaLabel: field.ariaLabel,
      tagName: field.tagName
    })
  })));
  const structure = {
    title: pageData.title,
    headings: pageData.headings,
    fields: fields.map((field) => ({
      fieldName: field.name,
      tagName: field.tagName,
      inputType: field.inputType,
      accessibleLabel: field.label || field.ariaLabel,
      required: field.required,
      multiple: field.multiple,
      acceptedFileTypes: field.accept ? field.accept.split(",").map((item) => item.trim()).filter(Boolean) : [],
      locatorProposal: field.locatorProposal
    })),
    forms: pageData.forms.map((form) => ({
      method: form.method,
      actionPath: form.actionPath,
      externalAction: form.externalAction,
      fields: form.fields.map((field) => ({
        tagName: field.tagName,
        inputType: field.inputType,
        name: field.name,
        label: field.label,
        required: field.required,
        multiple: field.multiple,
        accept: field.accept,
        options: field.options
      }))
    }))
  };
  const structureFingerprint = hash(JSON.stringify(structure));
  const structureChanged = Boolean(target.expectedStructureFingerprint) &&
    target.expectedStructureFingerprint !== structureFingerprint;
  let portalStatus = navigationFailure
    ? SCOUT_STATUSES.PROBE_FAILED
    : classifyPortal({
      httpStatus: responseStatus,
      url: finalUrl || validation.safeUrl,
      bodyText: pageData.bodyText,
      fields,
      structureChanged
    });
  if (blockedOrigins > 0 && portalStatus === SCOUT_STATUSES.HEALTHY_PUBLIC_FORM) {
    portalStatus = SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED;
  }

  const result = {
    schema: "kingsmen.institution-capability-card.v1",
    candidateFacingSafe: false,
    humanReviewRequired: true,
    institutionRef: target.id,
    displayName: target.name,
    institutionType: target.institutionType || "UNKNOWN",
    sourceUrl: validation.safeUrl,
    finalUrl,
    observedAt,
    tier: target.tier,
    pathways: target.pathways,
    scoutMode: "PROBE_READ_ONLY",
    connectionHealth: healthFromStatus(portalStatus),
    portalStatus,
    mappingVersion: target.mappingVersion || null,
    mappingStatus: !target.expectedStructureFingerprint
      ? "BASELINE_REVIEW_REQUIRED"
      : structureChanged ? "MAPPING_DRIFT_REVIEW_REQUIRED" : "MAPPING_STABLE_PENDING_REVIEW",
    structureFingerprint,
    structureChanged,
    forms: pageData.forms.map((form) => ({
      method: form.method,
      actionPath: form.actionPath,
      externalAction: form.externalAction,
      fields: form.fields.map((field) => ({
        fieldName: field.name,
        tagName: field.tagName,
        inputType: field.inputType,
        accessibleLabel: field.label || field.ariaLabel,
        required: field.required,
        multiple: field.multiple,
        acceptedFileTypes: field.accept
          ? field.accept.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        locatorProposal: field.locatorProposal,
        options: field.options
      }))
    })),
    barriers: [
      portalStatus === SCOUT_STATUSES.CAPTCHA_REQUIRED ? "CAPTCHA_REQUIRED" : null,
      portalStatus === SCOUT_STATUSES.OTP_OR_MFA_REQUIRED ? "OTP_OR_MFA_REQUIRED" : null,
      portalStatus === SCOUT_STATUSES.AUTHENTICATION_REQUIRED ? "AUTHENTICATION_REQUIRED" : null,
      portalStatus === SCOUT_STATUSES.PAYMENT_STEP_DETECTED ? "PAYMENT_STEP_DETECTED" : null,
      portalStatus === SCOUT_STATUSES.RATE_LIMITED ? "RATE_LIMITED" : null,
      portalStatus === SCOUT_STATUSES.WRITE_STEP_PRESENT ? "WRITE_STEP_PRESENT" : null,
      portalStatus === SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED ? "PORTAL_CHANGED" : null,
      portalStatus === SCOUT_STATUSES.PORTAL_UNAVAILABLE || portalStatus === SCOUT_STATUSES.PROBE_FAILED
        ? "PORTAL_UNAVAILABLE" : null
    ].filter(Boolean),
    handoffRecommendation: handoffFromStatus(portalStatus),
    evidenceRefs: [screenshotRef, "sha256:structure:" + structureFingerprint, accessibilityHash ? "sha256:accessibility:" + accessibilityHash : null].filter(Boolean),
    submissionAttempted: false,
    evidence: {
      httpStatus: responseStatus,
      screenshotRef,
      accessibilitySnapshotSha256: accessibilityHash,
      structureSha256: structureFingerprint,
      requestMetadata,
      blockedRequests,
      blockedNonGetRequestCount: blockedNonGet,
      blockedUnapprovedOriginCount: blockedOrigins,
      pageErrorTypes,
      navigationFailure
    },
    privacyAndDoctrine: {
      candidateFacingSafe: false,
      humanReviewRequired: true,
      formSubmissionAttempted: false,
      formSubmissionAttempts: 0,
      candidateDataRead: false,
      fieldValuesRead: false,
      storageStatePersisted: false,
      credentialsUsed: false,
      secretsCaptured: false,
      requestOrResponseBodiesCaptured: false,
      cookiesOrAuthHeadersRecorded: false,
      captchaOrOtpBypassAttempted: false,
      networkMutationAttempted: false,
      externalApplicationStateChanged: false
    }
  };

  await context.close().catch(() => {});
  return result;
}

async function main() {
  if (!fs.existsSync(inputPath)) throw new Error("TARGET_MANIFEST_NOT_FOUND");
  const config = readJson(inputPath);
  const targets = Array.isArray(config.targets) ? config.targets : [];
  const selected = targets
    .filter((target) => target.enabled === true && (!targetFilter || target.id === targetFilter))
    .slice(0, maxTargets);
  const startedAt = new Date().toISOString();
  const runRef = "institution_scout_" + randomUUID();
  const runDir = path.dirname(outputPath);
  fs.mkdirSync(runDir, { recursive: true });

  if (selected.length === 0) {
    const empty = {
      schema: "kingsmen.institution-browser-scout-run.v1",
      runRef,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "NO_ENABLED_TARGETS",
      message: "No target is enabled. A source owner must review and explicitly enable a public target.",
      scoutMode: "PROBE_READ_ONLY",
      targetsInspected: 0,
      results: []
    };
    fs.writeFileSync(outputPath, JSON.stringify(empty, null, 2) + "\n", "utf8");
    process.stdout.write(JSON.stringify(empty, null, 2) + "\n");
    return;
  }

  const { chromium, firefox, webkit } = await import("playwright");
  const engines = { chromium, firefox, webkit };
  const selectedBrowserType = engines[browserName];
  if (!selectedBrowserType) throw new Error("PLAYWRIGHT_ENGINE_UNAVAILABLE");
  const browser = await selectedBrowserType.launch({ headless: true });
  let results = [];
  try {
    const groups = new Map();
    for (const target of selected) {
      const validation = validateScoutTarget(target);
      const key = validation.valid ? new URL(validation.safeUrl).origin : "invalid-" + target.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(target);
    }
    const originGroups = Array.from(groups.values());
    const groupResults = await mapLimit(originGroups, 2, async (group) => {
      const rows = [];
      for (const target of group) rows.push(await inspectTarget(browser, target, runDir));
      return rows;
    });
    results = groupResults.flat();
  } finally {
    await browser.close().catch(() => {});
  }

  const report = {
    schema: "kingsmen.institution-browser-scout-run.v1",
    runRef,
    startedAt,
    completedAt: new Date().toISOString(),
    status: "COMPLETED_WITH_REVIEW_REQUIRED",
    scoutMode: "PROBE_READ_ONLY",
    browser: browserName,
    profile,
    targetLimit: maxTargets,
    perOriginConcurrency: 1,
    originGroupConcurrency: 2,
    targetsInspected: results.length,
    candidateFacingSafe: false,
    publicationAttempted: false,
    truthVaultWriteAttempted: false,
    results
  };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  process.stdout.write(JSON.stringify({
    runRef,
    status: report.status,
    targetsInspected: report.targetsInspected,
    statuses: results.map((result) => ({
      institutionRef: result.institutionRef,
      portalStatus: result.portalStatus,
      connectionHealth: result.connectionHealth,
      mappingStatus: result.mappingStatus,
      handoffRecommendation: result.handoffRecommendation
    })),
    outputPath: path.relative(root, outputPath).replace(/\\/g, "/")
  }, null, 2) + "\n");
}

main().catch((error) => {
  process.stderr.write(JSON.stringify({
    status: "SCOUT_RUN_FAILED",
    reason: error?.name || "UNKNOWN_ERROR",
    safeMessage: "Browser Scout did not complete. No application submission or candidate-data operation was attempted."
  }) + "\n");
  process.exitCode = 1;
});
