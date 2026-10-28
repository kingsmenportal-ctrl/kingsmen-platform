#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const edge = fs.readFileSync(path.join(root, "supabase/functions/payfast-sandbox/index.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20261028173000_payfast_entitlement_activation_and_catalog_guard.sql"), "utf8");

assert.match(edge, /idempotency_key,plan_code&candidate_ref=/, "checkout idempotency lookup must read the bound plan");
assert.match(edge, /prior\.plan_code !== plan\.plan_code/, "edge handler must reject reuse across different plans");
assert.match(edge, /idempotency_key_reused_for_different_plan/, "edge handler must expose a stable conflict code");
assert.match(migration, /v_existing\.plan_code <> p_order->>'plan_code'/, "database RPC must enforce plan binding independently");
assert.match(migration, /raise exception 'idempotency_key_reused_for_different_plan'/, "database RPC must fail closed on cross-plan reuse");
assert.match(migration, /revoke all on function public\.payfast_create_sandbox_checkout\(jsonb,jsonb,jsonb,jsonb\) from public,anon,authenticated/i, "checkout RPC must remain service-role-only");
assert.match(migration, /grant execute on function public\.payfast_create_sandbox_checkout\(jsonb,jsonb,jsonb,jsonb\) to service_role/i, "checkout RPC must grant service role");
assert.match(migration, /p_amount_fee_cents \+ p_amount_net_cents <> p_amount_gross_cents/, "settlement must reconcile fee + net to gross");
assert.match(migration, /candidate_service_orders[\s\S]*?'PENDING_PAYMENT'[\s\S]*?payfast_settle_sandbox_payment/, "checkout and settlement must include candidate service orders");
assert.match(migration, /revoke all on function public\.payfast_settle_sandbox_payment\([\s\S]*?from public,anon,authenticated/i, "settlement RPC must remain service-role-only");
console.log("PASS: PayFast atomic checkout contract regression checks (plan-bound idempotency, least privilege, reconciliation, entitlement path).");
