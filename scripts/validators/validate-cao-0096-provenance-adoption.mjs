#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const migrationPath = 'supabase/migrations/20261030150000_reconcile_cao_choice_bridge_0096_schema_drift.sql';
const reportPath = 'reports/security/cao-0096-provenance-validator-latest.json';
const sql = readFileSync(migrationPath, 'utf8');

const required = [
  'CAO_0096_PROVENANCE_RECONCILIATION_FAILED',
  'CAO_0096_PROVENANCE_RECONCILIATION_PASSED',
  'candidate_application_id',
  'cao_choice_items_candidate_parent_fk',
  'cao_choice_items_exactly_one_parent_check',
  'cao_choice_items_legacy_parent_choice_number_uq',
  'cao_choice_items_candidate_parent_choice_number_uq',
  'cao_choice_items_candidate_parent_idx',
  'cao_choice_items client TRUNCATE/REFERENCES/TRIGGER/MAINTAIN grants revoked by 0097',
  "has_table_privilege('anon', 'public.cao_choice_items', 'TRUNCATE')",
  "has_table_privilege('authenticated', 'public.cao_choice_items', 'MAINTAIN')",
  'CAO_CHOICES_UPDATED',
  'list_candidate_cao_parents',
  'get_candidate_cao_choices',
  'save_candidate_cao_choices',
  'current_authenticated_candidate_id()',
  'VERIFIED_CANDIDATE_IDENTITY_REQUIRED',
  'PROFILE_PROCESSING',
  'CAO_PARENT_MUST_BE_AN_OWNED_DRAFT',
  'provider_submission_sent',
  'authenticated',
  'anon',
  'aclexplode',
  'search_path=pg_catalog, public, kingsmen_security',
  'original application provenance remains unknown'
];

const checks = required.map((token) => ({
  name: 'required_contract:' + token,
  passed: sql.includes(token),
}));
const noMutation = !/\b(?:ALTER|CREATE|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\s+(?:TABLE|INDEX|FUNCTION|POLICY|SCHEMA|CONSTRAINT|TRIGGER|INTO|SET|ON|ALL)\b/i.test(sql);
checks.push({ name: 'no_schema_or_data_mutation', passed: noMutation });

const failures = checks.filter((x) => !x.passed);
const report = {
  schema: 'kingsmen.cao-0096-provenance-source-validation.v1',
  status: failures.length ? 'FAILED' : 'PASSED',
  passed: failures.length === 0,
  liveDatabaseTouched: false,
  migrationKind: 'read-only live-schema assertion / provenance reconciliation',
  productionReady: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failures.length,
  failures,
  checks,
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
assert.equal(failures.length, 0, 'CAO 0096 provenance migration must remain assertion-only and explicit.');
