import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.KINGSMEN_PREVIEW_URL ?? "http://127.0.0.1:3000/free-destiny-map/";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const nonGetAppRequests = [];

  const initialResponse = await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(initialResponse?.status(), 200, "Free Destiny Map should return HTTP 200.");
  assert.equal(await page.getByRole("heading", { name: "Start your Kingsmen route discovery." }).count(), 1);

  const storageBefore = await page.evaluate(() => ({
    localStorage: window.localStorage.length,
    sessionStorage: window.sessionStorage.length
  }));

  page.on("request", (request) => {
    if (request.method() === "GET") return;
    if (request.url().startsWith(new URL(baseUrl).origin)) {
      nonGetAppRequests.push({ method: request.method(), url: request.url() });
    }
  });

  await page.getByLabel("Current stage").selectOption({ label: "Grade 12 / Matric" });
  await page.getByLabel("Province").selectOption({ label: "Gauteng" });
  await page.getByLabel("Route interest").selectOption({ label: "University" });
  await page.getByLabel("Biggest blocker").selectOption({ label: "I do not know what to apply for" });
  await page.getByLabel("Readiness goal").fill("Understand the next steps before applying.");
  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: "Build my route preview" }).click();

  const preview = page.locator('[data-kingsmen-route-preview="true"]');
  await preview.waitFor({ state: "visible" });
  const universityText = await preview.innerText();
  assert.ok(universityText.includes("Higher education route"), "University selection should show university guidance.");
  assert.ok(universityText.includes("Grade 12 / Matric"), "Preview should include the selected stage.");
  assert.ok(universityText.includes("Gauteng"), "Preview should include the selected province.");
  assert.ok(universityText.includes("Shortlist institutions"), "Preview should include actionable next steps.");
  assert.ok(universityText.includes("Understand the next steps before applying."), "Preview should include the optional readiness goal.");
  assert.ok(universityText.includes("Kingsmen has not received or saved them"), "Preview must disclose that entries were not transmitted or saved.");

  await page.getByLabel("Route interest").selectOption({ label: "Bursary / funding support" });
  await page.getByRole("button", { name: "Build my route preview" }).click();
  await preview.waitFor({ state: "visible" });
  const fundingText = await preview.innerText();
  assert.ok(fundingText.includes("Funding and support route"), "Changing the route should generate funding-specific guidance.");
  assert.ok(fundingText.includes("funder's own site"), "Funding guidance should direct candidates to verify information on the funder's own site.");

  const storageAfter = await page.evaluate(() => ({
    localStorage: window.localStorage.length,
    sessionStorage: window.sessionStorage.length
  }));
  assert.deepEqual(storageAfter, storageBefore, "Preview must not persist data in localStorage or sessionStorage.");
  assert.deepEqual(nonGetAppRequests, [], "Preview must not submit selections to an application endpoint.");

  // Smoke-test candidate navigation so visible dashboard links do not point to broken routes.
  const origin = new URL(baseUrl).origin;
  const dashboardResponse = await page.goto(new URL("/candidate/dashboard", origin).toString(), { waitUntil: "networkidle" });
  assert.equal(dashboardResponse?.status(), 200, "Candidate dashboard should return HTTP 200.");
  assert.equal(await page.getByRole("heading", { name: "Your opportunity command centre" }).count(), 1);
  for (const pathway of ["Higher Education", "TVET", "SETA programmes & learnerships", "Internships", "Apprenticeships", "Employment"]) {
    const card = page.locator("article[data-gate]").filter({ has: page.getByRole("heading", { name: pathway }) });
    assert.equal(await card.count(), 1, "Candidate dashboard should display the " + pathway + " pathway.");
  }

  const workspaceRoutes = [
    "/candidate/workbench",
    "/candidate/opportunity-matches",
    "/candidate/saved-opportunities",
    "/candidate/documents",
    "/personal-job-desk/application-tracker"
  ];
  for (const route of workspaceRoutes) {
    assert.equal(await page.locator("a[href=\"" + route + "\"]").count(), 1, "Dashboard should expose one navigation link to " + route + ".");
    const response = await page.request.get(new URL(route, origin).toString());
    assert.equal(response.status(), 200, "Dashboard destination " + route + " should return HTTP 200.");
  }

  console.log("Kingsmen browser E2E passed: local-only previews, unchanged storage/no writes, six dashboard pathways, and five workspace destinations returning HTTP 200.");
} finally {
  await browser.close();
}
