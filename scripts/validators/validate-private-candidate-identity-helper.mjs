#!/usr/bin/env node
/**
 * Source guard for the candidate identity RLS helper migration.
 * Run: node scripts/validators/validate-private-candidate-identity-helper.mjs
 *
 * This checks migration intent only; it is not a substitute for live database
 * catalog/privilege checks or candidate isolation tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const migrationPath = path.resolve(
  'supabase/migrations/20261022031206_move_candidate_identity_helper_to_private_schema.sql',
);
const sql = fs.readFileSync(migrationPath, 'utf8').replace(/--[^\n]*/g, ' ').toLowerCase();

const required = [
  [/alter\s+function\s+public\.current_verified_candidate_id\s*\(\)\s+set\s+schema\s+private\b/, 'moves the helper out of public'],
  [/revoke\s+all\s+on\s+schema\s+private\s+from\s+public\s*,\s*anon\b/, 'revokes private-schema access from PUBLIC and anon'],
  [/grant\s+usage\s+on\s+schema\s+private\s+to\s+authenticated\b/, 'preserves authenticated RLS policy resolution'],
  [/revoke\s+all\s+on\s+function\s+private\.current_verified_candidate_id\s*\(\)\s+from\s+public\s*,\s*anon\b/, 'revokes helper execution from PUBLIC and anon'],
  [/grant\s+execute\s+on\s+function\s+private\.current_verified_candidate_id\s*\(\)\s+to\s+authenticated\b/, 'grants execution only to the policy role that needs it'],
  [/comment\s+on\s+function\s+private\.current_verified_candidate_id\s*\(\)/, 'documents internal-only purpose'],
];

const failures = required
  .filter(([pattern]) => !pattern.test(sql))
  .map(([, description]) => description);

assert.equal(
  /create\s+or\s+replace\s+function\s+public\.current_verified_candidate_id/.test(sql),
  false,
  'migration must not recreate the helper in the exposed public schema',
);
assert.deepEqual(failures, [], failures.join('; '));
console.log(`PASS: candidate identity helper migration source guard (${required.length} required controls)`);
