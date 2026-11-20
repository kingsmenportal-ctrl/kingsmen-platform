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
const checkedAt = "2026-11-20T10:00:00.000Z";
const evidenceUrl = "https://dhet.example/opportunities/ci-source-one";
const authorityUrl = "https://dhet.example/";
const decisions = [];
let queueForbidden = false;

const observationA = {
  observation_ref: "n15_ci_source_001",
  authority_ref: "AUTH-DHET-CI",
  source_url: evidenceUrl,
  source_title: "CI official-source candidate one",
  sector: "HIGHER_EDUCATION",
  observed_claim: "Automated discovery found a link. Opening status, deadline and eligibility remain unverified.",
  source_confidence: "HIGH",
  observation_status: "NEEDS_REVIEW",
  observed_at: checkedAt,
  last_checked_at: checkedAt,
  stale_after: checkedAt,
  evidence_refs: [authorityUrl],
  review_reason: "AUTOMATED_LINK_DISCOVERY_ONLY; HUMAN_VERIFICATION_REQUIRED",
  authority: {
    authority_ref: "AUTH-DHET-CI",
    authority_name: "CI Department Authority",
    authority_type: "GOVERNMENT_REGISTER",
    base_url: authorityUrl,
    sector_scope: ["HIGHER_EDUCATION", "TVET"],
    active: true,
    confidence_band: "OFFICIAL_VERIFIED"
  }
};
const observationB = {
  ...observationA,
  observation_ref: "n15_ci_source_002",
  source_url: "https://inactive.example/opportunities/source-two",
  source_title: "CI source awaiting correction",
  authority_ref: "AUTH-INACTIVE-CI",
  authority: {
    authority_ref: "AUTH-INACTIVE-CI",
    authority_name: "Inactive CI Authority",
    authority_type: "GOVERNMENT_REGISTER",
    base_url: "https://inactive.example/",
    sector_scope: ["EMPLOYMENT"],
    active: false,
    confidence_band: "NEEDS_REVIEW"
  },
  evidence_refs: ["https://inactive.example/"]
};
let observations = [observationA, observationB];
const recentReviews = [];

