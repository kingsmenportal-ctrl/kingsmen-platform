#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";
import { chromium } from "playwright";
import {
  PLAYWRIGHT_SCOUT_WORKER_CODE,
  authorizeScoutDispatch,
  isSensitiveUrl,
  validateAdapterRegistry
} from "./providers/provider-adapter-policy.mjs";

const { Pool } = pg;
const ROLE_NAME = "kingsmen_playwright_scout_worker";
const WORKER_ID = process.env.KINGSMEN_PLAYWRIGHT_WORKER_ID || "playwright-scout:operations-01";
const POLL_MS = Math.min(30000, Math.max(1000, Number(process.env.KINGSMEN_PLAYWRIGHT_POLL_MS || 5000)));
const REGISTRY_PATH = process.env.KINGSMEN_PROVIDER_ADAPTER_REGISTRY || "/etc/kingsmen/provider-adapters.json";
const MAX_BODY_TEXT = 6000;
let stopping = false;
let pool;
let client;
let browser;

function log(event, fields = {}) {
  // Never log tokens, connection strings, page bodies or provider credentials.
  process.stdout.write(JSON.stringify({
    service: "kingsmen-playwright-operations",
    event,
    workerCode: PLAYWRIGHT_SCOUT_WORKER_CODE,
    at: new Date().toISOString(),
    ...fields
  }) + "\n");
}

function fail(code, exitCode = 1) {
  log("startup_blocked", { code });
  process.exitCode = exitCode;
  throw new Error(code);
}

function validWorkerId(value) {
  return /^playwright-scout:[a-z0-9][a-z0-9._-]{0,63}$/.test(value);
}

function isPublicIpv4(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const a = octets[0], b = octets[1], c = octets[2];
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || b === 168)) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a === 255) return false;
  return true;
}

function isPublicIp(address) {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family !== 6) return false;
  const value = address.toLowerCase();
  if (value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd")
      || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea")
      || value.startsWith("feb") || value.startsWith("ff") || value.startsWith("2001:db8:")
      || value.startsWith("::ffff:")) return false;
  return true;
}

async function assertPublicDns(hosts) {
  for (const host of hosts) {
    const records = await lookup(host, { all: true, verbatim: true });
    if (!records.length || records.some((record) => !isPublicIp(record.address))) {
      throw new Error("SOURCE_DNS_NOT_PUBLIC");
    }
  }
}

function redactText(value, maximum) {
  return String(value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b\d{13}\b/g, "[redacted-id]")
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, "[redacted-number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function blockerFor({ title, body, url }) {
  const combined = (String(title) + " " + String(body) + " " + String(url)).toLowerCase();
  if (/captcha|recaptcha|verify you are human|cloudflare challenge|security challenge/.test(combined)) return "BLOCKED_BY_CAPTCHA";
  if (/sign in|log in|login required|authentication required|create an account to continue/.test(combined)) return "BLOCKED_BY_LOGIN";
  if (/access denied|request blocked|automated access is prohibited/.test(combined)) return "BLOCKED_BY_ACCESS_POLICY";
  return null;
}

