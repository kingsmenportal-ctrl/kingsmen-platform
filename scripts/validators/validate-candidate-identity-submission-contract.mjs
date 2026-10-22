import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const path = "supabase/migrations/20261022050000_candidate_identity_review_submission_rpc.sql";
const sql = readFileSync(path, "utf8");
const checks = [
  ["authenticated identity derived from auth.uid()", /v_user_id uuid := auth\.uid\(\)/i],
  ["no caller-supplied user id parameter", /submit_candidate_identity_review\s*\(\s*p_candidate_reference text\s*,\s*p_claimant_name text\s*,\s*p_claimant_message text\s*\)/i],
  ["security definer has empty search_path", /security definer\s+set search_path to ''/i],
  ["anonymous execute revoked", /revoke all on function public\.submit_candidate_identity_review\(text, text, text\)\s+from public, anon/i],
  ["authenticated execute granted", /grant execute on function public\.submit_candidate_identity_review\(text, text, text\)\s+to authenticated, service_role/i],
  ["duplicate open request blocked", /request_status in \('PENDING', 'NEEDS_INFORMATION'\)[\s\S]*?already has an open identity review request/i],
  ["initial audit event is written", /insert into public\.candidate_identity_review_audit[\s\S]*?'SUBMITTED'[\s\S]*?'PENDING'/i],
  ["does not verify identity or grant access", /does not verify identity or grant candidate access/i]
];
let failed = 0;
for (const [name, pattern] of checks) {
  const pass = pattern.test(sql);
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`);
  if (!pass) failed++;
}
assert.equal(failed, 0, `${failed} candidate identity submission contract check(s) failed`);
console.log(`PASS all ${checks.length} candidate identity submission contract checks`);
