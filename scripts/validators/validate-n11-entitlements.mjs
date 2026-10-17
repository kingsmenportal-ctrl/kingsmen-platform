import fs from "node:fs";
import assert from "node:assert/strict";
const sql=fs.readFileSync("db/migrations/0066_n11_service_fulfilment_entitlements.sql","utf8");
for(const needle of [
 "candidate_entitlements","candidate_entitlement_events","UNIQUE",
 "n11_hold_entitlement_for_order","n11_grant_entitlement","n11_transition_entitlement",
 "VERIFIED_PROVIDER_WEBHOOK","PAYMENT_CONFIRMED","PAYFAST","server_validation",
 "merchant_reference","provider_status","amount_minor","entitlement_snapshot",
 "REVOKE ALL PRIVILEGES ON TABLE","FROM PUBLIC, anon, authenticated, service_role",
 "entitlement events are immutable","BEFORE UPDATE OR DELETE",
 "REVOKE ALL ON FUNCTION public.n11_grant_entitlement",
 "GRANT EXECUTE ON FUNCTION public.n11_grant_entitlement"
]) assert.ok(sql.includes(needle),"N11 migration missing safety contract: "+needle);
assert.match(sql,/UNIQUE \(order_id\)/);
assert.match(sql,/grant_idempotency_key text NOT NULL UNIQUE/);
assert.match(sql,/idempotency_key text NOT NULL UNIQUE/);
assert.match(sql,/status <> 'ACTIVE' OR \(financial_event_id IS NOT NULL AND granted_at IS NOT NULL\)/);
assert.match(sql,/revoked entitlement cannot be reactivated/);
console.log("N11 entitlement validator passed: verified-payment gate, idempotency, holds, revocation, privilege boundary and immutable events.");