async function inspectPublicSource(source, allowedHosts) {
  const url = new URL(source.officialSourceUrl);
  await assertPublicDns(allowedHosts);
  const context = await browser.newContext({
    acceptDownloads: false,
    serviceWorkers: "block",
    ignoreHTTPSErrors: false
  });
  const result = {
    sourceId: source.id,
    providerId: source.providerId,
    pathway: source.pathway,
    retrievedAt: new Date().toISOString(),
    sourceUrl: url.origin + url.pathname,
    finalUrl: null,
    httpStatus: null,
    pageTitle: null,
    metaDescription: null,
    headings: [],
    applicationLinks: [],
    status: "NOT_ASSESSED",
    blocker: null
  };
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(25000);
  page.setDefaultTimeout(5000);
  let dialogCount = 0;

  await context.route("**/*", async (route) => {
    let requestUrl;
    try {
      requestUrl = new URL(route.request().url());
    } catch {
      await route.abort();
      return;
    }
    const request = route.request();
    if (requestUrl.protocol !== "https:"
        || requestUrl.port !== ""
        || !allowedHosts.includes(requestUrl.hostname.toLowerCase())
        || request.method() !== "GET"
        || isSensitiveUrl(requestUrl.href)
        || ["image", "media", "font"].includes(request.resourceType())) {
      await route.abort();
      return;
    }
    // DNS is checked again immediately before navigation. Egress firewalling to
    // the configured public provider hosts is also mandatory at deployment.
    await route.continue();
  });

  page.on("dialog", async (dialog) => {
    dialogCount += 1;
    await dialog.dismiss().catch(() => {});
  });
  page.on("popup", async (popup) => { await popup.close().catch(() => {}); });

  try {
    const response = await page.goto(source.officialSourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000
    });
    result.httpStatus = response?.status() ?? null;
    const finalUrl = new URL(page.url());
    if (finalUrl.protocol !== "https:"
        || finalUrl.port !== ""
        || !allowedHosts.includes(finalUrl.hostname.toLowerCase())
        || isSensitiveUrl(finalUrl.href)) {
      result.status = "BLOCKED_UNAPPROVED_REDIRECT";
    } else {
      result.finalUrl = finalUrl.origin + finalUrl.pathname;
      const title = await page.title().catch(() => "");
      const description = await page.locator('meta[name="description"]').getAttribute("content").catch(() => "");
      const headings = await page.locator("h1, h2").allTextContents().catch(() => []);
      const body = await page.locator("body").innerText({ timeout: 4000 }).catch(() => "");
      result.pageTitle = redactText(title, 200);
      result.metaDescription = redactText(description, 320);
      result.headings = headings.slice(0, 8).map((item) => redactText(item, 120)).filter(Boolean);
      result.blocker = blockerFor({ title, body: body.slice(0, MAX_BODY_TEXT), url: finalUrl.href });

      const links = await page.locator("a[href]").evaluateAll((anchors) => anchors.slice(0, 200).map((anchor) => ({
        text: (anchor.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
        href: anchor.href
      }))).catch(() => []);
      result.applicationLinks = links
        .filter((item) => /apply|application|admission|programme|program|career|vacanc|learnership|internship|opportunit|recruit|register/i.test(item.text))
        .filter((item) => {
          try {
            const link = new URL(item.href);
            return link.protocol === "https:"
              && link.port === ""
              && allowedHosts.includes(link.hostname.toLowerCase())
              && !isSensitiveUrl(link.href);
          } catch {
            return false;
          }
        })
        .slice(0, 15)
        .map((item) => {
          const link = new URL(item.href);
          return { text: redactText(item.text, 100), url: link.origin + link.pathname };
        });

      if (result.blocker) result.status = result.blocker;
      else if (result.httpStatus === null || result.httpStatus >= 400) result.status = "HTTP_ERROR_REQUIRES_REVIEW";
      else if (dialogCount > 0) result.status = "DIALOG_REQUIRES_REVIEW";
      else result.status = "INSPECTED_PUBLIC_SOURCE";
    }
  } catch (error) {
    result.status = error instanceof Error && /timeout/i.test(error.name) ? "TIMEOUT" : "SOURCE_UNAVAILABLE";
  } finally {
    await context.close().catch(() => {});
  }
  return result;
}

function dispatchResultRef(dispatch) {
  const digest = createHash("sha256").update(String(dispatch.dispatch_ref)).digest("hex").slice(0, 24);
  return "playwright-scout:" + digest + ":" + String(dispatch.attempt_count);
}

async function recordOutcome(dispatch, outcome) {
  const evidenceRefs = Array.isArray(dispatch.evidence_refs) ? dispatch.evidence_refs : [];
  const report = {
    schema: "kingsmen.playwright-scout-result.v1",
    workerCode: PLAYWRIGHT_SCOUT_WORKER_CODE,
    dispatchRef: dispatch.dispatch_ref,
    idempotencyKey: dispatch.idempotency_key,
    adapterId: outcome.adapterId ?? null,
    adapterVersion: outcome.adapterVersion ?? null,
    readOnly: true,
    providerLoginAttempted: false,
    formsInteractedWith: false,
    documentsUploaded: false,
    applicationsSubmitted: false,
    paymentsAttempted: false,
    providerDecisionClaimed: false,
    result: outcome.result ?? null,
    resultSha256: createHash("sha256").update(JSON.stringify(outcome.result ?? {})).digest("hex")
  };
  const result = await client.query(
    "select public.n16_record_playwright_scout_result($1,$2,$3,$4,$5::jsonb,$6::text[],$7,$8) as outcome",
    [
      dispatch.dispatch_ref,
      WORKER_ID,
      dispatchResultRef(dispatch),
      outcome.workerStatus,
      JSON.stringify(report),
      evidenceRefs,
      outcome.failureClass ?? null,
      outcome.failureCode ?? null
    ]
  );
  return result.rows[0]?.outcome ?? {};
}

