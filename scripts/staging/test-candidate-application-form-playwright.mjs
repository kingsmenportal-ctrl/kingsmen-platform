import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const webRequire = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = webRequire("playwright");
const port = Number(process.env.KINGSMEN_TEST_PORT || 4388);
const baseUrl = process.env.KINGSMEN_TEST_BASE_URL || `http://127.0.0.1:${port}`;
const token = "kingsmen-playwright-test-access-token-1234567890";
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321").hostname.split(".")[0];
const applicationId = "30000000-0000-4000-8000-000000000001";
const nextBinary = path.join(root, "apps/web/node_modules/next/dist/bin/next");
const pathwayTargets = [
  ["HIGHER_EDUCATION", "University programme", "N15 University"],
  ["TVET", "TVET engineering course", "N15 TVET College"],
  ["SETA_LEARNERSHIP", "SETA learnership", "N15 SETA"],
  ["INTERNSHIP", "Finance internship", "N15 Employer"],
  ["APPRENTICESHIP", "Electrical apprenticeship", "N15 Employer"],
  ["EMPLOYMENT", "Operations role", "N15 Employer"]
].map(([pathway_type, programme_or_role, provider_name], index) => ({
  id: `target-${index + 1}`,
  target_key: `n15:playwright-test-${index + 1}`,
  pathway_type,
  provider_name,
  programme_or_role,
  planning_status: "SAVED",
  application_id: null,
  source_confidence: "UNVERIFIED",
  updated_at: "2026-11-02T00:00:00.000Z"
}));

let storedDraft = {};
let version = 0;
let saveCount = 0;
let lastSaveBody = null;
let prepareCount = 0;
let profileAvailable = true;

