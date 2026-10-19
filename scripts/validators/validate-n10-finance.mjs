import fs from "node:fs";
import assert from "node:assert/strict";
const files={
 migration:"db/migrations/0064_n10_packages_payments_refunds.sql",
 hardening:"db/migrations/0065_n10_finance_privilege_hardening.sql",
 paymentRpc:"db/migrations/0067_n10_atomic_payfast_payment_confirmation.sql",
 refundRpc:"db/migrations/0068_n10_payfast_refund_reconciliation.sql",
 atomicRpc:"db/migrations/0069_n10_atomic_finance_workflows.sql",
 rpcOnly:"db/migrations/0070_n10_finance_rpc_only_writes.sql",
 candidateApi:"apps/web/src/app/api/candidate/finance/route.ts",
 checkoutApi:"apps/web/src/app/api/candidate/finance/payfast/route.ts",
 itnApi:"apps/web/src/app/api/webhooks/payfast/route.ts",
 reviewerApi:"apps/web/src/app/api/reviewer/finance/route.ts",
 refundApi:"apps/web/src/app/api/reviewer/finance/refunds/execute/route.ts",
 payfastRuntime:"apps/web/src/lib/payfast-runtime.ts",
 candidateUi:"apps/web/src/app/candidate/finance/page.tsx",
 reviewerUi:"apps/web/src/app/reviewer/finance/page.tsx",
};
const content=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p,"utf8")]));
for(const [key,needles] of Object.entries({
 migration:["service_packages","candidate_service_orders","candidate_payment_events","candidate_refund_requests","finance_audit_events","n10_prevent_finance_audit_mutation","ENABLE ROW LEVEL SECURITY","FINANCE_REVIEWER"],
 hardening:["REVOKE ALL PRIVILEGES ON TABLE","public.service_packages","public.candidate_service_orders","public.candidate_payment_events","public.candidate_refund_requests","public.finance_audit_events","FROM PUBLIC, anon, authenticated","finance audit events are immutable"],
 paymentRpc:["n10_record_verified_payfast_payment","FOR UPDATE","VERIFIED_PROVIDER_WEBHOOK","server_validation","merchant_reference","provider_status","p_payload_sha256","PAID"],
 refundRpc:["n10_claim_payfast_refund","n10_record_payfast_refund_reconciliation","PROCESSING","REFUND_COMPLETED","finance_audit_events","p_reconciled_total_minor","preflight_original_minor","REVOKE ALL ON FUNCTION"],
 atomicRpc:["n10_create_candidate_order","n10_request_candidate_refund","n10_confirm_manual_payment","n10_review_refund_request","email_verified IS TRUE","FOR UPDATE","finance_audit_events","REVOKE ALL ON FUNCTION"],
 rpcOnly:["n10_record_payfast_intent","REVOKE INSERT, UPDATE, DELETE ON TABLE","public.finance_audit_events","FROM service_role","GRANT SELECT ON TABLE"],
 candidateApi:["requireCandidateSession","candidate_id","CREATE_ORDER","REQUEST_REFUND","idempotencyKey","n10_create_candidate_order","n10_request_candidate_refund","Creating an order never takes payment or marks it paid.","amount_minor"],
 checkoutApi:["requireCandidateSession","PAYFAST_NOT_CONFIGURED","PENDING_PAYMENT","n10_record_payfast_intent","createPayFastItnSignature","paymentUrl"],
 itnApi:["isTrustedPayFastItnSource","verifyPayFastItnSignature","validatePayFastItnAtProvider","n10_record_verified_payfast_payment","PAYMENT_CONFIRMATION_UNCERTAIN","sha256Hex"],
 reviewerApi:["requireReviewerSession","FINANCE_REVIEWER","CONFIRM_MANUAL_PAYMENT","n10_confirm_manual_payment","n10_review_refund_request","PROVIDER_REFUND_RECONCILIATION_REQUIRED"],
 refundApi:["requireReviewerSession","n10_claim_payfast_refund","n10_record_payfast_refund_reconciliation","PAYFAST_REFUND_SUBMISSION_UNCERTAIN","PAYFAST_RECONCILIATION_PENDING","refundLedger"],
 payfastRuntime:["PAYFAST_ITN_ALLOWED_CIDRS","x-nf-client-connection-ip","verifyPayFastItnSignature","validatePayFastItnAtProvider","payFastApiSignature","timingSafeEqual"],
 candidateUi:["Available packages","Your orders","Refund requests","Pay with PayFast","Paid status is set only after a server-validated PayFast ITN"],
 reviewerUi:["Execute approved PayFast refund","Reconcile PayFast refund","provider transaction ledger reconciles"],
})){for(const needle of needles)assert.ok(content[key].includes(needle),key+" missing contract: "+needle);}
assert.match(content.migration,/price_minor integer NOT NULL CHECK\(price_minor>=0\)/);
assert.match(content.migration,/UNIQUE\(candidate_id,idempotency_key\)/);
assert.match(content.migration,/UNIQUE\(candidate_id,candidate_idempotency_key\)/);
assert.match(content.refundRpc,/CHECK\(status IN \('REQUESTED','UNDER_REVIEW','APPROVED','PROCESSING','REJECTED','COMPLETED'\)\)/);
assert.ok(content.reviewerApi.includes("/^[a-fA-F0-9]{64}$/"),"reviewer payment evidence hash format missing");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
assert.equal(pkg.scripts["n10:finance:validate"],"node scripts/validators/validate-n10-finance.mjs");
assert.equal(pkg.scripts["n10:finance:test"],"node --check scripts/tests/n10-finance-contract.mjs && node scripts/tests/n10-finance-contract.mjs && node --check scripts/tests/n10-payfast-contract.mjs && node scripts/tests/n10-payfast-contract.mjs");
console.log("N10 validator passed: "+Object.keys(files).length+" finance/provider artifacts and critical integrity boundaries checked.");
