import fs from "node:fs";
import assert from "node:assert/strict";
const sql=fs.readFileSync("db/migrations/0064_n10_packages_payments_refunds.sql","utf8");
const candidate=fs.readFileSync("apps/web/src/app/api/candidate/finance/route.ts","utf8");
const reviewer=fs.readFileSync("apps/web/src/app/api/reviewer/finance/route.ts","utf8");
const packages=[["FOUNDATIONAL_ACCORD",16999],["COLLEGIATE_ORDINANCE",29999],["CHANCELLORS_WRIT",39999],["REGENCY_MANDATE",46999],["ARTISAN_CHARTER",14999],["GUILDMASTERS_CHARTER",19999],["CV_REVAMP",4999]];
for(const [code,price] of packages){assert.ok(sql.includes("'"+code+"'"),"missing package "+code);assert.ok(sql.includes(String(price)),"missing integer price "+price);}
assert.match(sql,/currency char\(3\) NOT NULL DEFAULT 'ZAR' CHECK\(currency='ZAR'\)/);
assert.match(sql,/BEFORE UPDATE OR DELETE ON public\.finance_audit_events/);
assert.match(candidate,/candidate_id:"eq\."\+auth\.session\.candidateId/);
assert.match(candidate,/Only a confirmed paid order can be submitted for refund review/);
assert.match(candidate,/No payment was taken and the order is not marked paid/);
assert.match(reviewer,/Payment reference, evidence locator and SHA-256 evidence hash are required/);
assert.match(reviewer,/this does not independently verify a bank settlement/);
assert.doesNotMatch(candidate,/checkoutConfigured:true/);
assert.doesNotMatch(reviewer,/providerRefundExecutionConfigured:true/);
console.log("N10 finance contract tests passed: "+packages.length+" catalogue entries, candidate isolation, evidence-gated payment and manual refund boundaries.");
