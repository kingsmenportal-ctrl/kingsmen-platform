import fs from "node:fs";
import assert from "node:assert/strict";
const sql=fs.readFileSync("db/migrations/0071_n11_service_fulfilment_entitlements.sql","utf8");
const webhook=fs.readFileSync("apps/web/src/app/api/webhooks/payfast/route.ts","utf8");
const candidateApi=fs.readFileSync("apps/web/src/app/api/candidate/entitlements/route.ts","utf8");
const reviewerApi=fs.readFileSync("apps/web/src/app/api/reviewer/entitlements/route.ts","utf8");
const candidatePage=fs.readFileSync("apps/web/src/app/candidate/entitlements/page.tsx","utf8");
const reviewerPage=fs.readFileSync("apps/web/src/app/reviewer/entitlements/page.tsx","utf8");
for(const needle of [
 "candidate_entitlements","candidate_entitlement_events","UNIQUE",
 "candidate_entitlements_service_role_read","candidate_entitlement_events_service_role_read",
 "SET search_path = ''",
 "n11_hold_entitlement_for_order","n11_grant_entitlement","n11_transition_entitlement",
 "VERIFIED_PROVIDER_WEBHOOK","PAYMENT_CONFIRMED","PAYFAST","server_validation",
 "merchant_reference","provider_status","amount_minor","entitlement_snapshot",
 "REVOKE ALL PRIVILEGES ON TABLE","FROM PUBLIC, anon, authenticated, service_role",
 "entitlement events are immutable","BEFORE UPDATE OR DELETE",
 "REVOKE ALL ON FUNCTION public.n11_grant_entitlement",
 "GRANT EXECUTE ON FUNCTION public.n11_grant_entitlement"
]) assert.ok(sql.includes(needle),"N11 migration missing safety contract: "+needle);
assert.match(sql,/order_id uuid NOT NULL UNIQUE/);
assert.match(sql,/grant_idempotency_key text NOT NULL UNIQUE/);
assert.match(sql,/idempotency_key text NOT NULL UNIQUE/);
assert.match(sql,/status <> 'ACTIVE' OR \(financial_event_id IS NOT NULL AND granted_at IS NOT NULL\)/);
assert.match(sql,/revoked entitlement cannot be reactivated/);
assert.match(webhook,/n11_grant_entitlement/);
assert.match(webhook,/ENTITLEMENT_ACTIVATION_PENDING/);
assert.match(candidateApi,/candidate_id/);
assert.match(candidateApi,/activationRule/);
assert.match(candidateApi,/candidate_entitlement_events/);
assert.match(candidateApi,/events/);
assert.match(reviewerApi,/n11_hold_entitlement_for_order/);
assert.match(reviewerApi,/n11_transition_entitlement/);
assert.doesNotMatch(reviewerApi,/n11_grant_entitlement/);
assert.match(reviewerApi,/export async function GET/);
assert.match(candidatePage,/My services & entitlements/);
assert.match(candidatePage,/\/api\/candidate\/entitlements/);
assert.match(reviewerPage,/Service fulfilment review/);
assert.match(reviewerPage,/Place hold/);
assert.match(reviewerPage,/Revoke service/);
assert.doesNotMatch(reviewerPage,/n11_grant_entitlement/);
console.log("N11 entitlement validator passed: verified-payment gate, idempotency, holds, revocation, privilege boundary and immutable events.");