async function handleDispatch(dispatch, registry) {
  const authorization = authorizeScoutDispatch(registry, dispatch);
  if (!authorization.valid) {
    const outcome = await recordOutcome(dispatch, {
      workerStatus: "NEEDS_MANUAL",
      failureClass: "POLICY",
      failureCode: authorization.code,
      result: { status: "BLOCKED_BY_ADAPTER_POLICY", reason: authorization.code }
    });
    return { status: "HANDOFF", outcome };
  }

  try {
    const result = await inspectPublicSource(authorization.source, authorization.allowedHosts);
    if (result.status === "INSPECTED_PUBLIC_SOURCE") {
      const outcome = await recordOutcome(dispatch, {
        adapterId: authorization.adapter.id,
        adapterVersion: authorization.adapter.version,
        workerStatus: "SUCCEEDED",
        result
      });
      return { status: "RECORDED", outcome };
    }
    const outcome = await recordOutcome(dispatch, {
      adapterId: authorization.adapter.id,
      adapterVersion: authorization.adapter.version,
      workerStatus: "NEEDS_MANUAL",
      failureClass: "PORTAL_BLOCKED",
      failureCode: result.blocker ?? result.status,
      result
    });
    return { status: "HANDOFF", outcome };
  } catch (error) {
    const code = error instanceof Error && error.message === "SOURCE_DNS_NOT_PUBLIC"
      ? "SOURCE_DNS_NOT_PUBLIC"
      : "SOURCE_INSPECTION_FAILED";
    const outcome = await recordOutcome(dispatch, {
      adapterId: authorization.adapter.id,
      adapterVersion: authorization.adapter.version,
      workerStatus: code === "SOURCE_DNS_NOT_PUBLIC" ? "NEEDS_MANUAL" : "FAILED",
      failureClass: code === "SOURCE_DNS_NOT_PUBLIC" ? "POLICY" : "TRANSIENT",
      failureCode: code,
      result: { status: "SOURCE_UNAVAILABLE", errorCode: code }
    });
    return { status: "RECORDED_FAILURE", outcome };
  }
}

async function connectDatabase() {
  const databaseUrl = process.env.KINGSMEN_PLAYWRIGHT_DATABASE_URL;
  if (!databaseUrl) fail("PLAYWRIGHT_DATABASE_URL_REQUIRED");
  if (!validWorkerId(WORKER_ID)) fail("PLAYWRIGHT_WORKER_ID_INVALID");
  const parsed = new URL(databaseUrl);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    fail("PLAYWRIGHT_DATABASE_URL_INVALID");
  }
  pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: true },
    application_name: "kingsmen-playwright-scout"
  });
  client = await pool.connect();
  await client.query("SET ROLE " + ROLE_NAME);
  const identity = await client.query(
    "select current_user as current_role, session_user as login_role, pg_has_role(session_user, $1, 'MEMBER') as member",
    [ROLE_NAME]
  );
  if (identity.rows[0]?.current_role !== ROLE_NAME || identity.rows[0]?.member !== true) {
    fail("PLAYWRIGHT_DATABASE_ROLE_CHECK_FAILED");
  }
}

async function main() {
  if (process.env.KINGSMEN_PLAYWRIGHT_OPERATIONS_ENABLED !== "true") {
    log("worker_disabled", { code: "PLAYWRIGHT_OPERATIONS_DISABLED" });
    return;
  }
  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8"));
  const registryValidation = validateAdapterRegistry(registry);
  if (!registryValidation.valid) fail("PROVIDER_ADAPTER_REGISTRY_INVALID");
  const enabled = registryValidation.enabledAdapters;
  if (enabled.length === 0) {
    log("worker_disabled", { code: "NO_APPROVED_PROVIDER_ADAPTERS_REGISTERED" });
    return;
  }
  if (enabled.length > 25) fail("PROVIDER_ADAPTER_LIMIT_EXCEEDED");

  // Pin every approved host to a DNS answer after rejecting private/reserved
  // addresses. Browser routing still enforces exact-host GET-only allowlists.
  const allHosts = [...new Set(enabled.flatMap((adapter) => Array.isArray(adapter.allowedHosts) ? adapter.allowedHosts : []))];
  const resolverRules = [];
  for (const host of allHosts) {
    const records = await lookup(host, { all: true, verbatim: true });
    if (!records.length || records.some((record) => !isPublicIp(record.address))) {
      fail("SOURCE_DNS_NOT_PUBLIC");
    }
    const address = records[0].address.includes(":") ? "[" + records[0].address + "]" : records[0].address;
    resolverRules.push("MAP " + host + " " + address);
  }

  log("worker_starting", { adapterCount: enabled.length, concurrency: 1, readOnly: true });
  await connectDatabase();
  browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--host-resolver-rules=" + resolverRules.join(",")]
  });
  process.once("SIGTERM", () => { stopping = true; });
  process.once("SIGINT", () => { stopping = true; });

  while (!stopping) {
    const claimed = await client.query(
      "select * from public.n16_claim_playwright_scout_dispatches($1, 1, 90)",
      [WORKER_ID]
    );
    if (claimed.rows.length === 0) {
      await delay(POLL_MS);
      continue;
    }
    for (const dispatch of claimed.rows) {
      const outcome = await handleDispatch(dispatch, registry);
      log("dispatch_completed", {
        dispatchRef: dispatch.dispatch_ref,
        attempt: dispatch.attempt_count,
        status: outcome.status
      });
    }
  }
}

main()
  .catch((error) => {
    log("worker_fatal", { code: error instanceof Error ? error.message : "UNKNOWN" });
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close().catch(() => {});
    client?.release();
    await pool?.end().catch(() => {});
    log("worker_stopped");
  });
