#!/usr/bin/env node
import { readFileSync } from "node:fs";

const migrationPath = "db/migrations/0009_n10_finance_rls_lockdown.sql";
const failures = [];
const migration = readFileSync(migrationPath, "utf8");

const requiredTables = [
  "finance_plan_catalog",
  "finance_orders",
  "finance_invoices",
  "payfast_payment_intents",
  "finance_payments",
  "payfast_itn_receipts",
  "payfast_signature_audit",
  "finance_refund_requests",
  "finance_ledger_entries",
  "payment_evidence_ledger"
];

function check(name, passed) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failures.push(name);
}

for (const table of requiredTables) {
  check(`finance table included: ${table}`, migration.includes(`'${table}'`));
}
check("RLS explicitly enabled", /enable row level security/i.test(migration));
check("legacy permissive all-policy is dropped", /drop policy if exists %I on public.%I/i.test(migration) && /policy_name := table_name || '_all'/i.test(migration));
check("replacement policy is service_role only", /for all to service_role using \(true\) with check \(true\)/i.test(migration));
check("anon and authenticated table privileges are revoked", /revoke all on table public.%I from anon, authenticated/i.test(migration));
check("backend role receives explicit table privileges", /grant select, insert, update, delete on table public.%I to service_role/i.test(migration));
check("migration is transactional", /begin;/i.test(migration) && /commit;/i.test(migration));
check("migration contains no open-ended client policy", !/create policy[^;]+for all using (true) with check (true);/i.test(migration));

console.log(JSON.stringify({
  schema: "kingsmen.finance-rls-boundary.v1",
  passed: failures.length === 0,
  checks: requiredTables.length + 7,
  failures,
  migrationPath
}, null, 2));

if (failures.length) process.exit(1);
