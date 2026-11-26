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
const projectRef = "ci-project";
const anonymousKey = "ci-only-not-a-real-anon-key";
const accessToken = "ci-candidate-access-token-not-valid-for-any-real-service";
const functionRequests = [];
const saveRequests = [];
const sourceCheckedAt = new Date().toISOString();

const feed = {
  status: "OK",
  count: 1,
  opportunities: [{
    match_ref: "CI-NSFAS-MATCH-001",
    title: "CI fixture study funding",
    provider: "CI fixture funding provider",
    sector: "NSFAS",
    pathways: ["HIGHER_EDUCATION", "TVET"],
    location: "Gauteng",
    official_link: "https://provider.example/funding",
    match_score: 0.92,
    source_checked_at: sourceCheckedAt,
    source_evidence: ["CI fixture only"],
    deadline: { status: "UNKNOWN", message: "Closing date not independently confirmed.", evidence: [] },
    eligibility: { status: "REVIEWED", rules: "Confirm requirements against the official provider page." },
    recommendation_summary: "Disposable CI fixture; not a real funding opportunity."
  }]
};

const server = spawn(process.execPath, [
  path.resolve(webDirectory, "node_modules/next/dist/bin/next"),
  "start", "-H", "127.0.0.1", "-p", "3000"
], {
  cwd: webDirectory,
  detached: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "https://ci-project.supabase.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonymousKey
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
    if (server.exitCode !== null) throw new Error("Next.js opportunity-match test server exited early.\n" + serverOutput);
    try {
      const response = await fetch(baseUrl + "/candidate/opportunity-matches");
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js opportunity-match test server did not become ready.\n" + serverOutput);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(15_000);

  await page.route("**/functions/v1/n15-candidate-opportunities**", async route => {
    const request = route.request();
    functionRequests.push({ url: request.url(), method: request.method(), headers: request.headers() });
    await route.fulfill({ status: 200, json: feed });
  });
  await page.route("**/functions/v1/candidate-save-verified-opportunity**", async route => {
    const request = route.request();
    const entry = { url: request.url(), method: request.method(), headers: request.headers(), body: request.postDataJSON() };
    functionRequests.push(entry);
    saveRequests.push(entry);
    await route.fulfill({
      status: 200,
      json: { ok: true, message: "Fixture save confirmed; application remains a draft and no provider submission occurred." }
    });
  });

  await page.goto(baseUrl + "/candidate/opportunity-matches", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Opportunity matches" }).waitFor();

  // Missing and expired sessions must be rejected before either service is called.
  await page.getByRole("button", { name: "Load my verified matches" }).click();
  await page.getByRole("alert").filter({ hasText: "Sign in to load and save verified opportunities." }).waitFor();
  assert.equal(functionRequests.length, 0, "Missing candidate session must not call any opportunity service.");

  await page.evaluate(({ ref }) => {
    localStorage.setItem("sb-" + ref + "-auth-token", JSON.stringify({
      access_token: "ci-expired-access-token-not-valid-for-any-service",
      expires_at: Math.floor(Date.now() / 1000) - 30
    }));
  }, { ref: projectRef });
  await page.getByRole("button", { name: "Load my verified matches" }).click();
  await page.getByRole("alert").filter({ hasText: "Your candidate session has expired. Sign in again to continue." }).waitFor();
  assert.equal(functionRequests.length, 0, "Expired candidate session must not call any opportunity service.");

  await page.evaluate(({ ref, token }) => {
    localStorage.setItem("sb-" + ref + "-auth-token", JSON.stringify({
      access_token: token,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { email: "candidate-fixture@example.invalid" }
    }));
  }, { ref: projectRef, token: accessToken });

  await page.getByRole("button", { name: "Load my verified matches" }).click();
  await page.getByRole("heading", { name: "CI fixture study funding" }).waitFor();
  assert.equal(functionRequests.length, 1, "A valid session should issue exactly one opportunity-feed request.");
  assert.equal(functionRequests[0].method, "GET");
  assert.equal(functionRequests[0].headers.apikey, anonymousKey);
  assert.equal(functionRequests[0].headers.authorization, "Bearer " + accessToken);

  // Ambiguous pathways must be explicit; no save request may fire without a choice.
  await page.getByRole("button", { name: "Save & prepare draft" }).click();
  await page.getByRole("alert").filter({ hasText: "Choose the pathway this bursary, accommodation or college route should support before saving." }).waitFor();
  assert.equal(saveRequests.length, 0, "An ambiguous funding opportunity must require a pathway before saving.");

  await page.getByLabel("Choose the pathway this support should be linked to").selectOption("HIGHER_EDUCATION");
  await page.getByRole("button", { name: "Save & prepare draft" }).click();
  await page.getByRole("status").filter({ hasText: "Fixture save confirmed" }).waitFor();

  assert.equal(saveRequests.length, 1, "The valid candidate save should call the save service exactly once.");
  assert.equal(saveRequests[0].method, "POST");
  assert.equal(saveRequests[0].headers.apikey, anonymousKey);
  assert.equal(saveRequests[0].headers.authorization, "Bearer " + accessToken);
  assert.equal(saveRequests[0].body.action, "save");
  assert.equal(saveRequests[0].body.match_ref, "CI-NSFAS-MATCH-001");
  assert.equal(saveRequests[0].body.pathway_type, "HIGHER_EDUCATION");
  assert.equal(await page.getByRole("link", { name: "Open My Applications →" }).getAttribute("href"), "/candidate/applications");
  assert.equal(await page.getByRole("link", { name: "View Saved Opportunities" }).getAttribute("href"), "/candidate/saved-opportunities/");

  assert.ok(functionRequests.every(item =>
    item.url.includes("/n15-candidate-opportunities") || item.url.includes("/candidate-save-verified-opportunity")),
    "The test must not call a provider-submission service.");
  console.log("PASS: missing and expired sessions are rejected before opportunity service calls.");
  console.log("PASS: verified match feed requires a shared, active candidate session.");
  console.log("PASS: ambiguous funding pathway must be selected before save.");
  console.log("PASS: save uses the authenticated candidate bearer and public anon key.");
  console.log("PASS: successful save links to applications and saved opportunities; no provider submission occurred.");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
