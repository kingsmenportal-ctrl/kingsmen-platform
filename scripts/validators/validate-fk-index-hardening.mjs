#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const migrationPath = 'db/migrations/0082_fk_index_hardening.sql';
const migration = readFileSync(migrationPath, 'utf8');
const expected = [
  ['candidate_application_events', 'candidate_id', 'candidate_application_events_candidate_id_idx'],
  ['candidate_application_evidence', 'candidate_id', 'candidate_application_evidence_candidate_id_idx'],
  ['candidate_application_submission_jobs', 'opportunity_id', 'candidate_application_submission_jobs_opportunity_id_idx'],
  ['candidate_applications', 'opportunity_id', 'candidate_applications_opportunity_id_idx'],
  ['candidate_communications', 'outcome_id', 'candidate_communications_outcome_id_idx'],
  ['candidate_follow_up_tasks', 'application_id', 'candidate_follow_up_tasks_application_id_idx'],
  ['candidate_follow_up_tasks', 'communication_id', 'candidate_follow_up_tasks_communication_id_idx'],
  ['candidate_follow_up_tasks', 'outcome_id', 'candidate_follow_up_tasks_outcome_id_idx'],
  ['candidate_identity_review_requests', 'reviewed_by', 'candidate_identity_review_requests_reviewed_by_idx'],
  ['candidate_outcomes', 'evidence_id', 'candidate_outcomes_evidence_id_idx'],
  ['candidate_outcomes', 'opportunity_id', 'candidate_outcomes_opportunity_id_idx'],
  ['candidate_refund_requests', 'order_id', 'candidate_refund_requests_order_id_idx'],
  ['candidate_saved_opportunities', 'opportunity_id', 'candidate_saved_opportunities_opportunity_id_idx'],
  ['candidate_service_orders', 'package_id', 'candidate_service_orders_package_id_idx']
];
const failures = [];
for (const [table, column, index] of expected) {
  const pattern = new RegExp(
    'create\\s+index\\s+if\\s+not\\s+exists\\s+' + index +
    '\\s+on\\s+public\\.' + table + '\\s+using\\s+btree\\s*\\(\\s*' + column + '\\s*\\)',
    'i'
  );
  if (!pattern.test(migration)) failures.push({ table, column, index, issue: 'missing idempotent index definition' });
}
const count = (migration.match(/create\s+index\s+if\s+not\s+exists/gi) ?? []).length;
if (count !== expected.length) failures.push({ issue: 'unexpected index statement count', expected: expected.length, actual: count });
for (const token of ['do $', 'pg_index', 'indisvalid', 'indisready', 'indpred is null', 'raise exception']) {
  if (!migration.toLowerCase().includes(token.toLowerCase())) failures.push({ issue: 'missing postflight/transaction contract', token });
}
if (/grant\s+|create\s+policy|enable\s+row level security|drop\s+table|delete\s+from/i.test(migration)) {
  failures.push({ issue: 'migration contains out-of-scope privilege, RLS, or destructive DML/DDL' });
}
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'FK Index Hardening Migration Source Contract',
  status: failures.length ? 'FK_INDEX_HARDENING_VALIDATION_FAILED' : 'FK_INDEX_HARDENING_SOURCE_VALIDATED',
  passed: failures.length === 0,
  expectedIndexCount: expected.length,
  checkedIndexCount: expected.length - failures.filter((f) => f.issue === 'missing idempotent index definition').length,
  liveDatabaseQueriedByThisValidator: false,
  liveVerificationEvidenceDocumented: true,
  liveStateMustBeVerifiedIndependently: true,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