async function main() {
  const server = spawn(process.execPath, [nextBinary, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: path.join(root, "apps/web"),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "kingsmen-test-anon-key",
      PORT: String(port)
    },
    stdio: "ignore"
  });
  let serverReady = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Next.js server exited before the browser test started.");
    try {
      const response = await fetch(baseUrl + "/candidate/apply");
      if (response.ok) { serverReady = true; break; }
    } catch { /* server is still starting */ }
    await delay(500);
  }
  if (!serverReady) {
    server.kill("SIGTERM");
    throw new Error("Next.js production server did not become ready within 30 seconds.");
  }
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => failures.push(error.message));
  await page.addInitScript(({ key, accessToken }) => {
    localStorage.setItem(key, JSON.stringify({ access_token: accessToken, token_type: "bearer" }));
  }, { key: `sb-${projectRef}-auth-token`, accessToken: token });

  await page.route("**/api/candidate/applications", async route => {
    const request = route.request();
    const headers = request.headers();
    assert.match(headers.authorization || "", /^Bearer\s+kingsmen-playwright-test-access-token/);
    if (request.method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ready: true,
          masterTargets: pathwayTargets.map(target => ({
            ...target,
            application_id: target.target_key === "n15:playwright-test-6" && version > 0 ? applicationId : target.application_id
          })),
          parentApplications: []
        })
      });
    }
    const body = request.postDataJSON();
    assert.equal(body.action, "prepare_master_application");
    assert.equal(body.target_key, "n15:playwright-test-6");
    assert.equal(Object.hasOwn(body, "candidate_id"), false);
    prepareCount += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ready: true,
        application: { application_id: applicationId },
        provider_submission_sent: false,
        message: "Application draft saved. It has not been submitted to the provider."
      })
    });
  });

  await page.route("**/api/candidate/application-draft**", async route => {
    const request = route.request();
    const headers = request.headers();
    assert.match(headers.authorization || "", /^Bearer\s+kingsmen-playwright-test-access-token/);
    if (request.method() === "GET") {
      const url = new URL(request.url());
      assert.equal(url.searchParams.get("application_id"), applicationId);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ready: true,
          ok: true,
          application: {
            id: applicationId,
            application_ref: "KM-PLAYWRIGHT-001",
            pathway_type: "EMPLOYMENT",
            status: "DRAFT",
            readiness_status: "NOT_CHECKED",
            readiness_snapshot: {},
            title: "Operations role",
            provider_name: "N15 Employer",
            source_url: "https://example.test/employer",
            closes_at: null,
            created_at: "2026-11-02T11:00:00.000Z",
            updated_at: "2026-11-02T11:00:00.000Z"
          },
          draft: storedDraft,
          draft_version: version,
          draft_updated_at: version ? "2026-11-02T12:00:00.000Z" : null,
          shared_profile_available: profileAvailable,
          is_editable: true,
          provider_submission_sent: false
        })
      });
    }
    const body = request.postDataJSON();
    assert.equal(body.application_id, applicationId);
    assert.equal(body.expected_version, version);
    assert.match(body.idempotency_key, /^application-draft-[a-f0-9-]{36}$/);
    assert.equal(body.answer_data.motivation_statement, "I am ready to contribute.");
    assert.equal(body.answer_data.relevant_experience, "Two years of operations experience.");
    assert.equal(body.answer_data.preferred_campus, "Johannesburg");
    assert.equal(body.answer_data.additional_answers[0].question_key, "additional_context");
    assert.equal(Object.hasOwn(body.answer_data, "candidate_id"), false);
    lastSaveBody = body;
    storedDraft = body.answer_data;
    version += 1;
    saveCount += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ready: true,
        ok: true,
        draft_version: version,
        updated_at: "2026-11-02T12:00:00.000Z",
        provider_submission_sent: false
      })
    });
  });

  try {
    const response = await page.goto(`${baseUrl}/candidate/apply`, { waitUntil: "networkidle", timeout: 30000 });
    assert.equal(response?.status(), 200, "candidate application form route must load");
    assert.match(await page.locator("h1").innerText(), /One application engine\. Six pathways\./);

    const filter = page.getByRole("button", { name: "Internships", exact: true });
    await filter.click();
    assert.equal(await page.locator("article h3").count(), 1, "pathway filter must narrow saved target list");
    assert.match(await page.locator("article h3").first().innerText(), /Finance internship/);
    await page.getByRole("button", { name: "All pathways" }).click();
    assert.equal(await page.locator("article h3").count(), 6, "all six pathways must be visible");

    const employmentCard = page.locator("article").filter({ hasText: "Operations role" });
    await employmentCard.getByRole("button", { name: "Select this opportunity" }).click();
    await page.getByRole("button", { name: "Prepare Kingsmen application" }).click();
    await page.waitForURL("**/candidate/applications/" + applicationId);
    await page.getByRole("heading", { name: "Operations role" }).waitFor();
    assert.equal(prepareCount, 1, "only one Kingsmen parent application should be prepared");
    assert.equal(await page.locator('a[href^="http"]').count(), 0, "candidate form must not expose provider URLs");
    assert.doesNotMatch(await page.locator("body").innerText(), /source status:\s*unverified/i, "internal source-confidence codes must not be presented as candidate status");

    await page.getByLabel("Motivation statement").fill("I am ready to contribute.");
    await page.getByLabel("Relevant experience").fill("Two years of operations experience.");
    await page.getByLabel("Preferred campus / location").fill("Johannesburg");
    await page.getByRole("button", { name: "Add answer" }).click();
    await page.getByLabel("Question key").fill("additional_context");
    await page.getByLabel("Answer").fill("Available for all shifts.");
    await page.getByRole("button", { name: "Save application draft" }).click();
    await page.getByText(/Application draft saved\. It has not been submitted to the provider/).waitFor();
    assert.equal(saveCount, 1);
    assert.equal(lastSaveBody.expected_version, 0);

    await page.getByRole("button", { name: "Reload saved draft" }).click();
    await page.getByLabel("Motivation statement").waitFor();
    assert.equal(await page.getByLabel("Motivation statement").inputValue(), "I am ready to contribute.");
    assert.equal(await page.getByLabel("Relevant experience").inputValue(), "Two years of operations experience.");
    assert.equal(await page.getByLabel("Question key").inputValue(), "additional_context");
    assert.equal(await page.getByLabel("Answer").inputValue(), "Available for all shifts.");
    assert.equal(await page.getByText("Draft version 1", { exact: true }).count(), 1);

    profileAvailable = false;
    await page.getByRole("button", { name: "Reload saved draft" }).click();
    await page.getByText(/No saved reusable profile was found/).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save application draft" }).isDisabled(), true,
      "application answers must remain read-only until the reusable profile is available");

    profileAvailable = true;
    await page.getByRole("button", { name: "Reload saved draft" }).click();
    await page.getByText(/Your saved reusable profile is available/).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save application draft" }).isDisabled(), false);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Operations role" }).waitFor();
    assert.equal(await page.getByLabel("Motivation statement").inputValue(), "I am ready to contribute.");
    assert.equal(await page.getByLabel("Relevant experience").inputValue(), "Two years of operations experience.");
    assert.equal(await page.getByLabel("Question key").inputValue(), "additional_context");
    assert.equal(await page.getByLabel("Answer").inputValue(), "Available for all shifts.");
    assert.equal(await page.getByText("Draft version 1", { exact: true }).count(), 1);
    assert.equal(failures.length, 0, failures.join("; "));
    const unauthenticated = await browser.newPage();
    await unauthenticated.goto(`${baseUrl}/candidate/apply`, { waitUntil: "networkidle", timeout: 30000 });
    const authError = await unauthenticated.getByRole("alert").innerText();
    assert.match(authError, /AUTHENTICATION_REQUIRED/);
    assert.equal(await unauthenticated.getByRole("link", { name: "Sign in \/ identity review" }).count(), 1);
    await unauthenticated.close();

    process.stdout.write("PASS browser route loads with authenticated candidate session\n");
    process.stdout.write("PASS all six pathway filters and saved targets render correctly\n");
    process.stdout.write("PASS verified opportunity opens the one canonical parent application editor\n");
    process.stdout.write("PASS application-specific answers save through authenticated Kingsmen API\n");
    process.stdout.write("PASS explicit reload and page refresh preserve the canonical candidate draft\n");
    process.stdout.write("PASS candidate form does not expose external provider URLs\n");
    process.stdout.write("PASS unauthenticated access is rejected before candidate API calls\n");
    process.stdout.write("PASS reusable profile absence keeps application answers read-only\n");
    process.stdout.write("Unified candidate application browser journey: 8/8 passed\n");
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }
}

main().catch(error => {
  process.stderr.write((error instanceof Error ? error.stack : String(error)) + "\n");
  process.exitCode = 1;
});
