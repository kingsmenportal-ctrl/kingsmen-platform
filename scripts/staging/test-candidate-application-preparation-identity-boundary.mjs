import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const edge = read("supabase/functions/candidate-application-preparation/index.ts");
const capacityMigration = read("db/migrations/0107_application_capacity_entitlements_20261101.sql");

const lookupStart = edge.indexOf("const identityCheckedAt = new Date().toISOString();");
const lookupEnd = edge.indexOf('if(p.action==="save_n15_match")', lookupStart);
assert.ok(lookupStart >= 0 && lookupEnd > lookupStart,
  "Candidate identity must be verified before any save or load action is dispatched.");
const identityBlock = edge.slice(lookupStart, lookupEnd);

assert.match(identityBlock, /candidate_auth_identity_links/);
assert.match(identityBlock, /select\("candidate_id,verified_at,verified_by"\)/);
assert.match(identityBlock, /eq\("supabase_user_id",authData\.user\.id\)/);
assert.match(identityBlock, /eq\("link_status","VERIFIED"\)/);
assert.match(identityBlock, /not\("verified_at","is",null\)/);
assert.match(identityBlock, /not\("verified_by","is",null\)/);
assert.match(identityBlock, /lte\("verified_at",identityCheckedAt\)/,
  "A future-dated verification must not authorise candidate access.");
assert.match(identityBlock, /order\("id",\{ascending:true\}\)\.limit\(2\)/,
  "The service must fetch up to two links so duplicate verified identities are detected.");
assert.match(identityBlock, /identityLinks\.length!==1/,
  "Zero or multiple valid verified links must fail closed.");
assert.match(identityBlock, /Date\.parse\(identityLinks\[0\]\.verified_at\)>Date\.parse\(identityCheckedAt\)/);
assert.match(identityBlock, /typeof identityLinks\[0\]\?\.verified_by!=="string"/);
assert.match(identityBlock, /code:"IDENTITY_NOT_VERIFIED"/);
assert.doesNotMatch(identityBlock, /limit\(1\)\.maybeSingle\(\)/,
  "Do not silently select the first of multiple verified identity links.");

assert.match(identityBlock, /admin\.from\("candidates"\)/);
assert.match(identityBlock, /eq\("is_active",true\)\.maybeSingle\(\)/,
  "Only active candidate records may enter candidate preparation.");
assert.match(identityBlock, /code:"ACTIVE_CANDIDATE_REQUIRED"/);

const helperStart = capacityMigration.indexOf("CREATE OR REPLACE FUNCTION kingsmen_security.current_verified_kingsmen_candidate_id()");
assert.ok(helperStart >= 0, "The canonical database identity helper must exist in the reviewed migration source.");
const helperEnd = capacityMigration.indexOf("$function$;", helperStart);
assert.ok(helperEnd > helperStart, "Could not isolate the canonical identity helper.");
const helper = capacityMigration.slice(helperStart, helperEnd);
for (const invariant of [
  /l\.supabase_user_id=v_uid/,
  /l\.link_status='VERIFIED'/,
  /l\.verified_at IS NOT NULL/,
  /l\.verified_at<=statement_timestamp\(\)/,
  /l\.verified_by IS NOT NULL/,
  /IF v_count<>1 THEN RETURN NULL; END IF;/
]) {
  assert.match(helper, invariant, "The Edge Function must match every database helper identity invariant.");
}

const prepareRpcStart = capacityMigration.indexOf("CREATE OR REPLACE FUNCTION public.prepare_candidate_application_from_master_target");
assert.ok(prepareRpcStart >= 0,
  "Parent application preparation must use the canonical database-owned identity boundary.");
const prepareRpcEnd = capacityMigration.indexOf("$function$;", prepareRpcStart);
const prepareRpc = capacityMigration.slice(prepareRpcStart, prepareRpcEnd);
assert.match(prepareRpc, /current_verified_kingsmen_candidate_id\(\)/);
assert.match(prepareRpc, /verified_by IS NOT NULL/);
assert.match(prepareRpc, /FOR SHARE;/);
assert.match(prepareRpc, /c\.is_active IS TRUE/);

console.log("CANDIDATE_APPLICATION_PREPARATION_IDENTITY_BOUNDARY_PASSED");
console.log("- Exactly one verified identity link is required.");
console.log("- Reviewer, verification timestamp and non-future timestamp are checked.");
console.log("- Inactive candidate records are rejected before read/save actions.");
console.log("- Parent-application RPC retains the matching database helper and row-lock boundary.");
