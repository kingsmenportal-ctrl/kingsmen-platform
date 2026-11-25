import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const proposalPath = "scripts/staging/proposals/candidate-application-verified-identity-rpc-alignment.proposal.sql";
const sql = readFileSync(proposalPath, "utf8");
const executable = sql.replace(/^\s*--.*$/gm, "");
const functions = [...executable.matchAll(/CREATE OR REPLACE FUNCTION ([\s\S]*?)AS \$function\$([\s\S]*?)\$function\$/gi)]
  .map((match) => match[0]);

assert.match(sql, /REVIEW PATCH PROPOSAL ONLY - NOT A SUPABASE MIGRATION/);
assert.match(sql, /DO NOT APPLY DIRECTLY TO STAGING OR PRODUCTION/);
assert.ok(!proposalPath.startsWith("db/migrations/"));
assert.ok(!proposalPath.startsWith("database/migrations/"));
assert.ok(!proposalPath.startsWith("supabase/migrations/"));
assert.equal(functions.length, 5, "Exactly five candidate-facing application RPCs must be aligned.");

const requiredNames = [
  "prepare_candidate_application_from_master_target",
  "prepare_candidate_manual_portal_submission",
  "get_candidate_cao_choices",
  "list_candidate_cao_parents",
  "save_candidate_cao_choices"
];
for (const name of requiredNames) {
  assert.ok(functions.some((definition) => definition.includes("FUNCTION public." + name + "(")),
    "Missing proposed RPC replacement: " + name);
}

for (const definition of functions) {
  assert.match(definition, /SECURITY DEFINER/i);
  assert.match(definition, /SET search_path TO 'pg_catalog', 'public', 'kingsmen_security'/i);
  assert.match(definition, /auth\.uid\(\)/i);
  assert.match(definition, /FROM public\.candidate_auth_identity_links/i);
  assert.match(definition, /l\.supabase_user_id = v_auth_user_id/i);
  assert.match(definition, /l\.link_status = 'VERIFIED'/i);
  assert.match(definition, /l\.verified_at IS NOT NULL/i);
  assert.match(definition, /l\.verified_at <= now\(\)/i);
  assert.match(definition, /l\.verified_by IS NOT NULL/i);
  assert.doesNotMatch(definition, /current_authenticated_candidate_id|candidate_accounts|v_link_candidate_id/i,
    "Candidate RPC must not depend on the legacy candidate_accounts identity mapping.");
}

// The SQL proposal must not change privileges, roles, RLS or Auth configuration.
assert.doesNotMatch(executable, /^\s*(?:GRANT|REVOKE|ALTER ROLE|CREATE POLICY|DROP POLICY|ALTER TABLE)[\s\S]*?;/gim);
assert.doesNotMatch(executable, /ENABLE ROW LEVEL SECURITY|DISABLE ROW LEVEL SECURITY/i);

// Preserve the candidate-owned application boundaries and the prior business gates.
const byName = Object.fromEntries(requiredNames.map((name) => [
  name,
  functions.find((definition) => definition.includes("FUNCTION public." + name + "("))
]));
assert.match(byName.prepare_candidate_application_from_master_target, /candidate_id = v_candidate_id/i);
assert.match(byName.prepare_candidate_application_from_master_target, /FOR UPDATE/i);
assert.match(byName.prepare_candidate_application_from_master_target, /PROFILE_PROCESSING/i);
assert.match(byName.prepare_candidate_application_from_master_target, /OFFICIAL_VERIFIED/i);
assert.match(byName.prepare_candidate_application_from_master_target, /'provider_submission_sent', false/i);

assert.match(byName.prepare_candidate_manual_portal_submission, /a\.candidate_id=v_candidate_id/i);
assert.match(byName.prepare_candidate_manual_portal_submission, /FOR UPDATE OF a/i);
assert.match(byName.prepare_candidate_manual_portal_submission, /source_checked_at/i);
assert.match(byName.prepare_candidate_manual_portal_submission, /idempotency_key/i);
assert.match(byName.prepare_candidate_manual_portal_submission, /'provider_submission_sent',false/i);

assert.match(byName.get_candidate_cao_choices, /ca\.candidate_id = v_candidate_id/i);
assert.match(byName.get_candidate_cao_choices, /CAO_PARENT_NOT_AVAILABLE/i);
assert.match(byName.list_candidate_cao_parents, /ca\.candidate_id = v_candidate_id/i);
assert.match(byName.list_candidate_cao_parents, /m\.match_status = 'APPROVED'/i);

assert.match(byName.save_candidate_cao_choices, /PROFILE_PROCESSING/i);
assert.match(byName.save_candidate_cao_choices, /FOR UPDATE/i);
assert.match(byName.save_candidate_cao_choices, /jsonb_array_length\(p_choices\) > 6/i);
assert.match(byName.save_candidate_cao_choices, /CAO_CHOICE_NUMBERS_MUST_BE_UNIQUE/i);
assert.match(byName.save_candidate_cao_choices, /'provider_submission_sent', false/i);

console.log("Candidate verified-identity RPC alignment proposal contract passed: five candidate RPCs use the verified identity-link model; business/security guards remain; no privileges or RLS are changed.");
