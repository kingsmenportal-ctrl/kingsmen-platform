#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const docPath = 'docs/security/KINGSMEN_REVIEW_TABLE_ACCESS_PROOF.md';
const doc = existsSync(docPath) ? readFileSync(docPath, 'utf8') : '';
const tables = [
  'candidate_identity_review_audit',
  'candidate_identity_review_requests',
  'candidate_private_document_reviews'
];
const failures = [];
if (!doc) failures.push({ issue: 'missing live privilege proof document', path: docPath });
for (const token of [
  'anon SELECT',
  'authenticated SELECT',
  'service_role SELECT',
  'policy count',
  'anon_can_select=false',
  'authenticated_can_select=false',
  'service_role_can_select=true',
  'policy_count=0',
  'prove reviewer identity authorization',
  'separate release gates'
]) {
  if (!doc.toLowerCase().includes(token.toLowerCase())) failures.push({ issue: 'missing documented proof contract', token });
}
for (const table of tables) {
  if (!doc.includes(table)) failures.push({ issue: 'table absent from documented contract', table });
}

function collectSqlFiles(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectSqlFiles(path));
    else if (entry.isFile() && path.endsWith('.sql')) result.push(path);
  }
  return result;
}
const grantOrPolicyPatterns = tables.map((table) => ({
  table,
  grant: new RegExp('grant\\s+[^;]*select[^;]*\\bon\\s+(?:table\\s+)?(?:public\\.)?' + table + '\\b[^;]*\\bto\\s+(?:public|anon|authenticated)\\b', 'i'),
  policy: new RegExp('create\\s+policy\\s+[^;]*\\bon\\s+(?:public\\.)?' + table + '\\b[^;]*\\bto\\s+(?:public|anon|authenticated)\\b', 'i')
}));
for (const path of collectSqlFiles('db/migrations')) {
  const sql = readFileSync(path, 'utf8');
  for (const pattern of grantOrPolicyPatterns) {
    if (pattern.grant.test(sql)) failures.push({ issue: 'direct SELECT grant to public-facing role detected', table: pattern.table, path });
    if (pattern.policy.test(sql)) failures.push({ issue: 'direct RLS policy to public-facing role detected', table: pattern.table, path });
  }
}
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Private Review Table Access Contract',
  status: failures.length ? 'REVIEW_TABLE_ACCESS_CONTRACT_FAILED' : 'REVIEW_TABLE_ACCESS_SOURCE_VALIDATED',
  passed: failures.length === 0,
  tablesChecked: tables.length,
  migrationFilesScanned: collectSqlFiles('db/migrations').length,
  liveDatabaseQueriedByThisValidator: false,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
