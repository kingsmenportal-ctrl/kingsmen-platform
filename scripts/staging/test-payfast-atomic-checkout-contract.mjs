#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const edge = fs.readFileSync(path.join(root, "supabase/functions/payfast-sandbox/index.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20261028173000_payfast_entitlement_activation_and_catalog_guard.sql"), "utf8");

assert.match(edge, /finance_orders\?select=plan_code&order_ref=eq/, "checkout idempotency must resolve plan from the authoritative finance order");
assert.doesNotMatch(edge, /payfast_payment_intents\?select=[^`]*plan_code/, "intent table must not be queried for a nonexistent plan_code column");
assert.match(edge, /prior\.plan_code !== plan\.plan_code/, "edge handler must reject reuse across different plans");
assert.match(edge, /idempotency_key_reused_for_different_plan/, "edge handler must expose a stable conflict code");
assert.match(edge, /response\.ok && \(await response\.text\(\)\)\.trim\(\) === "VALID"/, "ITN must be validated by PayFast sandbox endpoint");
assert.match(edge, /fields\.signature\.toLowerCase\(\), expectedSignature\.toLowerCase\(\)/, "ITN signature must be compared safely");
assert.match(edge, /paymentStatus === "COMPLETE"/, "only complete provider payments may settle");
assert.match(edge, /fields\.merchant_id === Deno\.env\.get\("PAYFAST_MERCHANT_ID"\)/, "ITN merchant ID must match configured merchant");
assert.match(edge, /amountCents === Number\(intent\.amount_cents\)/, "ITN gross amount must match stored intent");
assert.match(edge, /if \(!duplicate\)[\s\S]*?payfast_itn_receipts/, "duplicate ITN must not create another receipt");
assert.match(edge, /rpc\/payfast_settle_sandbox_payment/, "verified ITN must use the atomic settlement RPC");
assert.match(edge, /if \(!accepted \|\| !intent\)/, "invalid ITNs must fail closed before settlement");
assert.match(migration, /select fo\.plan_code into v_existing_plan_code[\s\S]*?fo\.order_ref=v_existing\.order_ref/, "database RPC must resolve existing plan from finance_orders");
assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(v_candidate_ref \|\| ':' \|\| v_idempotency_key, 0\)\)/, "database RPC must serialize concurrent idempotency-key creation");
assert.match(migration, /raise exception 'idempotency_key_reused_for_different_plan'/, "database RPC must fail closed on cross-plan reuse");
assert.match(migration, /revoke all on function public\.payfast_create_sandbox_checkout\(jsonb,jsonb,jsonb,jsonb\) from public,anon,authenticated/i, "checkout RPC must remain service-role-only");
assert.match(migration, /grant execute on function public\.payfast_create_sandbox_checkout\(jsonb,jsonb,jsonb,jsonb\) to service_role/i, "checkout RPC must grant service role");
assert.match(migration, /p_amount_fee_cents \+ p_amount_net_cents <> p_amount_gross_cents/, "settlement must reconcile fee + net to gross");
assert.match(migration, /candidate_service_orders[\s\S]*?'PENDING_PAYMENT'[\s\S]*?payfast_settle_sandbox_payment/, "checkout and settlement must include candidate service orders");
assert.match(migration, /revoke all on function public\.payfast_settle_sandbox_payment\([\s\S]*?from public,anon,authenticated/i, "settlement RPC must remain service-role-only");
console.log("PASS: PayFast atomic checkout contract regression checks (plan-bound idempotency, least privilege, reconciliation, entitlement path).");
