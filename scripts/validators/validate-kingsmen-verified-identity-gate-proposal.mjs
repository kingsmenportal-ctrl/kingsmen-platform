import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const proposalPath = "docs/rebuild/proposals/20261119_verified_candidate_identity_gate.md";
const sqlTestPath = "supabase/tests/20261119_verified_candidate_identity_gate.test.sql";
const proposal = readFileSync(proposalPath, "utf8");
const test = readFileSync(sqlTestPath, "utf8");
const sqlBlock = proposal.match(/```sql\n([\s\S]*?)\n```/);
assert.ok(sqlBlock, "Identity-gate proposal must contain a SQL replacement.");
const helper = sqlBlock[1];
assert.ok(helper.includes("CREATE OR REPLACE FUNCTION kingsmen_security.current_authenticated_candidate_id()"));
assert.ok(helper.includes("JOIN public.candidate_auth_identity_links AS link"));
assert.ok(helper.includes("JOIN public.candidates AS candidate"));
assert.ok(helper.includes("link.supabase_user_id = auth.uid()"));
assert.ok(helper.includes("link.link_status = 'VERIFIED'"));
assert.ok(helper.includes("link.verified_at <= pg_catalog.now()"));
assert.ok(helper.includes("link.verified_by ~*"));
assert.ok(!helper.includes("candidate_accounts"), "Proposed helper must not rely on the legacy account table.");

assert.ok(test.startsWith("-- KINGSMEN IDENTITY GATE REGRESSION TEST"));
assert.ok(/Run ONLY against a disposable Supabase database/i.test(test));
assert.ok(/Do NOT run this file against live staging/i.test(test));
assert.match(test, /BEGIN;[\s\S]*SELECT plan\(7\);/);
assert.match(test, /SELECT \* FROM finish\(\);\s*ROLLBACK;\s*$/);
for (const scenario of [
  "pending identity link grants no candidate ID",
  "revoked identity link grants no candidate ID",
  "future-dated verification grants no candidate ID",
  "a user not matching the linked Auth user gets no candidate ID",
  "an Auth user with no identity link gets no candidate ID",
  "verified identity link resolves the linked candidate without relying on candidate_accounts"
]) {
  assert.ok(test.includes(scenario), "Missing identity-gate regression case: " + scenario);
}
assert.ok(!/\b(TRUNCATE|DROP TABLE public\.|DELETE FROM public\.)/i.test(test),
  "Regression test must not contain destructive public-table operations.");
console.log("Kingsmen verified candidate identity-gate proposal and disposable SQL regression contract passed.");
