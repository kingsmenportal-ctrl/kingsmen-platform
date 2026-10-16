import { readFileSync } from "node:fs";

const migration = readFileSync("db/migrations/0008_n10_finance_payfast.sql", "utf8");
const itnRoute = readFileSync("apps/api/src/finance/payfast-itn-route.ts", "utf8");
const indexMigration = readFileSync("db/migrations/0036_n11_payfast_provider_idempotency.sql", "utf8");

const checks = [
  ["finance orders include expected order fields", /create table if not exists public\.finance_orders[\s\S]*?order_ref text unique not null[\s\S]*?candidate_ref text not null[\s\S]*?order_status text not null[\s\S]*?amount_cents integer not null[\s\S]*?currency text not null/.test(migration)],
  ["payment intents include callback lookup and state fields", /create table if not exists public\.payfast_payment_intents[\s\S]*?intent_ref text unique not null[\s\S]*?order_ref text not null[\s\S]*?merchant_reference text unique not null[\s\S]*?intent_status text not null/.test(migration)],
  ["ITN receipt insert fields exist in schema", /create table if not exists public\.payfast_itn_receipts[\s\S]*?itn_ref text unique not null[\s\S]*?received_payload jsonb[\s\S]*?received_signature text[\s\S]*?idempotency_key text unique not null/.test(migration)],
  ["finance payment fields exist in schema", /create table if not exists public\.finance_payments[\s\S]*?provider_payment_id text[\s\S]*?amount_gross_cents integer not null[\s\S]*?verified boolean not null/.test(migration)],
  ["provider ID migration includes preflight and unique indexes", /Duplicate PayFast provider_payment_id[\s\S]*?create unique index if not exists uq_finance_payments_payfast_provider_payment_id[\s\S]*?create unique index if not exists uq_payfast_itn_receipts_provider_payment_id/.test(indexMigration)],
  ["route records receipts and payment evidence transactionally", /BEGIN[\s\S]*?INSERT INTO public\.payfast_itn_receipts[\s\S]*?INSERT INTO public\.payment_evidence_ledger[\s\S]*?COMMIT/.test(itnRoute)],
  ["duplicate receipt insert prevents further processing", /receiptInsert\.rowCount !== 1[\s\S]*?ROLLBACK[\s\S]*?return/.test(itnRoute)],
  ["server confirmation includes original ITN signature", /Object\.entries\(fields\)/.test(itnRoute) && !/key === ["']signature["']/.test(itnRoute)]
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exitCode = 1;
