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
const fakeSupabaseRef = "ci-project";
const targetKey = "CI-TARGET-001";
const targetId = "11111111-1111-4111-8111-111111111111";
const parentId = "22222222-2222-4222-8222-222222222222";
const now = "2026-11-19T15:30:00.000Z";
const requests = [];
let prepared = false;

function loadState() {
  return {
    ready: true,
    message: prepared
      ? "Kingsmen parent application draft prepared. Nothing was submitted to a provider."
      : "Candidate application records loaded from the CI fixture.",
    masterTargets: [{
      id: targetId,
      target_key: targetKey,
      pathway_type: "EMPLOYMENT",
      provider_name: "CI Fixture Employer",
      programme_or_role: "CI Data Analyst",
      provider_application_url: null,
      source_reference: "CI-OFFICIAL-SOURCE-001",
      source_confidence: "VERIFIED",
      planning_status: "SAVED",
      application_id: prepared ? parentId : null,
      created_at: now,
      updated_at: now
    }],
    parentApplications: prepared ? [{
      id: parentId,
      application_ref: "KM-CI-PARENT-001",
      pathway_type: "EMPLOYMENT",
      status: "READY_TO_SUBMIT",
      kingsmen_status: "Draft",
      readiness_status: "NOT_CHECKED",
      readiness_snapshot: { ci_fixture: true },
      created_at: now,
      updated_at: now
    }] : [],
    trackers: [],
    items: []
  };
}

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

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Next.js test server exited early.\n" + serverOutput);
    try {
      const response = await fetch(baseUrl + "/candidate/workbench/");
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js test server did not become ready.\n" + serverOutput);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(({ ref }) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: "ci-test-access-token-not-valid-for-any-real-service",
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }));
  }, { ref: fakeSupabaseRef });

  const page = await context.newPage();
  const unexpectedProviderRequests = [];
  await page.route("**/functions/v1/**", async route => {
    const request = route.request();
    const url = request.url();
    if (!url.endsWith("/functions/v1/candidate-application-preparation")) {
      unexpectedProviderRequests.push(url);
      await route.abort();
      return;
    }

    const corsHeaders = {
      "access-control-allow-origin": "http://127.0.0.1:3000",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "authorization, apikey, content-type",
      "access-control-max-age": "0"
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    const body = request.postDataJSON();
    requests.push({
      action: body.action,
      body,
      hasBearer: Boolean(request.headers().authorization?.startsWith("Bearer ")),
      hasAnonKey: Boolean(request.headers().apikey)
    });

    if (body.action === "load") {
      await route.fulfill({ status: 200, json: loadState(), headers: corsHeaders });
      return;
    }
    if (body.action === "prepare_master_application") {
      if (body.target_key !== targetKey) {
        await route.fulfill({
          status: 400,
          json: { ready: false, code: "UNKNOWN_CI_TARGET", error: "Unexpected test target." },
          headers: corsHeaders
        });
        return;
      }
      prepared = true;
      await route.fulfill({
        status: 200,
        json: {
          ready: true,
          parentApplication: loadState().parentApplications[0],
          message: "Kingsmen parent application draft prepared. Nothing was submitted to a provider.",
          provider_submission_sent: false
        },
        headers: corsHeaders
      });
      return;
    }
    await route.fulfill({
      status: 400,
      json: { ready: false, code: "ACTION_NOT_SUPPORTED" },
      headers: corsHeaders
    });
  });

  await page.goto(baseUrl + "/candidate/workbench/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Saved routes and parent applications" }).waitFor();
  await page.getByRole("heading", { name: "CI Data Analyst" }).waitFor();
  assert.equal(await page.getByText("0", { exact: true }).count() > 0, true);

  const prepareButton = page.getByRole("button", { name: "Prepare parent application" });
  await prepareButton.click();
  await page.getByText("Parent record: KM-CI-PARENT-001", { exact: true }).waitFor();
  await page.getByText("Kingsmen status: Draft", { exact: false }).waitFor();
  assert.equal(await page.getByText("Application state: READY_TO_SUBMIT", { exact: true }).count(), 0,
    "internal workflow status must not be rendered as the candidate-facing application status");
  const draftLink = page.getByRole("link", { name: "Open / resume application draft", exact: true });
  await draftLink.waitFor();
  assert.equal(await draftLink.getAttribute("href"), `/candidate/applications/${parentId}`);

  const prepareRequests = requests.filter(item => item.action === "prepare_master_application");
  assert.equal(prepareRequests.length, 1, "one target should produce one parent-preparation request");
  assert.equal(prepareRequests[0].body.target_key, targetKey);
  assert.equal(prepareRequests[0].hasBearer, true);
  assert.equal(prepareRequests[0].hasAnonKey, true);
  assert.equal(prepared, true);
  assert.deepEqual(unexpectedProviderRequests, [], "preparation must not call a provider submission endpoint");
  assert.ok(requests.some(item => item.action === "load"), "workbench should reload persisted records after preparing the parent");

  console.log("PASS: verified saved target prepares one Kingsmen parent application draft");
  console.log("PASS: parent Draft is linked back to the saved target and opens its Kingsmen draft editor");
  console.log("PASS: workbench displays the canonical Kingsmen status, not the internal workflow state");
  console.log("PASS: preparation request uses bearer authorization and the public anon key");
  console.log("PASS: no provider submission endpoint was called");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
