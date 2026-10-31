import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ingestion = fs.readFileSync(path.join(root, "supabase/functions/n15-source-ingestion/index.ts"), "utf8");
const candidate = fs.readFileSync(path.join(root, "supabase/functions/n15-candidate-opportunities/index.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "db/migrations/0086_n15_live_ingestion_candidate_feed.sql"), "utf8");
const dbeMigration = fs.readFileSync(path.join(root, "db/migrations/0087_n15_date_only_deadlines_dbe_official_vacancies.sql"), "utf8");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/opportunity-matches/page.tsx"), "utf8");

const checks = [
  ["ingestion endpoint requires service role or active reviewer", /callerRole !== "service_role"/.test(ingestion) && /platform_reviewers/.test(ingestion) && /ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED/.test(ingestion)],
  ["source fetch is HTTPS-only", /url\.protocol !== "https:"/.test(ingestion)],
  ["source fetch rejects credentials", /url\.username \|\| url\.password/.test(ingestion)],
  ["source crawling is restricted to authority host", /withinAuthority\(canonical\.hostname\.toLowerCase\(\), authorityHost\)/.test(ingestion)],
  ["source fetch has timeout and HTML size cap", /AbortSignal\.timeout\(8_000\)/.test(ingestion) && /MAX_HTML_BYTES/.test(ingestion)],
  ["discovered links are review-only, not open opportunity claims", /observation_status: "NEEDS_REVIEW"/.test(ingestion) && /published_opportunities_created: 0/.test(ingestion)],
  ["ingestion uses deterministic idempotency key", /onConflict: "observation_ref"/.test(ingestion) && /SHA-256/.test(ingestion)],
  ["ingestion run ledger is auditable and service-role protected", /n15_ingestion_runs/.test(migration) && /to service_role using \(true\)/.test(migration)],
  ["candidate feed verifies bearer session with Supabase Auth", /auth\.getUser\(token\)/.test(candidate)],
  ["candidate feed requires authorised identity link", /link\.link_status === "VERIFIED"/.test(candidate) && /verificationIsAuthorised/.test(candidate)],
  ["candidate feed requires reviewer Auth UUID and verified timestamp", /verified_at,verified_by/.test(candidate) && /AUTH_UUID\.test\(link\.verified_by\)/.test(candidate) && /verifiedAtMs <= Date\.now\(\)/.test(candidate)],
  ["candidate feed requires approved, official, human-reviewed matches", /eq\("match_status", "APPROVED"\)/.test(candidate) && /eq\("source_confidence", "OFFICIAL_VERIFIED"\)/.test(candidate) && /eq\("human_review_required", false\)/.test(candidate)],
  ["candidate feed withholds stale/unverified source observations", /eq\("observation_status", "VERIFIED"\)/.test(candidate) && /eq\("source_confidence", "OFFICIAL_VERIFIED"\)/.test(candidate) && /gt\("stale_after", now\.toISOString\(\)\)/.test(candidate)],
  ["candidate feed rejects future observation/check timestamps", /lte\("observed_at", now\.toISOString\(\)\)/.test(candidate) && /lte\("last_checked_at", now\.toISOString\(\)\)/.test(candidate)],
  ["candidate feed rejects inconsistent timestamps and missing evidence", /observedAtMs > checkedAtMs/.test(candidate) && /staleAfterMs <= checkedAtMs/.test(candidate) && /!Array\.isArray\(observation\.evidence_refs\)/.test(candidate)],
  ["candidate feed keeps CAO and learnership pathway coverage consistent", /CAO: \["HIGHER_EDUCATION", "TVET"\]/.test(candidate) && /LEARNERSHIP: \["SETA_LEARNERSHIPS", "APPRENTICESHIPS"\]/.test(candidate)],
  ["candidate UI covers all six pathways and explicit unknown deadline state", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIPS","INTERNSHIPS","APPRENTICESHIPS","EMPLOYMENT"].every(x => page.includes(x)) && /Not verified/.test(page)],
  ["candidate UI opens only the official opportunity link", /href=\{item\.official_link\}/.test(page) && /rel="noopener noreferrer"/.test(page)],
  ["official DBE batch seeds six specifically referenced employment opportunities", ["DBE/74/2026","DBE/75/2026","DBE/76/2026","DBE/77/2026","DBE/78/2026","DBE/79/2026"].every(x => dbeMigration.includes(x)) && /OFFICIAL_VERIFIED/.test(dbeMigration)],
  ["date-only deadline migration preserves a date without inventing a close timestamp", /ADD COLUMN IF NOT EXISTS closes_on date/.test(dbeMigration) && /closes_at IS NULL/.test(dbeMigration) && /DATE '2026-11-06'/.test(dbeMigration)],
  ["candidate feed accepts a confirmed date-only deadline in South African local date", /closes_on/.test(candidate) && /Africa\\/Johannesburg/.test(candidate) && /item\\.closes_on >= localToday/.test(candidate)],
  ["candidate UI states that date-only deadline has no specified closing time", /date only; closing time not stated/.test(page)],
  ["operator ingestion UI exposes controlled manual run", /Run source ingestion/.test(fs.readFileSync(path.join(root, "apps/web/src/app/operator/opportunities/ingestion/page.tsx"), "utf8")) && /authorised platform reviewer/.test(fs.readFileSync(path.join(root, "apps/web/src/app/operator/opportunities/ingestion/page.tsx"), "utf8"))],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed++;
}
console.log(`N15 live-ingestion contract: ${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exit(1);
