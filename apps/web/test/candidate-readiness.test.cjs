const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const pagePath = path.join(root, "apps/web/src/app/candidate/readiness/page.tsx");
const dashboardPath = path.join(root, "apps/web/src/app/candidate/dashboard/page.tsx");

test("candidate readiness center covers core workflow areas and next actions", () => {
  const page = fs.readFileSync(pagePath, "utf8");
  for (const marker of [
    "Core candidate profile",
    "CV in document vault",
    "Source-backed opportunities",
    "Application preparation packs",
    "Submission evidence",
    "Follow-up discipline",
    "Support blockers",
    "Finance records",
    "Application-stage accuracy",
    "/api/personal-jobs/apply-now",
    "cache: \"no-store\"",
    "credentials: \"same-origin\"",
    "human review",
    "not independently verified",
    "Do not mark an application submitted",
  ]) assert.ok(page.includes(marker), `readiness center missing ${marker}`);
});

test("candidate readiness center is discoverable from candidate dashboard", () => {
  const dashboard = fs.readFileSync(dashboardPath, "utf8");
  assert.match(dashboard, /Readiness & next actions/);
  assert.match(dashboard, /\/candidate\/readiness/);
});


test("readiness checks identity availability, missing pack coverage and application deadline triage", () => {
  const page = fs.readFileSync(pagePath, "utf8");
  for (const marker of [
    "Identity document availability",
    "Closing-date triage",
    "opportunitiesWithoutPacks",
    "closingSoon",
    "pastClosing",
    "SUBMITTED_REPORTED",
    "valid email",
    "authenticity and validity are not verified",
  ]) assert.ok(page.includes(marker), `readiness improvements missing ${marker}`);
  assert.match(page, /new URL\(item\.sourceUrl\)/);
  assert.match(page, /days <= 7/);
});

test("readiness does not treat candidate-reported submission evidence as independently verified", () => {
  const page = fs.readFileSync(pagePath, "utf8");
  assert.match(page, /candidate-reported evidence is not independently verified/);
  assert.match(page, /not independently verified/);
});


test("API readiness excludes identity and submission proof as universal pre-application gates", () => {
  const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
  assert.match(route, /function assessReadiness\(store: Store\)/);
  assert.match(route, /No universal ID or certificate requirement is assumed/);
  assert.match(route, /Document records indicate availability only/);
  assert.match(route, /Requirements are not verified from the employer/);
  assert.match(route, /opportunitiesWithoutPacks/);
  assert.match(route, /readinessAssessment: assessReadiness\(store\)/);
  const scorer = route.slice(route.indexOf("function assessReadiness"), route.indexOf("function buildPack"));
  assert.doesNotMatch(scorer, /hasId|hasProof/);
  assert.match(scorer, /url\.protocol === "https:"/);
  assert.match(scorer, /No submission or outcome verification/);
});


test("document self-review is explicitly candidate-reported and never claims verification", () => {
  const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
  const documentsPage = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/documents/page.tsx"), "utf8");
  assert.match(route, /action === "recordDocumentReview"/);
  assert.match(route, /CANDIDATE_SELF_REVIEW/);
  assert.match(route, /does not verify authenticity, validity, ownership or employer acceptance/);
  assert.match(documentsPage, /Content looks correct/);
  assert.match(documentsPage, /Needs correction/);
  assert.match(documentsPage, /Replace document/);
  assert.match(documentsPage, /Independent verification: not performed/);
});

test("vacancy requirement review records source and explicit unverified status", () => {
  const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
  assert.match(route, /action === "recordRequirementReview"/);
  assert.match(route, /reviewStatus: "CANDIDATE_REVIEWED_NOT_INDEPENDENTLY_VERIFIED"/);
  assert.match(route, /reviewSourceUrl/);
  assert.match(route, /No universal ID or certificate requirement is assumed/);
  assert.match(route, /The source, employer, requirements and candidate assessments have not been independently verified/);
});
