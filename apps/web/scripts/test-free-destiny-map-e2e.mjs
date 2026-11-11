import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const server = spawn("npm", ["run", "start:e2e"], {
  cwd: root,
  env: { ...process.env, PORT: "4173", HOSTNAME: "127.0.0.1" },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js server exited early.\n${serverOutput}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  if (!ready) throw new Error(`Next.js server did not become ready.\n${serverOutput}`);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(`${baseUrl}/free-destiny-map`, { waitUntil: "networkidle" });
  if (!response || response.status() !== 200) {
    throw new Error(`Free Destiny Map returned HTTP ${response?.status() ?? "no response"}`);
  }
  await page.locator("#current-stage").selectOption({ label: "Grade 12 / Matric" });
  await page.locator("#province").selectOption({ label: "Gauteng" });
  await page.locator("#route-interest").selectOption({ label: "University" });
  await page.locator("#biggest-blocker").selectOption({ label: "I am worried about deadlines" });

  await page.getByRole("button", { name: /generate my readiness checklist/i }).click();
  if (!(await page.getByRole("alert").isVisible())) {
    throw new Error("The preview boundary did not fail closed when its acknowledgement was missing.");
  }

  await page.locator("#intake-boundary-confirmation").check();
  await page.getByRole("button", { name: /generate my readiness checklist/i }).click();
  const preview = page.locator("[data-kingsmen-readiness-preview]");
  await preview.waitFor({ state: "visible" });
  if (!(await preview.getByRole("heading", { name: "Higher-education route" }).isVisible())) {
    throw new Error("The route-specific higher-education checklist was not rendered.");
  }
  if (!(await preview.getByText(/Verify current dates directly with each official provider/i).isVisible())) {
    throw new Error("The deadline blocker guidance was not included.");
  }
  if (pageErrors.length) throw new Error(`Browser runtime errors: ${pageErrors.join("; ")}`);

  console.log(JSON.stringify({
    status: "PASS",
    route: "/free-destiny-map",
    httpStatus: response.status(),
    checks: [
      "page returns HTTP 200",
      "preview acknowledgement is enforced",
      "route-specific checklist renders",
      "blocker-specific guidance renders",
      "no browser runtime errors"
    ]
  }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
