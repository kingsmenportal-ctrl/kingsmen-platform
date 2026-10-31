import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const migration = read("db/migrations/0101_n15_verified_opportunity_promotion.sql");
const promotion = read("supabase/functions/n15-opportunity-promotion/index.ts");
const policy = read("supabase/functions/_shared/n15-promotion-policy.mjs");
const tests = read("scripts/staging/test-n15-verified-source-promotion.mjs");
const packageJson = JSON.parse(read("package.json"));

const checks = [
  ["promotion migration is transaction-wrapped", /^begin;/i.test(migration.trim()) && /commit;\s*$/.test(migration)],
  ["promotion RPC is SECURITY DEFINER with fixed search_path", /security definer/i.test(migration) && /set search_path = pg_catalog, public, auth, pg_temp/i.test(migration)],
  ["promotion RPC denies browser roles and grants service_role only", /revoke all on function public\.promote_n15_verified_opportunity_listing\(jsonb\) from public, anon, authenticated/i.test(migration) && /grant execute on function public\.promote_n15_verified_opportunity_listing\(jsonb\) to service_role/i.test(migration)],
  ["database promotion rechecks narrow evidence-verifier roles", /role_code in \('EVIDENCE_VERIFIER', 'PLATFORM_ADMIN'\)/.test(migration) && !/IDENTITY_REVIEWER/.test(migration)],
  ["database promotion locks and validates the current source observation", /pg_advisory_xact_lock/.test(migration) && /external_source_observations/.test(migration) && /opportunity_source_authorities/.test(migration)],
  ["stale or future source observations fail closed", /last_checked_at < v_now - interval '24 hours'/.test(migration) && /stale_after <= v_now/.test(migration)],
  ["promotion requires observation reference and SHA-256 evidence", /N15_REVIEW_EVIDENCE_HASH_AND_OBSERVATION_REQUIRED/.test(migration) && /\^sha256:\[0-9a-f\]\{64\}\$/.test(migration)],
  ["programme link must exactly match the reviewed source observation", /N15_PROGRAMME_LINK_MUST_MATCH_REVIEWED_OBSERVATION/.test(migration)],
  ["provider, programme, optional deadline and eligibility use idempotent upserts", (migration.match(/on conflict \(/g) || []).length >= 4],
  ["private college accreditation is an explicit promotion gate", /PRIVATE_PROVIDER_ACCREDITATION_NOT_VERIFIED/.test(migration) && /v_provider_sector = 'PRIVATE_COLLEGE'/.test(migration)],
  ["programme is candidate-safe only when reviewer verifies it OPEN and provider-safe", /v_programme_safe := v_opening_status = 'OPEN' and v_provider_safe/.test(migration)],
  ["expired deadlines are persisted as STALE rather than CONFIRMED", /v_deadline_status := 'STALE'/.test(migration) && /v_deadline_status := 'CONFIRMED'/.test(migration)],
  ["source, provider, programme, deadline and eligibility decisions are audited", ["'SOURCE'","'PROVIDER'","'PROGRAMME'","'DEADLINE'","'ELIGIBILITY'"].every(x => migration.includes(x)) && /opportunity_verification_reviews/.test(migration)],
  ["promotion deliberately does not create candidate matches", !/insert into public\.candidate_opportunity_matches/i.test(migration) && /candidate_matches_created', 0/.test(migration)],
  ["edge function verifies the user JWT and a permitted reviewer grant", /auth\.getUser\(bearer\)/.test(promotion) && /platform_reviewers/.test(promotion) && /REVIEW_ROLES = \["EVIDENCE_VERIFIER", "PLATFORM_ADMIN"\]/.test(promotion)],
  ["shared policy blocks IP literals and local hosts", /isLiteralOrLocalHost/.test(policy) && /localhost/.test(policy) && /host\.includes/.test(policy)],
  ["edge function checks the registered HTTPS authority and exact programme URL", /canonicalHttpsUrl as canonicalHttps/.test(promotion) && /withinAuthority\(sourceUrl, authorityUrl\)/.test(promotion) && /programmeUrl\.toString\(\) !== sourceUrl\.toString\(\)/.test(promotion)],
  ["edge source refetch rejects redirects and limits streamed evidence bytes", /redirect: "manual"/.test(promotion) && /MAX_SOURCE_BYTES/.test(promotion) && /getReader\(\)/.test(promotion) && /reader\.cancel\(\)/.test(promotion)],
  ["edge writes through the single transactional promotion RPC only", /admin\.rpc\(\s*"promote_n15_verified_opportunity_listing"/.test(promotion) && !/\.insert\(|\.upsert\(|\.update\(/.test(promotion)],
  ["shared promotion policy tests are included in the N15 release test chain", /n15:promotion:check/.test(packageJson.scripts.test) && /verified-promotion-policy-tests/.test(tests)],
  ["helper and regression tests exclude live network and candidate data", /liveNetworkUsed: false/.test(tests) && /liveDatabaseTouched: false/.test(tests) && /candidateDataUsed: false/.test(tests)]
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify({
  schema: "kingsmen.n15.verified-source-promotion-validation.v1",
  status: failures.length ? "FAILED" : "PASSED",
  passedChecks: checks.length - failures.length,
  totalChecks: checks.length,
  failures,
  liveDatabaseTouched: false,
  liveSourceFetched: false,
  migrationApplied: false
}, null, 2));
assert.equal(failures.length, 0, "N15 verified source promotion contract failed.");
