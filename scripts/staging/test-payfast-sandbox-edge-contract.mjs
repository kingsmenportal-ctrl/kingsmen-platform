#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const edge = read("supabase/functions/payfast-sandbox/index.ts");
const migration = read("db/migrations/0092_atomic_payfast_checkout_bundle.sql");
const contentLengthPattern = edge.match(/if \(!\/(.*?)\/\.test\(declaredLength\)\)/);

const checks = [
  [Boolean(contentLengthPattern && new RegExp(contentLengthPattern[1]).test("123") && !new RegExp(contentLengthPattern[1]).test("12x")), "ITN Content-Length validation accepts decimal lengths and rejects malformed values"],
  [edge.includes('rest("rpc/create_payfast_sandbox_checkout_bundle"'), "checkout writes use one atomic RPC"],
  [!edge.includes('await rest("finance_orders"') && !edge.includes('await rest("finance_invoices"') && !edge.includes('await rest("payfast_payment_intents"'), "checkout no longer inserts bundle rows through separate REST writes"],
  [edge.includes("HOSTED_CHECKOUT_FIELD_ORDER"), "hosted form field order is explicit"],
  [edge.indexOf('"email_address"') < edge.indexOf('"m_payment_id"') && edge.indexOf('"m_payment_id"') < edge.indexOf('"amount"') && edge.indexOf('"amount"') < edge.indexOf('"item_name"'), "signature field order follows PayFast hosted-checkout order"],
  [edge.includes("const hostedSignature = signature(hostedFields, passphrase)"), "replayed JSONB fields are re-signed in canonical hosted form order"],
  [edge.includes("merchant_key: Deno.env.get(\"PAYFAST_MERCHANT_KEY\")!"), "merchant key is rebuilt server-side for required hosted-form field"],
  [edge.includes("p_signed_payload: signed"), "signature-bearing form data enters the atomic database transaction"],
  [edge.includes("function trustedPayFastSourceIp(request: Request)"), "ITN source is derived from the trusted ingress header"],
  [edge.includes('request.headers.get("cf-connecting-ip")'), "source-IP checks do not trust caller-controlled forwarded headers"],
  [edge.includes("PAYFAST_SOURCE_IPV4_RANGES") && edge.includes('"144.126.193.139"'), "published PayFast source address ranges and sandbox address are represented"],
  [edge.includes("const ipValid = sourceIp !== null;") && /const accepted =[^;]*&& ipValid && amountValid/s.test(edge), "ITN settlement fails closed when source IP is not allowlisted"],
  [edge.includes("idempotency_key=eq.${encodeURIComponent(duplicateKey)}&accepted=eq.true&limit=1"), "only an accepted receipt blocks a corrected retry"],
  [edge.includes("const priorAccepted = Boolean(priorReceipt?.accepted) && priorMatches"), "accepted duplicate recovery is scoped to a matching prior receipt"],
  [edge.includes("source_ip_not_allowlisted"), "IP rejection is explicit in persisted ITN audit reason"],
  [migration.includes("create or replace function public.create_payfast_sandbox_checkout_bundle"), "atomic checkout SQL function exists"],
  [migration.includes("perform pg_advisory_xact_lock(hashtextextended('payfast-sandbox-checkout:' || p_idempotency_key, 0))"), "same-key checkout requests are serialized"],
  [migration.includes("from public.candidate_auth_identity_links l") && migration.includes("l.link_status = 'VERIFIED'") && migration.includes("l.verified_at is not null"), "database verifies candidate-to-auth link inside the atomic function"],
  [migration.includes("l.verified_at <= v_now") && migration.includes("l.verified_by ~*"), "verified link must be current and reviewer identity must be UUID-shaped"],
  [migration.includes("public.candidates c where c.id = v_candidate_id and c.is_active is true"), "inactive candidates cannot create or replay checkout bundles"],
  [migration.includes("insert into public.finance_orders") && migration.includes("insert into public.finance_invoices") && migration.includes("insert into public.payfast_payment_intents") && migration.includes("insert into public.payment_evidence_ledger"), "order/invoice/intent/evidence are in one transaction"],
  [migration.includes("p_signed_payload - 'merchant_key'"), "merchant key is not persisted in checkout payload JSON"],
  [migration.includes("p_signed_payload ? 'passphrase'") && migration.includes("p_signed_payload ? 'SUPABASE_SERVICE_ROLE_KEY'"), "passphrase and service-role key are forbidden in stored checkout payload"],
  [migration.includes("revoke all on function public.create_payfast_sandbox_checkout_bundle") && migration.includes("to service_role;"), "atomic checkout RPC is service-role-only"],
  [migration.includes("set search_path = pg_catalog, public, pg_temp"), "security-definer search path is pinned"],
];

for (const [passed, description] of checks) assert.ok(passed, description);
console.log(`PASS PayFast sandbox runtime contract (${checks.length} assertions)`);
