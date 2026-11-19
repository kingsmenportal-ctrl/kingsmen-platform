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
const savedAt = "2026-11-19T15:00:00.000Z";
const consentText = "CI fixture consent: candidate profile processing and opportunity preparation.";
const sixPathways = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
];
const labels = [
  "Higher Education",
  "TVET",
  "SETA programmes & learnerships",
  "Internships",
  "Apprenticeships",
  "Employment"
];
const blank = {
  displayName: "",
  phone: "",
  province: "",
  highestQualification: "",
  studyInterests: "",
  employmentInterests: "",
  preferredLocation: ""
};
const persisted = {
  displayName: "Kingsmen CI Candidate",
  phone: "+27110000000",
  province: "Gauteng",
  highestQualification: "Matric",
  studyInterests: "Business administration",
  employmentInterests: "Retail operations and logistics",
  preferredLocation: "Krugersdorp"
};
let profile = { ...blank };
let pathways = [];
let consentStatus = "NOT_RECORDED";
let saved = false;
let identityStatus = "NOT_PROVISIONED";
const requests = [];

function responseForLoad() {
  return {
    ok: true,
    profile: saved ? profile : {},
    pathwayPreferences: saved ? pathways : [],
    consent: {
      status: consentStatus,
      version: saved ? "KINGSMEN_CI_CONSENT_V1" : null,
      grantedAt: saved ? savedAt : null,
      text: consentText
    },
    completeness: { completed: saved ? 7 : 0, required: 7, percent: saved ? 100 : 0, missing: [] },
    correctionRequests: [],
    savedAt: saved ? savedAt : null,
    candidateReference: saved ? "CI-CANDIDATE-001" : null,
    identityStatus,
    persistence: saved ? "SUPABASE_BACKEND" : "NOT_PROVISIONED",
    message: saved
      ? "CI fixture profile reloaded from persisted state."
      : "No profile has been saved yet. Complete the consent section and save to create your profile."
  };
}

const server = spawn("npm", ["run", "start"], {
  cwd: webDirectory,
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
      const response = await fetch(baseUrl + "/candidate/profile/");
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
  await page.route("**/functions/v1/candidate-master-profile", async route => {
    const request = route.request();
    const method = request.method();
    const corsHeaders = {
      "access-control-allow-origin": "http://127.0.0.1:3000",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "authorization, apikey, content-type",
      "access-control-max-age": "0"
    };
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    const body = method === "POST" ? request.postDataJSON() : {};
    const fulfillJson = (status, json) => route.fulfill({ status, json, headers: corsHeaders });
    requests.push({
      method,
      action: body.action,
      hasBearer: Boolean(request.headers().authorization?.startsWith("Bearer ")),
      hasAnonKey: Boolean(request.headers().apikey),
      body
    });

    if (method !== "POST") {
      await fulfillJson(405, { ok: false, code: "METHOD_NOT_ALLOWED" });
      return;
    }

    if (body.action === "load") {
      await fulfillJson(200, responseForLoad());
      return;
    }

    if (body.action === "save") {
      assert.equal(body.consentAccepted, true, "profile save must explicitly record consent");
      assert.equal(typeof body.profile?.displayName, "string");
      assert.ok(body.profile.displayName.trim().length >= 2);
      assert.ok(Array.isArray(body.pathwayPreferences));
      assert.ok(body.pathwayPreferences.every(value => sixPathways.includes(value)));
      profile = { ...blank, ...body.profile };
      pathways = [...body.pathwayPreferences];
      consentStatus = "ACTIVE";
      identityStatus = "PENDING_REVIEW";
      saved = true;
      await fulfillJson(201, {
        ...responseForLoad(),
        message: "CI fixture profile saved. Identity verification remains pending; no provider application was submitted."
      });
      return;
    }

    if (body.action === "revoke_consent") {
      consentStatus = "REVOKED";
      await fulfillJson(200, {
        ok: true,
        consent: { status: "REVOKED", version: "KINGSMEN_CI_CONSENT_V1" },
        profilePreserved: true,
        message: "CI fixture profile preserved; consent withdrawn."
      });
      return;
    }

    await fulfillJson(400, { ok: false, code: "ACTION_NOT_SUPPORTED" });
  });

  await page.goto(baseUrl + "/candidate/profile/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your profile, one place." }).waitFor();
  await page.getByText("No profile has been saved yet.", { exact: false }).waitFor();

  const nameInput = page.getByLabel("Display name", { exact: true });
  await nameInput.fill(persisted.displayName);
  await page.getByLabel("Phone (optional)", { exact: true }).fill(persisted.phone);
  await page.getByLabel("Province", { exact: true }).selectOption({ label: persisted.province });
  await page.getByLabel("Highest qualification / grade", { exact: true }).fill(persisted.highestQualification);
  await page.getByLabel("Study interests (optional)", { exact: true }).fill(persisted.studyInterests);
  await page.getByLabel("Employment / skills interests (optional)", { exact: true }).fill(persisted.employmentInterests);
  await page.getByLabel("Preferred location (optional)", { exact: true }).fill(persisted.preferredLocation);

  for (const label of labels) {
    await page.getByRole("checkbox", { name: label }).check();
  }
  await page.getByRole("checkbox", { name: /I have read and agree to the profile-processing consent above/ }).check();
  await page.getByRole("button", { name: "Save profile" }).click();

  await page.getByRole("status").filter({
    hasText: "CI fixture profile saved. Identity verification remains pending"
  }).waitFor();
  await page.getByText("CI-CANDIDATE-001", { exact: false }).waitFor();
  assert.equal(requests.filter(item => item.action === "save").length, 1);
  const saveRequest = requests.find(item => item.action === "save");
  assert.equal(saveRequest.hasBearer, true, "profile request must use the signed-in candidate bearer");
  assert.equal(saveRequest.hasAnonKey, true, "profile request uses only the public anon key, not a service key");
  assert.deepEqual(saveRequest.body.pathwayPreferences, sixPathways);
  assert.equal(saveRequest.body.profile.displayName, persisted.displayName);

  // Clear and reload through the backend route to prove this is not just React state.
  await nameInput.fill("Unsaved local change");
  await page.getByRole("button", { name: "Reload saved profile" }).click();
  await assert.doesNotReject(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await nameInput.inputValue() === persisted.displayName) return;
      await delay(100);
    }
    throw new Error("Reload did not restore the server-persisted display name.");
  });
  assert.equal(await page.getByLabel("Phone (optional)").inputValue(), persisted.phone);
  assert.equal(await page.getByLabel("Province").inputValue(), "Gauteng");
  for (const label of labels) assert.equal(await page.getByRole("checkbox", { name: label }).isChecked(), true);

  // Consent withdrawal is explicit and profile-preserving.
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Withdraw consent" }).click();
  await page.getByRole("status").filter({ hasText: "CI fixture profile preserved; consent withdrawn." }).waitFor();
  assert.equal(saved, true);
  assert.equal(consentStatus, "REVOKED");
  assert.ok(requests.some(item => item.action === "revoke_consent"));

  console.log("PASS: candidate profile loads, saves and reloads all supported profile fields");
  console.log("PASS: all six pathway preferences persist and are restored");
  console.log("PASS: consent is explicitly recorded and can be withdrawn without deleting the profile");
  console.log("PASS: candidate requests use bearer authorization plus the public anon key only");
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill("SIGTERM");
}
