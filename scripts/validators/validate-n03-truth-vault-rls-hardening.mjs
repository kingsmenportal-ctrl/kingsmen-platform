#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const migrationPath = "db/migrations/0002_n03_truth_vault_rls_hardening.sql";
const tables = ["candidates","candidate_profiles","applications","idempotency_keys","command_log","workflow_runs","evidence_ledger","audit_events","source_authorities","route_sources","worker_heartbeats","dead_letter_queue","approval_requests","system_runtime_config"];
const migration = readFileSync(join(root, migrationPath), "utf8");
const failures = [];
for (const table of tables) {
  const policy = new RegExp(`CREATE\\s+POLICY\\s+service_role_all_${table}\\s+ON\\s+public\\.${table}\\s+FOR\\s+ALL\\s+TO\\s+service_role\\s+USING\\s*\\(true\\)\\s+WITH\\s+CHECK\\s*\\(true\\)\\s*;`, "i");
  if (!policy.test(migration)) failures.push(`Missing role-scoped fail-closed policy for ${table}`);
}
if (!/^BEGIN;/m.test(migration) || !/COMMIT;\\s*$/m.test(migration)) failures.push("Migration must be wrapped in BEGIN/COMMIT.");
if (/CREATE\\s+POLICY[\\s\\S]{0,200}FOR\\s+ALL\\s+USING\\s*\\(true\\)(?![\\s\\S]{0,40}TO\\s+service_role)/i.test(migration)) failures.push("Found a permissive policy without an explicit service_role target.");
const report = {
  schema: "kingsmen.n03.rls-hardening-source-validation.v1",
  result: failures.length ? "N03_RLS_HARDENING_SOURCE_BLOCKED" : "N03_RLS_HARDENING_SOURCE_VALIDATED",
  passed: failures.length === 0,
  productionReady: false,
  tablesChecked: tables.length,
  runtimeRlsProofExecuted: false,
  migrationApplied: false,
  failures,
  nextAction: "Review and apply the migration through the approved staging migration process, then test anonymous/authenticated denial and service-role access."
};
const reportPath = join(root, "reports/api/n03-rls-hardening-source-validation-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\\n");
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
