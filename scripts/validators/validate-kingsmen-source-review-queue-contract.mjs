import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const edge = readFileSync("supabase/functions/n15-source-review-queue/index.ts", "utf8");
const page = readFileSync("apps/web/src/app/operator/opportunities/review/page.tsx", "utf8");
const ingestionPage = readFileSync("apps/web/src/app/operator/opportunities/ingestion/page.tsx", "utf8");

assert.ok(edge.includes("auth.auth.getUser(token)"), "Review queue must validate the caller session.");
assert.ok(edge.includes("platform_reviewers"), "Review queue must require an authorised platform reviewer.");
assert.ok(edge.includes("ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED") || edge.includes("role_code"), "Review queue must fail closed if reviewer role is absent.");
assert.ok(edge.includes("external_source_observations"), "Review queue must read source observations.");
assert.ok(edge.includes("opportunity_verification_reviews"), "Review queue must read recent source-review history.");
assert.ok(edge.includes("n15_ingestion_runs"), "Review queue must read ingestion run history.");
assert.ok(!/\.from\([^)]*\)\.(insert|update|upsert|delete)\s*\(/.test(edge), "Review queue must remain read-only.");
assert.ok(edge.includes("READ_ONLY_REVIEW_QUEUE"), "Review queue response must mark itself read-only.");
assert.ok(edge.includes("observation_status_is_not_programme_open_status"), "Review queue must separate source observations from programme status.");
assert.ok(edge.includes("KINGSMEN_PORTAL_ORIGINS"), "Review queue must use an explicit origin configuration.");
assert.ok(!edge.includes('"Access-Control-Allow-Origin": "*"'), "Review queue must not use wildcard CORS.");
assert.ok(page.includes("getKingsmenSupabaseAccessToken"), "Review UI must use the shared project-scoped session helper.");
assert.ok(page.includes("n15-source-review-queue"), "Review UI must call the authenticated review queue endpoint.");
assert.ok(page.includes("read-only"), "Review UI must communicate its read-only boundary.");
assert.ok(page.includes("does not establish that a programme is open"), "Review UI must not misrepresent source discovery as an open programme.");
assert.ok(ingestionPage.includes("/operator/opportunities/review"), "Ingestion operator must link to the review queue.");

console.log("Kingsmen N15 read-only source review queue contract passed.");
