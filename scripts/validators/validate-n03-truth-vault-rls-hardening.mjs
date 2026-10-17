#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const migrationPath = "db/migrations/0002_n03_truth_vault_rls_hardening.sql";
const tables = ["candidates","candidate_profiles","applications","idempotency_keys","command_log","workflow_runs","evidence_ledger","audit_events","source_authorities","route_sources","worker_heartbeats","dead_letter_queue","approval_requests","system_runtime_config"];
const migration = readFileSync(join(root, migrationPath), "utf8");
const failures = [];

for (const table of tables) {
  const marker = `CREATE POLICY service_role_all_${table} ON public.${table}`;
  const start = migration.indexOf(marker);
  if (start < 0) {
    failures.push(`Missing policy for ${table}`);
    continue;
  }
  const nextPolicy = migration.indexOf("CREATE POLICY ", start + marker.length);
  const block = migration.slice(start, nextPolicy < 0 ? migration.length : nextPolicy);
  if (!block.includes("FOR ALL TO service_role")) failures.push(`Policy for ${table} is not explicitly scoped to service_role`);
  if (!block.includes("USING (true)") || !block.includes("WITH CHECK (true)")) failures.push(`Policy for ${table} is missing explicit server-role access predicates`);
}
if (!migration.trimStart().startsWith("BEGIN;") || !migration.trimEnd().endsWith("COMMIT;")) {
  failures.push("Migration must be wrapped in BEGIN/COMMIT.");
}
const report = {
  schema: "kingsmen.n03.rls-hardening-source-validation.v1",
  result: failures.length ? "N03_RLS_HARDENING_SOURCE_BLOCKED" : "N03_RLS_HARDENING_SOURCE_VALIDATED",
  passed: failures.length === 0,
  productionReady: false,
  tablesChecked: tables.length,
  runtimeRlsProofExecuted: false,
  migrationApplied: "not_checked_by_source_validator",
  failures,
  nextAction: "Confirm the live migration record, then run role-context tests for anon, authenticated, and server-side service_role access."
};
const reportPath = join(root, "reports/api/n03-rls-hardening-source-validation-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
