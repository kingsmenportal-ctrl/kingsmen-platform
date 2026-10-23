#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const failures = [];
const pricing = read("apps/api/src/finance/pricing-catalog.ts");
const types = read("apps/api/src/finance/finance-types.ts");
const seed = read("db/seeds/n10_finance_payfast_seed.sql");
const migration = read("db/migrations/0083_retire_legacy_accommodation_checkout.sql");
const manifest = JSON.parse(read("manifests/n10/finance-payfast-runtime.json"));
const business = JSON.parse(read("manifests/business/package-catalogue.json"));
const report = read("reports/n10/N10_FINANCE_PAYFAST_REPORT.md");
const financePolicy = read("apps/api/src/finance/finance-policy.ts");
const itn = read("apps/api/src/finance/payfast-itn.ts");
const paymentEvidence = read("apps/api/src/finance/payment-evidence.ts");
const assertContract = (condition, code) => { if (!condition) failures.push(code); };

assertContract(!pricing.includes('planCode: "ACCOMMODATION_SUPPORT_R179"'), "legacy-plan-selectable-in-runtime-catalogue");
assertContract(types.includes('"ACCOMMODATION_SUPPORT_R179"'), "legacy-plan-code-not-preserved-for-historical-orders");
assertContract(seed.includes("where plan_code = 'ACCOMMODATION_SUPPORT_R179'") && /where plan_code = 'ACCOMMODATION_SUPPORT_R179'[\s\S]*?active = false|active = false[\s\S]*?where plan_code = 'ACCOMMODATION_SUPPORT_R179'/.test(seed), "seed-does-not-deactivate-legacy-plan");
assertContract(/where plan_code = 'ACCOMMODATION_SUPPORT_R179'[\s\S]*?active = false|active = false[\s\S]*?where plan_code = 'ACCOMMODATION_SUPPORT_R179'/.test(migration), "migration-does-not-deactivate-legacy-plan");
assertContract(manifest.pricing_locked?.includes("FREE_DESTINY_MAP_R0") && manifest.pricing_locked?.includes("CV_REVAMP_R49_99"), "active-legacy-catalogue-codes-missing");
assertContract(!manifest.pricing_locked?.includes("ACCOMMODATION_SUPPORT_R179"), "retired-plan-still-declared-active");
assertContract(manifest.retired_legacy_plan_codes?.some((p) => p.plan_code === "ACCOMMODATION_SUPPORT_R179" && p.status === "retired_not_selectable"), "retired-plan-state-not-declared");
assertContract(business.packages?.length === 7 && business.packages.every((p) => p.status === "CANONICAL"), "canonical-seven-package-manifest-changed");
assertContract(seed.includes("active = false") && migration.includes("active = false"), "legacy-plan-not-deactivated-in-both-seed-and-migration");
assertContract(!/up to 8 accommodation applications\/routes|up to 8 ACC-01 accommodation routes/i.test(seed), "unapproved-accommodation-quantity-remains-in-seed");
assertContract(report.includes("not selectable for new checkout") && report.includes("Paid checkout remains blocked"), "finance-report-does-not-explain-release-boundary");
assertContract(financePolicy.includes('payment.paymentStatus !== "COMPLETE"') && financePolicy.includes("!payment.verified") && financePolicy.includes("!payment.evidenceRef"), "paid-order-activation-must-require-complete-verified-evidence");
assertContract(itn.includes('if (!signatureValid)') && itn.includes('if (!amountValid)') && itn.includes('if (duplicate)') && itn.includes('if (!ipValid)') && itn.includes('paymentStatus !== "COMPLETE"'), "itn-must-fail-closed-on-signature-amount-duplicate-source-or-status");
assertContract(paymentEvidence.includes("eventSummary.trim()") && paymentEvidence.includes("Payment evidence summary is required"), "payment-evidence-summary-must-not-be-empty");

const result = { schema: "kingsmen.finance-canonical-catalogue-contract.v1", passed: failures.length === 0, failures, canonicalPackageCount: business.packages?.length ?? 0, selectableLegacyN10Codes: manifest.pricing_locked, retiredLegacyPlan: "ACCOMMODATION_SUPPORT_R179", note: "Source contract only; does not apply migrations or prove provider checkout." };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
