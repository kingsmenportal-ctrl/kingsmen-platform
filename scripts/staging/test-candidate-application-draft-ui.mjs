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
const appA = "11111111-1111-4111-8111-111111111111";
const appB = "22222222-2222-4222-8222-222222222222";
const fakeSupabaseRef = "ci-project";
const timestamp = "2026-11-19T12:00:00.000Z";

function createState(id, status, kingsmenStatus, version, motivation) {
  return {
    application: {
      id,
      application_ref: id === appA ? "CI-DRAFT-A" : "CI-LOCKED-B",
      pathway_type: "EMPLOYMENT",
      status,
      kingsmen_status: kingsmenStatus,
      readiness_status: status === "READY_TO_SUBMIT" ? "READY" : "NOT_CHECKED",
      readiness_snapshot: {},
      title: id === appA ? "CI fixture employment opportunity" : "CI locked application",
      provider_name: "CI fixture provider",
      source_url: null,
      closes_at: null,
      created_at: timestamp,
      updated_at: timestamp
    },
    draft: {
      motivation_statement: motivation,
      relevant_experience: "",
      qualifications_summary: "",
      availability_date: "",
      preferred_campus: "",
      additional_answers: []
    },
    version,
    updatedAt: timestamp,
    handoff: null
  };
}

const states = new Map([
  [appA, createState(appA, "READY_TO_SUBMIT", "Draft", 1, "Saved motivation")],
  [appB, createState(appB, "SUBMITTED_CONFIRMED", "Submitted to Kingsmen", 2, "Locked motivation")]
]);
const providerRequests = [];
const savedRequests = [];
const handoffRequests = [];

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
      const response = await fetch(baseUrl + "/candidate/applications/" + appA);
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
  page.setDefaultTimeout(10_000);
  await page.addInitScript(() => {
    window.__kingsmenConfirmMessages = [];
    window.confirm = message => {
      window.__kingsmenConfirmMessages.push(String(message));
      return false;
    };
  });
  page.setDefaultNavigationTimeout(15_000);
  await page.route("**/functions/v1/**", async route => {
    providerRequests.push(route.request().url());
    await route.abort();
  });
  await page.route("**/api/candidate/application-handoff", async route => {
    const incoming = route.request().postDataJSON();
    handoffRequests.push(incoming);
    const state = states.get(incoming.application_id);
    if (!state || incoming.application_id !== appA || state.version < 1) {
      await route.fulfill({ status: 409, json: { ready: true, ok: false, code: "APPLICATION_DRAFT_REQUIRED" } });
      return;
    }
    state.handoff = {
      submission_ref: "KM-SUB-CI1234567890",
      job_status: "MANUAL_REQUIRED",
      delivery_mode: "EXTERNAL_PORTAL",
      provider_name: "CI fixture provider",
      official_url: "https://provider.example/apply",
      provider_submission_sent: false,
      next_steps: ["Complete the provider portal.", "Upload the provider receipt for authorised review."]
    };
    state.application.status = "MANUAL_ACTION_REQUIRED";
    state.application.kingsmen_status = "Action required";
    await route.fulfill({ status: 200, json: { ready: true, ok: true, ...state.handoff } });
  });
  await page.route("**/api/candidate/application-draft**", async route => {
    const request = route.request();
    const method = request.method();
    let applicationId;
    let incoming = null;
    if (method === "GET") {
      applicationId = new URL(request.url()).searchParams.get("application_id");
    } else if (method === "POST") {
      incoming = request.postDataJSON();
      applicationId = incoming.application_id;
      savedRequests.push(incoming);
    } else {
      await route.fulfill({ status: 405, json: { ready: false, ok: false, error: "Method not supported in test." } });
      return;
    }

    const state = states.get(applicationId);
    if (!state) {
      await route.fulfill({ status: 404, json: { ready: false, ok: false, code: "OWNED_APPLICATION_NOT_FOUND" } });
      return;
    }

    if (method === "POST") {
      if (applicationId !== appA || !["Draft", "Action required"].includes(state.application.kingsmen_status)
        || !["DRAFT", "READINESS_BLOCKED", "READY_FOR_REVIEW", "READY_TO_SUBMIT"].includes(state.application.status)) {
        await route.fulfill({ status: 409, json: { ready: false, ok: false, code: "APPLICATION_DRAFT_IS_LOCKED" } });
        return;
      }
      state.version += 1;
      state.draft = incoming.answer_data;
      state.updatedAt = "2026-11-19T12:05:00.000Z";
      state.application.readiness_status = "NOT_CHECKED";
      state.application.updated_at = state.updatedAt;
      await route.fulfill({
        status: 200,
        json: {
          ready: true,
          ok: true,
          application_id: applicationId,
          draft_version: state.version,
          updated_at: state.updatedAt,
          readiness_recheck_required: true,
          provider_submission_sent: false,
          message: "Fixture draft saved; no provider submission occurred."
        }
      });
      return;
    }

    await route.fulfill({
      status: 200,
      json: {
        ready: true,
        ok: true,
        application: state.application,
        draft: state.draft,
        draft_version: state.version,
        draft_updated_at: state.updatedAt,
        shared_profile_available: true,
        shared_profile_updated_at: timestamp,
        is_editable: ["Draft", "Action required"].includes(state.application.kingsmen_status)
          && ["DRAFT", "READINESS_BLOCKED", "READY_FOR_REVIEW", "READY_TO_SUBMIT"].includes(state.application.status),
        provider_submission_sent: false,
        handoff: state.handoff
      }
    });
  });

  await page.goto(baseUrl + "/candidate/applications/" + appA, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Application draft" }).waitFor();
  await page.getByText("CI fixture employment opportunity").waitFor();
  const motivation = page.getByLabel("Motivation statement");
  assert.equal(await motivation.inputValue(), "Saved motivation");

  await motivation.fill("Updated motivation through the Kingsmen draft editor");
  assert.equal(await page.getByTestId("draft-save-state").textContent(),
    "Unsaved changes. Save your draft before leaving this page.");
  await page.getByRole("button", { name: "Reload saved draft" }).click();
  const confirmMessages = await page.evaluate(() => window.__kingsmenConfirmMessages);
  assert.deepEqual(confirmMessages, [
    "You have unsaved changes. Reloading will discard them. Continue?"
  ], "Reload must ask before discarding unsaved application answers.");
  assert.equal(await motivation.inputValue(), "Updated motivation through the Kingsmen draft editor",
    "Dismissing the discard confirmation must preserve the edited answer.");

  await page.getByRole("button", { name: "Save application draft" }).click();
  await page.getByRole("status").filter({ hasText: "Fixture draft saved; no provider submission occurred." }).waitFor();
  assert.equal(savedRequests.length, 1);
  assert.equal(savedRequests[0].application_id, appA);
  assert.equal(savedRequests[0].expected_version, 1);
  assert.match(savedRequests[0].idempotency_key, /^application-draft-/);
  assert.equal(savedRequests[0].answer_data.motivation_statement, "Updated motivation through the Kingsmen draft editor");
  assert.equal(await page.getByText("Draft version 2", { exact: true }).count(), 1);
  assert.equal(await page.getByText("Draft", { exact: true }).count(), 1);
  assert.equal(await page.getByTestId("draft-save-state").textContent(), "All changes saved.");
  assert.equal(states.get(appA).application.status, "READY_TO_SUBMIT",
    "saving updated answers must preserve the internal workflow state");
  assert.equal(states.get(appA).application.readiness_status, "NOT_CHECKED",
    "saving updated answers must invalidate stale readiness before a new readiness check");

  // Reload must read the server-saved version, not merely preserve the React state.
  await page.getByRole("button", { name: "Reload saved draft" }).click();
  await assert.doesNotReject(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await motivation.inputValue() === "Updated motivation through the Kingsmen draft editor") return;
      await delay(100);
    }
    throw new Error("Reload did not restore the saved motivation answer.");
  });
  assert.equal(await page.getByText("Draft version 2", { exact: true }).count(), 1);

  // The last candidate-side action is a manual, idempotent portal handoff.
  // It is not an external provider submission.
  await page.getByRole("button", { name: "Prepare official portal handoff" }).click();
  await page.getByRole("heading", { name: "Complete the provider's official process" }).waitFor();
  assert.equal(handoffRequests.length, 1);
  assert.equal(handoffRequests[0].application_id, appA);
  const portalLink = page.getByRole("link", { name: "Open official provider portal ↗" });
  assert.equal(await portalLink.getAttribute("href"), "https://provider.example/apply");
  const receiptLink = page.getByRole("link", { name: "Upload provider receipt to this application" });
  const receiptHref = await receiptLink.getAttribute("href");
  assert.ok(receiptHref?.includes("application_id=" + appA));
  assert.ok(receiptHref?.includes("evidence_purpose=PROVIDER_SUBMISSION_RECEIPT"));
  assert.equal(states.get(appA).application.status, "MANUAL_ACTION_REQUIRED");
  assert.equal(states.get(appA).handoff.provider_submission_sent, false);

  // Reload restores the persisted handoff and its application-linked receipt route.
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Complete the provider's official process" }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Open official provider portal ↗" }).getAttribute("href"),
    "https://provider.example/apply");
  assert.equal(await page.getByRole("button", { name: "Prepare official portal handoff" }).count(), 0);

  // A submission-state application is read-only in the candidate editor.
  await page.goto(baseUrl + "/candidate/applications/" + appB, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Application draft" }).waitFor();
  await page.getByText("This application is in a Kingsmen status that does not allow candidate editing. The answer form is read-only.").waitFor();
  await page.getByText("Submitted to Kingsmen", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Save application draft" }).isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Prepare official portal handoff" }).count(), 0);
  assert.equal(savedRequests.length, 1, "locked application must not send a save request");
  assert.deepEqual(providerRequests, [], "draft UI must not make a provider-submission request");

  console.log("PASS: browser loads, saves, reloads and locks candidate application drafts");
  console.log("PASS: candidate-facing statuses remain separate from internal workflow/readiness states");
  console.log("PASS: save uses parent application id, expected version and idempotency key");
  console.log("PASS: manual portal handoff is persisted, idempotent in state, and links provider receipt to its parent application");
  console.log("PASS: no provider-submission endpoint was called");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
}
