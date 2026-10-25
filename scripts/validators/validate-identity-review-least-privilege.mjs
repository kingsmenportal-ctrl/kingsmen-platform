#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const paths = [
  'supabase/migrations/20261025120000_identity_review_least_privilege_role.sql',
  'supabase/migrations/20261025121500_identity_review_role_code_constraint.sql',
  'supabase/migrations/20261025123000_identity_review_audit_actor_role.sql'
];
const sql = paths.map((path) => fs.readFileSync(path, 'utf8')).join('\\n').replace(/--[^\n]*/g, ' ').toLowerCase();
const required = [
  [/alter\\s+table\\s+public\\.platform_reviewers/, 'updates reviewer role registry constraint'],
  [/platform_reviewers_role_code_check/, 'replaces reviewer role-code constraint'],
  [/candidate_identity_review_audit_actor_role_check/, 'replaces audit actor-role constraint'],
  [/identity_reviewer'::text/, 'allows the dedicated role in schema constraints'],
  [/create\s+or\s+replace\s+function\s+public\.decide_candidate_identity_review\s*\(/, 'replaces the live decision function'],
  [/r\.role_code\s*=\s*'identity_reviewer'/, 'requires the dedicated identity-review role'],
  [/r\.is_active\s*=\s*true/, 'requires active reviewer grant'],
  [/r\.revoked_at\s+is\s+null/, 'rejects revoked reviewer grant'],
  [/where\s+public_ref\s*=\s*trim\(p_candidate_reference\)/, 'uses exact candidate public reference'],
  [/v_link_count\s*>\s*1/, 'detects conflicting identity links'],
  [/if\s+v_existing\.supabase_user_id\s*<>\s*v_request\.supabase_user_id\s+or\s+v_existing\.candidate_id\s*<>\s*v_candidate\.id/, 'rejects mismatched existing link'],
  [/if\s+p_decision\s*=\s*'approved'/, 'creates or verifies a link only in the approval branch'],
  [/insert\s+into\s+public\.candidate_auth_identity_links/, 'persists approved identity link'],
  [/insert\s+into\s+public\.candidate_identity_review_audit/, 'writes a decision audit event'],
  [/identity_reviewer',\s*p_decision/, 'records dedicated reviewer role in audit'],
  [/revoke\s+all\s+privileges\s+on\s+function\s+public\.decide_candidate_identity_review\s*\([^;]*\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/, 'revokes direct client execution'],
  [/grant\s+execute\s+on\s+function\s+public\.decide_candidate_identity_review\s*\([^;]*\)\s+to\s+service_role/, 'keeps execution backend-only'],
  [/security\s+definer/, 'retains controlled transaction privilege'],
  [/set\s+search_path\s+to\s+''/, 'pins empty search path']
];
const failures = required.filter(([pattern]) => !pattern.test(sql)).map(([, label]) => label);
assert.deepEqual(failures, [], failures.join('; '));
assert.equal(/r\.role_code\s*=\s*'platform_admin'/.test(sql), false, 'identity decision authorization must not depend on PLATFORM_ADMIN');
console.log(JSON.stringify({
  schema: 'kingsmen.validation-report.v1',
  module: 'Identity Review Least-Privilege Authorization',
  status: 'IDENTITY_REVIEW_AUTHORIZATION_SOURCE_VALIDATED',
  passed: true,
  controlsChecked: required.length + 1,
  liveDatabaseQueriedByThisValidator: false
}, null, 2));
