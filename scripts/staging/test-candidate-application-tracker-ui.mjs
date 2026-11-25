import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const webDirectory = path.resolve(root, "apps/web");
const require = createRequire(path.resolve(webDirectory, "package.json"));
const { chromium } = require("playwright");
const baseUrl = "http://127.0.0.1:3000";
const applicationId = "11111111-1111-4111-8111-111111111111";
const fakeSupabaseRef = "ci-project";
const timestamp = "2026-11-25T12:00:00.000Z";
const fixtureRequests = [];

const server = spawn(process.execPath, [
  path.resolve(webDirectory, "node_modules/next/dist/bin/next"),
  "start", "-H", "127.0.0.1", "-p", "3000"
], {
  cwd: webDirectory,
  detached: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "https://ci-project.supabase.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-only-not-a-real-anon-key"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";
server.stdout.on("data", chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-5000); });
server.stderr.on("data", chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-5000); });
let browser;
let context;
let expiredContext;

const application = {
  id: applicationId,
  application_ref: "CI-APPLICATION-001",
  pathway_type: "EMPLOYMENT",
  status: "DRAFT",
  readiness_status: "NOT_CHECKED",
  readiness_snapshot: {},
  title: "CI fixture opportunity",
  provider_name: "CI fixture provider",
  source_url: null,
  closes_at: null,
  created_at: timestamp,
  updated_at: timestamp
};
const trackerPayload = {
  ready: true,
  parentApplications: [application],
  applicationEvents: [{
    application_id: applicationId,
    event_type: "APPLICATION_CREATED",
    from_status: null,
    to_status: "DRAFT",
    reason_code: "CI_FIXTURE",
    evidence_ref: "fixture:application-created",
    created_at: timestamp
  }],
  trackers: [],
  items: []
};
const draftPayload = {
  ready: true,
  ok: true,
  application,
  draft: {
    motivation_statement: "CI saved motivation",
    relevant_experience: "",
    qualifications_summary: "",
    availability_date: "",
    preferred_campus: "",
    additional_answers: []
  },
  draft_version: 1,
  draft_updated_at: timestamp,
  shared_profile_available: true,
  shared_profile_updated_at: timestamp,
  is_editable: true,
  provider_submission_sent: false
};

async function installAuth(contextToConfigure, expiresAt) {
  await contextToConfigure.addInitScript(({ ref, expiry }) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: "ci-test-access-token-not-valid-for-any-real-service",
      expires_at: expiry
    }));
  }, { ref: fakeSupabaseRef, expiry: expiresAt });
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Next.js test server exited early.\n" + serverOutput);
    try {
      const response = await fetch(baseUrl + "/candidate/applications");
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js test server did not become ready.\n" + serverOutput);

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  await installAuth(context, Math.floor(Date.now() / 1000) + 3600);
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(15_000);

  await page.route("**/functions/v1/candidate-application-preparation", async route => {
    const request = route.request();
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": baseUrl,
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "authorization, apikey, content-type",
          "access-control-max-age": "0"
        }
      });
      return;
    }
    fixtureRequests.push({ url: request.url(), method, body: request.postDataJSON() });
    await route.fulfill({
      status: 200,
      headers: { "access-control-allow-origin": baseUrl },
      json: trackerPayload
    });
  });
  await page.route("**/api/candidate/application-draft**", async route => {
    if (route.request().method() !== "GET") {
      await route.fulfill({ status: 405, json: { ready: false, ok: false, code: "METHOD_NOT_ALLOWED" } });
      return;
    }
    await route.fulfill({ status: 200, json: draftPayload });
  });

  // The public canonical entry should redirect into the existing authenticated tracker.
  await page.goto(baseUrl + "/candidate/applications", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Application tracker" }).waitFor();
  await page.getByText("CI-APPLICATION-001", { exact: false }).waitFor();
  assert.ok(fixtureRequests.some(item =>
    item.url.endsWith("/functions/v1/candidate-application-preparation")
      && item.method === "POST" && item.body.action === "load"),
    "The tracker must load parent applications through the authenticated preparation service.");

  const resumeLink = page.getByRole("link", { name: "Open / resume application draft" });
  assert.equal(await resumeLink.getAttribute("href"), "/candidate/applications/" + applicationId);
  await resumeLink.click();
  await page.getByRole("heading", { name: "Application draft" }).waitFor();
  await page.getByText("CI fixture opportunity").waitFor();
  assert.equal(await page.getByLabel("Motivation statement").inputValue(), "CI saved motivation");
  assert.equal(new URL(page.url()).pathname, "/candidate/applications/" + applicationId);

  // An expired browser session must fail closed before the tracker calls the data service.
  expiredContext = await browser.newContext();
  await installAuth(expiredContext, Math.floor(Date.now() / 1000) - 60);
  const expiredPage = await expiredContext.newPage();
  let expiredSessionDataRequests = 0;
  await expiredPage.route("**/functions/v1/candidate-application-preparation", async route => {
    expiredSessionDataRequests += 1;
    await route.fulfill({ status: 200, json: trackerPayload });
  });
  await expiredPage.goto(baseUrl + "/candidate/applications", { waitUntil: "networkidle" });
  await expiredPage.getByText("Your session has expired. Sign in again.", { exact: false }).waitFor();
  assert.equal(expiredSessionDataRequests, 0, "Expired session must not issue a candidate-data request.");

  console.log("PASS: canonical applications entry loads the authenticated application tracker");
  console.log("PASS: tracker opens the correct parent application draft and resumes saved answers");
  console.log("PASS: expired candidate session is rejected before candidate-data requests");
} finally {
  if (expiredContext) await expiredContext.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
