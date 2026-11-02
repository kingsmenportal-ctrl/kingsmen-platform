import { createHash } from "node:crypto";
import { chromium, type Browser, type BrowserContext } from "playwright";
import type { WorkerHandler } from "./worker-runner";

type BrowserPayload = { url: string };

function isLoopback(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function parseAllowedOrigins(raw: string | undefined, allowHttpLocalTests: boolean): Set<string> {
  if (!raw?.trim()) throw new Error("N16_BROWSER_ALLOWED_ORIGINS_REQUIRED");
  const entries = raw.split(",").map((value) => value.trim()).filter(Boolean);
  const origins = new Set<string>();
  for (const entry of entries) {
    let parsed: URL;
    try { parsed = new URL(entry); } catch { throw new Error("N16_BROWSER_ALLOWED_ORIGIN_INVALID"); }
    const secure = parsed.protocol === "https:";
    const localTestOnly = allowHttpLocalTests && parsed.protocol === "http:" && isLoopback(parsed.hostname);
    if ((!secure && !localTestOnly) || parsed.username || parsed.password ||
        parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.origin !== entry) {
      throw new Error("N16_BROWSER_ALLOWED_ORIGIN_MUST_BE_HTTPS_ORIGIN");
    }
    origins.add(parsed.origin);
  }
  if (!origins.size) throw new Error("N16_BROWSER_ALLOWED_ORIGINS_REQUIRED");
  return origins;
}

function parseAllowedPaths(raw: string | undefined): Set<string> {
  if (!raw?.trim()) throw new Error("N16_BROWSER_ALLOWED_PATHS_REQUIRED");
  const entries = raw.split(",").map((value) => value.trim()).filter(Boolean);
  const paths = new Set<string>();
  for (const path of entries) {
    if (!path.startsWith("/") || path.startsWith("//") || /[?#\\\u0000-\u001f]/.test(path) || path.includes("..")) {
      throw new Error("N16_BROWSER_ALLOWED_PATH_INVALID");
    }
    const normalized = new URL(path, "https://kingsmen.invalid");
    if (normalized.pathname !== path || normalized.search || normalized.hash) {
      throw new Error("N16_BROWSER_ALLOWED_PATH_INVALID");
    }
    paths.add(path);
  }
  if (!paths.size) throw new Error("N16_BROWSER_ALLOWED_PATHS_REQUIRED");
  return paths;
}

function parseTimeout(raw: string | undefined): number {
  const value = Number(raw ?? "12000");
  if (!Number.isInteger(value) || value < 1000 || value > 20000) {
    throw new Error("N16_BROWSER_TIMEOUT_INVALID");
  }
  return value;
}

function parsePayload(payload: Record<string, unknown>, allowedOrigins: Set<string>, allowedPaths: Set<string>, allowHttpLocalTests: boolean): URL | null {
  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== "url" || typeof payload.url !== "string" || payload.url.length > 2048) {
    return null;
  }
  let target: URL;
  try { target = new URL(payload.url); } catch { return null; }
  const secure = target.protocol === "https:";
  const localTestOnly = allowHttpLocalTests && target.protocol === "http:" && isLoopback(target.hostname);
  if ((!secure && !localTestOnly) || target.username || target.password || target.search || target.hash ||
      !allowedOrigins.has(target.origin) || !allowedPaths.has(target.pathname)) return null;
  return target;
}

/**
 * Read-only browser scout. It has no session/cookie import, headers, arbitrary
 * selectors, scripts, screenshots, downloads, form submissions, or write methods.
 * The only executable task is a GET-based health/navigation observation.
 */
export function createPlaywrightReadOnlyScoutHandler(env: NodeJS.ProcessEnv = process.env): WorkerHandler {
  const allowHttpLocalTests = env.NODE_ENV === "test" && env.KINGSMEN_BROWSER_ALLOW_HTTP_LOCAL_TESTS === "true";
  const allowedOrigins = parseAllowedOrigins(env.KINGSMEN_BROWSER_ALLOWED_ORIGINS, allowHttpLocalTests);
  const allowedPaths = parseAllowedPaths(env.KINGSMEN_BROWSER_ALLOWED_PATHS);
  const timeoutMs = parseTimeout(env.KINGSMEN_BROWSER_TASK_TIMEOUT_MS);

  return {
    sideEffect: false,
    requiresHumanApproval: false,
    async execute({ dispatch, now }) {
      const target = parsePayload(dispatch.payload, allowedOrigins, allowedPaths, allowHttpLocalTests);
      if (!target) {
        return {
          workerStatus: "BLOCKED",
          proposedState: "SAME",
          failureClass: "POLICY",
          failureCode: "BROWSER_TASK_URL_OR_SCHEMA_NOT_ALLOWLISTED",
          payload: { handler: "browser.readonly_scout", readOnly: true }
        };
      }

      let browser: Browser | undefined;
      let context: BrowserContext | undefined;
      let blockedRequestCount = 0;
      let pageErrorCount = 0;
      const startedAt = Date.now();

      try {
        browser = await chromium.launch({ headless: true, timeout: timeoutMs });
        context = await browser.newContext({
          acceptDownloads: false,
          serviceWorkers: "block",
          ignoreHTTPSErrors: false,
          viewport: { width: 1365, height: 900 },
          reducedMotion: "reduce"
        });
        const page = await context.newPage();
        page.setDefaultTimeout(timeoutMs);
        page.setDefaultNavigationTimeout(timeoutMs);
        page.on("pageerror", () => { pageErrorCount += 1; });
        page.on("popup", (popup) => { void popup.close(); });
        page.on("download", (download) => { void download.cancel(); });
        page.on("dialog", (dialog) => { void dialog.dismiss(); });

        await context.route("**/*", async (route) => {
          const request = route.request();
          let requestUrl: URL;
          try { requestUrl = new URL(request.url()); } catch {
            blockedRequestCount += 1;
            await route.abort("blockedbyclient");
            return;
          }
          const methodAllowed = request.method() === "GET" || request.method() === "HEAD";
          const requestSchemeAllowed = requestUrl.protocol === "https:" ||
            (allowHttpLocalTests && requestUrl.protocol === "http:" && isLoopback(requestUrl.hostname));
          const sameOrigin = requestUrl.origin === target.origin && requestSchemeAllowed;
          const navigationPathAllowed = !request.isNavigationRequest() || allowedPaths.has(requestUrl.pathname);
          if (!methodAllowed || !sameOrigin || !navigationPathAllowed) {
            blockedRequestCount += 1;
            await route.abort("blockedbyclient");
            return;
          }
          await route.continue();
        });

        const response = await page.goto(target.href, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        const finalUrl = new URL(page.url());
        if (finalUrl.origin !== target.origin || !allowedPaths.has(finalUrl.pathname)) {
          return {
            workerStatus: "BLOCKED",
            proposedState: "SAME",
            failureClass: "POLICY",
            failureCode: "BROWSER_REDIRECT_OUTSIDE_ALLOWLIST",
            payload: { handler: "browser.readonly_scout", readOnly: true, blockedRequestCount }
          };
        }
        const title = await page.title();
        const httpStatus = response?.status() ?? 0;
        const navigationDurationMs = Math.max(0, Date.now() - startedAt);
        const titleSha256 = createHash("sha256").update(title, "utf8").digest("hex");

        if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404 || httpStatus === 429) {
          return {
            workerStatus: "NEEDS_MANUAL",
            proposedState: "SAME",
            failureClass: "PORTAL_BLOCKED",
            failureCode: "BROWSER_ROUTE_REQUIRES_MANUAL_REVIEW",
            payload: { handler: "browser.readonly_scout", httpStatus, navigationDurationMs, blockedRequestCount, pageErrorCount, readOnly: true }
          };
        }
        if (httpStatus < 200 || httpStatus >= 400 || pageErrorCount > 0) {
          return {
            workerStatus: "FAILED",
            proposedState: "SAME",
            failureClass: httpStatus >= 500 || httpStatus === 0 ? "TRANSIENT" : "PORTAL_BLOCKED",
            failureCode: pageErrorCount > 0 ? "BROWSER_PAGE_ERROR" : "BROWSER_HTTP_NOT_OK",
            payload: { handler: "browser.readonly_scout", httpStatus, navigationDurationMs, blockedRequestCount, pageErrorCount, readOnly: true }
          };
        }
        return {
          workerStatus: "SUCCEEDED",
          proposedState: "SAME",
          evidenceRefs: dispatch.evidence_refs,
          payload: {
            handler: "browser.readonly_scout",
            httpStatus,
            titleLength: title.length,
            titleSha256,
            navigationDurationMs,
            blockedRequestCount,
            pageErrorCount,
            checkedAt: now(),
            readOnly: true,
            contentCaptured: false,
            screenshotsCaptured: false
          }
        };
      } catch (error) {
        return {
          workerStatus: "FAILED",
          proposedState: "SAME",
          failureClass: "TRANSIENT",
          failureCode: error instanceof Error && /Timeout/i.test(error.name) ? "BROWSER_NAVIGATION_TIMEOUT" : "BROWSER_NAVIGATION_FAILED",
          payload: {
            handler: "browser.readonly_scout",
            elapsedMs: Math.max(0, Date.now() - startedAt),
            blockedRequestCount,
            pageErrorCount,
            readOnly: true
          }
        };
      } finally {
        if (context) await context.close().catch(() => undefined);
        if (browser) await browser.close().catch(() => undefined);
      }
    }
  };
}
