import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const webRequire = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = webRequire("playwright");
const port = Number(process.env.KINGSMEN_TEST_PORT || 4388);
const baseUrl = process.env.KINGSMEN_TEST_BASE_URL || \`http://127.0.0.1:\${port}\`;
const token = "kingsmen-playwright-test-access-token-1234567890";
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321").hostname.split(".")[0];
const applicationId = "30000000-0000-4000-8000-000000000001";
const pathwayTargets = [
  ["HIGHER_EDUCATION", "University programme", "N15 University"],
  ["TVET", "TVET engineering course", "N15 TVET College"],
  ["SETA_LEARNERSHIP", "SETA learnership", "N15 SETA"],
  ["INTERNSHIP", "Finance internship", "N15 Employer"],
  ["APPRENTICESHIP", "Electrical apprenticeship", "N15 Employer"],
  ["EMPLOYMENT", "Operations role", "N15 Employer"]
].map(([pathway_type, programme_or_role, provider_name], index) => ({
  id: \`target-\${index + 1}\`,
  target_key: \`n15:playwright-test-\${index + 1}\`,
  pathway_type,
  provider_name,
  programme_or_role,
  planning_status: "SAVED",
  application_id: null,
  source_confidence: "HUMAN_VERIFIED",
  updated_at: "2026-11-02T00:00:00.000Z"
}));

let storedDraft = {};
let version = 0;
let saveCount = 0;
let lastSaveBody = null;
let prepareCount = 0;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => failures.push(error.message));
  await page.addInitScript(({ key, accessToken }) => {
    localStorage.setItem(key, JSON.stringify({ access_token: accessToken, token_type: "bearer" }));
  }, { key: \`sb-\${projectRef}-auth-token\`, accessToken: token });

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
        provider_submission_sent: false
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
            title: "Operations role",
            provider_name: "N15 Employer",
            closes_at: null
          },
          draft: storedDraft,
          draft_version: version,
          draft_updated_at: version ? "2026-11-02T12:00:00.000Z" : null,
          shared_profile_available: true,
          is_editable: true,
          provider_submission_sent: false
        })
      });
    }
    const body = request.postDataJSON();
    assert.equal(body.application_id, applicationId);
    assert.equal(body.expected_version, version);
    assert.match(body.idempotency_key, /^kma-[a-f0-9]{32}$/);
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
    const response = await page.goto(\`\${baseUrl}/candidate/apply\`, { waitUntil: "networkidle", timeout: 30000 });
    assert.equal(response?.status(), 200, "candidate application form route must load");
    assert.match(await page.locator("h1").innerText(), /One application form\. Six pathways\./);

    const filter = page.getByRole("button", { name: "Internships", exact: true });
    await filter.click();
    assert.equal(await page.locator("article h3").count(), 1, "pathway filter must narrow saved target list");
    assert.match(await page.locator("article h3").first().innerText(), /Finance internship/);
    await page.getByRole("button", { name: "All pathways" }).click();
    assert.equal(await page.locator("article h3").count(), 6, "all six pathways must be visible");

    const employmentCard = page.locator("article").filter({ hasText: "Operations role" });
    await employmentCard.getByRole("button", { name: "Select this opportunity" }).click();
    await page.getByRole("button", { name: "Prepare Kingsmen application draft" }).click();
    await page.getByRole("heading", { name: "Operations role" }).waitFor();
    assert.equal(prepareCount, 1, "only one Kingsmen parent application should be prepared");
    assert.equal(await page.locator('a[href^="http"]').count(), 0, "candidate form must not expose provider URLs");

    await page.getByLabel("Motivation statement").fill("I am ready to contribute.");
    await page.getByLabel("Relevant experience").fill("Two years of operations experience.");
    await page.getByLabel("Preferred campus / location").fill("Johannesburg");
    await page.getByLabel("Additional information").fill("Available for all shifts.");
    await page.getByRole("button", { name: "Save application draft" }).click();
    await page.getByText(/Application draft saved to your authenticated Kingsmen account/).waitFor();
    assert.equal(saveCount, 1);
    assert.equal(lastSaveBody.expected_version, 0);

    await page.getByRole("button", { name: "Reload saved draft" }).click();
    await page.getByLabel("Motivation statement").waitFor();
    assert.equal(await page.getByLabel("Motivation statement").inputValue(), "I am ready to contribute.");
    assert.equal(await page.getByLabel("Relevant experience").inputValue(), "Two years of operations experience.");
    assert.equal(await page.locator("text=Draft version 1").count(), 1);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "All pathways" }).waitFor();
    assert.equal(await page.locator("article h3").count(), 6);
    assert.equal(failures.length, 0, failures.join("; "));
    process.stdout.write("PASS browser route loads with authenticated candidate session\n");
    process.stdout.write("PASS all six pathway filters and saved targets render correctly\n");
    process.stdout.write("PASS verified opportunity opens exactly one Kingsmen parent draft\n");
    process.stdout.write("PASS application-specific answers save through authenticated Kingsmen API\n");
    process.stdout.write("PASS explicit reload and page refresh preserve the candidate draft\n");
    process.stdout.write("PASS candidate form does not expose external provider URLs\n");
    process.stdout.write("Unified candidate application browser journey: 6/6 passed\n");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  process.stderr.write((error instanceof Error ? error.stack : String(error)) + "\n");
  process.exitCode = 1;
});
