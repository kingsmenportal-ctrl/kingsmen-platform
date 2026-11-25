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

const server = spawn("npm", ["run", "start"], {
  detached: process.platform !== "win32",
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
      const response = await fetch(baseUrl + "/free-destiny-map/");
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error("Next.js test server did not become ready.\n" + serverOutput);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let intakeApiRequests = 0;
  page.on("request", request => {
    const url = request.url();
    if (url.includes("/functions/v1/") || url.includes("/api/free-destiny-map") || url.includes("/free-destiny-map/intake")) {
      intakeApiRequests += 1;
    }
  });

  await page.goto(baseUrl + "/free-destiny-map/", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Tell us where you want to go." }).waitFor();
  const previewButton = page.getByRole("button", { name: "Preview my readiness path" });
  const preview = page.locator('[data-kingsmen-readiness-preview="ready"]');
  const previewError = page.locator('[data-kingsmen-readiness-preview-error="true"]');

  let requestsBeforePreview = intakeApiRequests;
  await previewButton.click();
  await previewError.waitFor();
  assert.match(await previewError.innerText(), /Select at least one route interest or support need/i);
  assert.equal(await preview.count(), 0, "An empty selection must not generate a fake readiness plan.");
  assert.equal(intakeApiRequests, requestsBeforePreview, "Empty preview must not call the intake API.");

  // These fields belong to the consent-gated intake request, not the local preview.
  await page.locator('input[name="fullName"]').fill("PREVIEW_PRIVATE_NAME_SENTINEL");
  await page.locator('input[name="knownRoute"]').fill("PREVIEW_PRIVATE_GOAL_SENTINEL");
  await page.locator('select[name="province"]').selectOption("Gauteng");
  await page.locator('input[name="routeInterests"][value="higher_education"]').check();
  requestsBeforePreview = intakeApiRequests;
  await previewButton.click();
  await preview.waitFor();
  assert.match(await preview.innerText(), /Higher education/);
  assert.match(await preview.innerText(), /Gauteng/);
  assert.ok(await preview.locator('[data-kingsmen-readiness-preview-steps="true"] li').count() >= 3);
  assert.ok(!(await preview.innerText()).includes("PREVIEW_PRIVATE_NAME_SENTINEL"));
  assert.ok(!(await preview.innerText()).includes("PREVIEW_PRIVATE_GOAL_SENTINEL"));
  assert.equal(intakeApiRequests, requestsBeforePreview, "Readiness preview must not call the intake API.");

  await page.locator('input[name="routeInterests"][value="tvet"]').check();
  await page.locator('input[name="needsFundingHelp"]').check();
  requestsBeforePreview = intakeApiRequests;
  await previewButton.click();
  await page.getByRole("heading", { name: "Your combined readiness path" }).waitFor();
  assert.match(await preview.innerText(), /official funder/i);
  assert.match(await preview.innerText(), /TVET/i);
  assert.equal(intakeApiRequests, requestsBeforePreview, "Combined preview must not call the intake API.");

  assert.equal(await page.getByRole("button", { name: /Submit Free Destiny Map request/ }).count(), 1,
    "The explicit intake submission control must remain separate from preview.");
  assert.equal(intakeApiRequests, 0, "Preview-only interactions must not call the intake API.");

  console.log("PASS: empty selection shows accessible feedback and generates no plan");
  console.log("PASS: higher-education preview renders route steps and selected province");
  console.log("PASS: preview does not expose name or free-text goal fields");
  console.log("PASS: combined TVET and funding selections render combined guidance");
  console.log("PASS: preview clicks do not call the intake API or replace the explicit submit action");
} finally {
  if (browser) {
    await Promise.race([
      browser.close().catch(() => {}),
      delay(5000)
    ]);
  }
  try {
    if (process.platform !== "win32" && server.pid) process.kill(-server.pid, "SIGTERM");
    else server.kill("SIGTERM");
  } catch {}
  if (server.exitCode === null) {
    await Promise.race([
      new Promise(resolve => server.once("exit", resolve)),
      delay(5000)
    ]);
  }
}
