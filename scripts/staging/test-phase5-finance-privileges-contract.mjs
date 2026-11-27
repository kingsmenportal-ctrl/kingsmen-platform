import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const migration = await readFile("supabase/migrations/20261127130000_phase5_finance_least_privilege.sql", "utf8");
const fixture = await readFile("scripts/staging/fixtures/phase5-finance-privileges-bootstrap.sql", "utf8");
const test = await readFile("scripts/staging/test-phase5-finance-privileges.sql", "utf8");
for (const table of ["finance_plan_catalog","finance_orders","finance_invoices","payfast_payment_intents","finance_payments","payfast_itn_receipts","payfast_signature_audit","finance_refund_requests","finance_ledger_entries","finance_audit_events"]) {
  assert.ok(migration.includes("public." + table), "migration missing " + table);
  assert.ok(fixture.includes("public." + table), "fixture missing " + table);
  assert.ok(test.includes("'" + table + "'"), "privilege test missing " + table);
}
assert.match(migration, /revoke all privileges on table[\s\S]*from anon, authenticated/i);
assert.match(test, /TRUNCATE/);
assert.match(test, /has_table_privilege\('service_role'/);
console.log("PASS: Phase 5 finance least-privilege migration covers the finance/payment tables and tests non-RLS privileges.");
