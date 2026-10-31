#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/0090_n15_date_only_deadline_support.sql", "utf8");
const endpoint = fs.readFileSync("supabase/functions/n15-candidate-opportunities/index.ts", "utf8");
const page = fs.readFileSync("apps/web/src/app/candidate/opportunity-matches/page.tsx", "utf8");

assert.match(migration, /ADD COLUMN IF NOT EXISTS closes_on date/);
assert.match(migration, /CHECK \(closes_on IS NULL OR closes_at IS NULL\)/);
assert.match(migration, /VALIDATE CONSTRAINT opportunity_deadlines_close_representation_check/);
assert.match(migration, /opportunity_deadlines_programme_date_only_idx/);
assert.doesNotMatch(migration, /INSERT\s+INTO\s+public\.(?:opportunity_providers|opportunity_programmes|opportunity_deadlines|external_source_observations)/i,
  "generic date-only schema migration must not seed or publish any opportunity");

assert.match(endpoint, /select\("deadline_ref,opens_at,closes_at,closes_on,deadline_status,evidence_refs,timezone"\)/);
assert.match(endpoint, /timeZone: "Africa\/Johannesburg"/);
assert.match(endpoint, /\.formatToParts\(now\)/);
assert.match(endpoint, /const localToday = `\$\{part\("year"\)\}-\$\{part\("month"\)\}-\$\{part\("day"\)\}`/);
assert.match(endpoint, /item\.closes_on >= localToday/);
assert.match(endpoint, /item\.closes_at/);
assert.match(endpoint, /date-only semantics instead of inventing a timestamp/);

assert.match(page, /function formatDateOnly\(value: string\): string/);
assert.match(page, /const match = \/\^\(\\d\{4\}\)-\(\\d\{2\}\)-\(\\d\{2\}\)\$\/\.exec\(value\)/);
assert.match(page, /date only; closing time not stated/);
assert.doesNotMatch(page, /new Date\(\`\$\{item\.deadline\.closes_on\}T12:00:00Z\`\)/,
  "date-only calendar values must not be converted to synthetic timestamps");

function localTodayInSouthAfrica(instant) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date(instant));
  const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function formatDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

assert.equal(localTodayInSouthAfrica("2026-11-05T21:59:59.000Z"), "2026-11-05",
  "one second before South African midnight remains the previous local date");
assert.equal(localTodayInSouthAfrica("2026-11-05T22:00:00.000Z"), "2026-11-06",
  "UTC 22:00 is South African 00:00 for the next calendar date");
const today = localTodayInSouthAfrica("2026-11-05T22:00:00.000Z");
assert.equal("2026-11-06" >= today, true, "closing date on local today remains visible");
assert.equal("2026-11-05" >= today, false, "deadline before local today is expired");
assert.equal(formatDateOnly("2026-11-06"), "06/11/2026");
assert.equal(formatDateOnly("unknown"), "unknown");

console.log("PASS N15 date-only deadline schema, South African local-date cutoff, and date-only UI (" +
  "migration safety + 2 midnight-boundary cases + current/expired dates + calendar rendering)");
