import fs from "node:fs";
import assert from "node:assert/strict";
const files={
 migration:"db/migrations/0064_n10_packages_payments_refunds.sql",
 candidateApi:"apps/web/src/app/api/candidate/finance/route.ts",
 reviewerApi:"apps/web/src/app/api/reviewer/finance/route.ts",
 candidateUi:"apps/web/src/app/candidate/finance/page.tsx",
 reviewerUi:"apps/web/src/app/reviewer/finance/page.tsx",
};
const content=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p,"utf8")]));
for(const [key,needles] of Object.entries({
 migration:["service_packages","candidate_service_orders","candidate_payment_events","candidate_refund_requests","finance_audit_events","n10_prevent_finance_audit_mutation","ENABLE ROW LEVEL SECURITY","FINANCE_REVIEWER"],
 candidateApi:["requireCandidateSession","candidate_id","CREATE_ORDER","REQUEST_REFUND","idempotencyKey","checkoutConfigured:false","the order is not marked paid","PAID","amount_minor"],
 reviewerApi:["requireReviewerSession","FINANCE_REVIEWER","CONFIRM_MANUAL_PAYMENT","evidenceSha256","REVIEW_REFUND","providerRefundExecutionConfigured:false","finance_audit_events"],
 candidateUi:["Available packages","Your orders","Refund requests","Candidates cannot mark an order paid"],
 reviewerUi:["Confirm payment with evidence","Approve refund","Reject refund","does not verify a bank settlement"],
})){for(const needle of needles)assert.ok(content[key].includes(needle),key+" missing contract: "+needle);}
assert.match(content.migration,/price_minor integer NOT NULL CHECK\(price_minor>=0\)/);
assert.match(content.migration,/UNIQUE\(candidate_id,idempotency_key\)/);
assert.match(content.migration,/UNIQUE\(candidate_id,candidate_idempotency_key\)/);
assert.match(content.reviewerApi,/\^\[a-fA-F0-9\]\{64\}\$/);
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));assert.equal(pkg.scripts["n10:finance:validate"],"node scripts/validators/validate-n10-finance.mjs");assert.equal(pkg.scripts["n10:finance:test"],"node --check scripts/tests/n10-finance-contract.mjs && node scripts/tests/n10-finance-contract.mjs");
console.log("N10 finance validator passed: "+Object.keys(files).length+" artifacts and financial integrity contracts checked.");
