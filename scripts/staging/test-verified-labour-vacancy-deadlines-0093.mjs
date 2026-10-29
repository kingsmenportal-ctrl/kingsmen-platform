#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(path.join(process.cwd(), "db/migrations/0093_seed_verified_labour_vacancy_deadlines_20261030.sql"), "utf8");
const lower = migration.toLowerCase();

const checks = [
  [lower.startsWith("-- 0093:"), "migration version is explicit"],
  [lower.includes("begin;") && lower.includes("commit;"), "source refresh is transactional"],
  [lower.includes("if (now() at time zone 'africa/johannesburg')::date > date '2026-10-30'"), "expired vacancy migration fails closed"],
  [migration.includes("if v_count <> 6 then"), "expected population is guarded"],
  [migration.includes("'labour_hr4_26_10_02ho_2026'"), "Senior State Accountant record is targeted by stable key"],
  [migration.includes("'labour_hr4_4_8_190_2026'"), "four-post BCEA Inspector record is targeted by stable key"],
  [migration.includes("'labour_hr4_4_8_192_2026'"), "BCEA Inspector record is targeted by stable key"],
  [migration.includes("'labour_hr4_4_8_193_2026'"), "Assistant Director Labour Activation record is targeted by stable key"],
  [migration.includes("'labour_hr4_4_8_194_2026'"), "Client Service Officer record is targeted by stable key"],
  [migration.includes("'labour_hr4_4_9_29_2026'"), "Administration Officer record is targeted by stable key"],
  [migration.includes("'HR4/26/10/02HO'") && migration.includes("'HR4/4/8/192'") && migration.includes("'HR4/4/8/194'"), "official reference numbers are stored"],
  [migration.includes("senior-state-accountant-financial-reporting-%283%29"), "official accountant detail page is used"],
  [migration.includes("bcea-inspector-%28x4-posts%29-%284%29"), "official four-post BCEA detail page is used"],
  [migration.includes("administration-officer-employer-service"), "official employer-service detail page is used"],
  [migration.includes("source_confidence_band = 'A'") && migration.includes("verification_status = 'VERIFIED'"), "seed requires and records high-confidence verified data"],
  [migration.includes("'official_closing_20261030'") && migration.includes("'CLOSING'") && migration.includes("date '2026-10-30'"), "closing date is represented as a typed deadline"],
  [migration.includes("'OFFICIAL_LISTING_ONLY'") && migration.includes("cut-off time not inferred"), "two list-only sources do not fabricate detailed cut-off times"],
  [migration.includes("'2026-10-29T18:00:00Z'"), "source-check timestamp and review date are explicit"],
  [migration.includes("on conflict (programme_id, deadline_key) do update"), "migration is idempotent by stable programme/deadline key"],
  [migration.includes("verification_scope") && migration.includes("candidate eligibility"), "source verification is not misrepresented as candidate eligibility"],
  [migration.includes("where p.programme_key = v.programme_key") && migration.includes("p.metadata->>'closing_date' = '2026-10-30'"), "writes match existing keyed data and expected close-date snapshot"],
  [migration.includes("closing-date evidence verification failed"), "post-write row count is asserted"],
  [!lower.includes("delete from public.route_programmes") && !lower.includes("drop table"), "migration contains no destructive route/table operation"],
];

for (const [passed, message] of checks) assert.ok(passed, message);
console.log(`PASS official vacancy deadline migration contract (${checks.length} assertions)`);