function queuePayload() {
  return {
    status: "OK",
    mode: "READ_ONLY_REVIEW_QUEUE",
    count: observations.length,
    observations,
    recent_reviews: [...recentReviews],
    recent_runs: [{
      run_ref: "n15_ci_ingestion_001",
      status: "COMPLETED",
      sources_checked: 1,
      sources_succeeded: 1,
      observations_created: observations.length,
      observations_updated: 0,
      observations_skipped: 0,
      started_at: checkedAt,
      finished_at: checkedAt
    }],
    safety: {
      observation_status_is_not_programme_open_status: true,
      review_queue_writes_disabled: true,
      programme_deadline_eligibility_and_fee_records_not_created: true,
      candidate_facing_opportunities_published: 0,
      reviewer_authorization_required: true
    }
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
      const response = await fetch(baseUrl + "/founder/opportunity-sources/");
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
  const corsHeaders = {
    "access-control-allow-origin": "http://127.0.0.1:3000",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, content-type",
    "access-control-max-age": "0",
    "cache-control": "no-store"
  };

  await page.route("**/functions/v1/n15-source-review-queue", async route => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (queueForbidden) {
      await route.fulfill({
        status: 403,
        json: { status: "FORBIDDEN", reason: "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED", message: "An active, authorised platform reviewer role is required." },
        headers: corsHeaders
      });
      return;
    }
    assert.equal(request.method(), "GET");
    assert.ok(request.headers().authorization?.startsWith("Bearer "));
    assert.ok(request.headers().apikey);
    await route.fulfill({ status: 200, json: queuePayload(), headers: corsHeaders });
  });

  await page.route("**/functions/v1/n15-source-review-decision", async route => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    assert.equal(request.method(), "POST");
    assert.ok(request.headers().authorization?.startsWith("Bearer "));
    assert.ok(request.headers().apikey);
    const body = request.postDataJSON();
    decisions.push(body);
    const current = observations.find(item => item.observation_ref === body.observation_ref);
    assert.ok(current, "only a queued observation can be decided");
    assert.ok(["APPROVE_OFFICIAL_SOURCE", "REJECT_SOURCE", "MARK_SOURCE_STALE"].includes(body.decision));
    assert.ok(Array.isArray(body.evidence_refs));
    assert.ok(body.evidence_refs.length >= 1 && body.evidence_refs.length <= 12);
    assert.ok(body.evidence_refs.every(value => value.startsWith("https://")));
    assert.ok(String(body.review_reason).trim().length >= 5);

    if (body.decision === "APPROVE_OFFICIAL_SOURCE") {
      assert.equal(body.reviewed_official_source, true);
      assert.ok(body.evidence_refs.some(value => value.startsWith("https://dhet.example/")));
    }
    observations = observations.filter(item => item.observation_ref !== body.observation_ref);
    recentReviews.unshift({
      review_ref: "n15_ci_review_" + String(decisions.length),
      target_type: "SOURCE",
      target_ref: body.observation_ref,
      review_status: body.decision === "APPROVE_OFFICIAL_SOURCE" ? "APPROVED" : body.decision === "REJECT_SOURCE" ? "REJECTED" : "STALE",
      source_confidence_before: current.source_confidence,
      source_confidence_after: body.decision === "APPROVE_OFFICIAL_SOURCE" ? "OFFICIAL_VERIFIED" : body.decision === "REJECT_SOURCE" ? "LOW" : current.source_confidence,
      review_reason: body.review_reason,
      decision_notes: body.decision_notes,
      evidence_refs: body.evidence_refs,
      created_at: checkedAt,
      reviewed_at: checkedAt
    });
    await route.fulfill({
      status: 200,
      json: {
        status: "OK",
        ok: true,
        review_ref: recentReviews[0].review_ref,
        observation_ref: body.observation_ref,
        observation_status: body.decision === "APPROVE_OFFICIAL_SOURCE" ? "VERIFIED" : body.decision === "REJECT_SOURCE" ? "REJECTED" : "STALE",
        published_opportunities_created: false,
        programme_opening_status_changed: false,
        deadline_status_changed: false,
        eligibility_rules_changed: false,
        message: "Source review recorded. This decision does not publish an opportunity or approve its deadline, eligibility, fees, or provider outcome."
      },
      headers: corsHeaders
    });
  });

  await page.goto(baseUrl + "/founder/opportunity-sources/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Opportunity source review" }).waitFor();
  const first = page.locator("article").filter({ hasText: "CI official-source candidate one" });
  await first.getByLabel("Review reason", { exact: true }).fill("The page is controlled by the declared authority.");
  await first.getByLabel("Decision notes (optional)", { exact: true }).fill("I inspected the candidate link and confirmed the host.");
  await first.getByRole("checkbox").check();
  await first.getByRole("button", { name: "Approve official source" }).click();
  await page.getByRole("status").filter({ hasText: "This decision does not publish an opportunity" }).waitFor();
  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].decision, "APPROVE_OFFICIAL_SOURCE");
  assert.equal(decisions[0].observation_ref, observationA.observation_ref);
  assert.equal(decisions[0].reviewed_official_source, true);
  await page.getByText("CI source awaiting correction").waitFor();

  const second = page.locator("article").filter({ hasText: "CI source awaiting correction" });
  await second.getByLabel("Review reason", { exact: true }).fill("The authority registration needs correction before recommendation.");
  await second.getByRole("button", { name: "Reject source" }).click();
  await page.getByRole("status").filter({ hasText: "This decision does not publish an opportunity" }).waitFor();
  assert.equal(decisions.length, 2);
  assert.equal(decisions[1].decision, "REJECT_SOURCE");
  assert.equal(decisions[1].reviewed_official_source, false);
  await page.getByText("No observations awaiting review").waitFor();
  assert.equal(recentReviews.length, 2);
  assert.ok(recentReviews.every(item => item.target_type === "SOURCE"));

  // Unauthorized queue access exposes no decisions or mutation controls.
  queueForbidden = true;
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("alert").filter({ hasText: "authorised platform reviewer role is required" }).waitFor();
  assert.equal(decisions.length, 2);

  console.log("PASS: reviewer UI loads an authorized queue and records approve/reject decisions");
  console.log("PASS: approval requires explicit attestation and official-host evidence");
  console.log("PASS: UI explicitly separates source verification from opportunity publication");
  console.log("PASS: unauthorized reviewer receives an error and no decision request is sent");
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill("SIGTERM");
}
