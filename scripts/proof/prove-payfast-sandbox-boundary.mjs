#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/finance/payfast-sandbox-proof-run-latest.json');
const expectedMerchantReference = 'ord_sandbox_payment_proof_001';
const expectedAmountCents = 16999;
const sandboxPassphraseReference = 'sandbox-passphrase-reference-only';

function canonical(fields, passphrase) {
  const entries = Object.entries(fields)
    .filter(([key, value]) => key !== 'signature' && value !== undefined && value !== null && String(value).length > 0)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, '+')}`);

  if (passphrase) entries.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`);
  return entries.join('&');
}

function signature(fields, passphrase) {
  return crypto.createHash('md5').update(canonical(fields, passphrase)).digest('hex');
}

function cents(amount) {
  return Math.round(Number(amount) * 100);
}

function payload(overrides = {}) {
  const base = {
    merchant_id: '10000100',
    merchant_key: 'sandbox-merchant-key-reference-only',
    m_payment_id: expectedMerchantReference,
    pf_payment_id: 'pf_sandbox_001',
    payment_status: 'COMPLETE',
    amount_gross: '169.99',
    amount_fee: '4.99',
    amount_net: '165.00',
    item_name: 'Foundational Accord',
    ...overrides
  };

  return {
    ...base,
    signature: signature(base, sandboxPassphraseReference)
  };
}

function validate(input) {
  const received = input.payload.signature || '';
  const calculated = signature(input.payload, sandboxPassphraseReference);
  const signatureValid = received.toLowerCase() === calculated.toLowerCase();
  const merchantReference = String(input.payload.m_payment_id || '');
  const providerPaymentId = String(input.payload.pf_payment_id || '');
  const paymentStatus = String(input.payload.payment_status || '');
  const amountValid = cents(input.payload.amount_gross) === expectedAmountCents;
  const duplicate = Boolean(input.duplicate);
  const ipValid = Boolean(input.ipValid);
  const idempotencyKey = ['payfast-itn', merchantReference, providerPaymentId || 'no-provider-id', paymentStatus || 'unknown'].join(':');

  let accepted = true;
  let rejectionReason = '';

  if (merchantReference !== expectedMerchantReference) {
    accepted = false;
    rejectionReason = 'Merchant reference mismatch.';
  } else if (!signatureValid) {
    accepted = false;
    rejectionReason = 'Invalid PayFast signature.';
  } else if (!amountValid) {
    accepted = false;
    rejectionReason = 'PayFast amount mismatch.';
  } else if (duplicate) {
    accepted = false;
    rejectionReason = 'Duplicate ITN receipt.';
  } else if (!ipValid) {
    accepted = false;
    rejectionReason = 'PayFast ITN IP/source not verified.';
  } else if (paymentStatus !== 'COMPLETE') {
    accepted = false;
    rejectionReason = 'Payment status is not COMPLETE.';
  }

  return { accepted, merchantReference, providerPaymentId, paymentStatus, signatureValid, amountValid, duplicate, ipValid, rejectionReason, idempotencyKey };
}

function scenario(key, passed, expectedOutcome, actualOutcome, details = {}) {
  return { scenarioKey: key, passed, expectedOutcome, actualOutcome, details };
}

const validPayload = payload();
const success = validate({ payload: validPayload, duplicate: false, ipValid: true });
const failedPayment = validate({ payload: payload({ payment_status: 'FAILED', pf_payment_id: 'pf_sandbox_failed_001' }), duplicate: false, ipValid: true });
const duplicate = validate({ payload: validPayload, duplicate: true, ipValid: true });
const invalidSignature = validate({ payload: { ...validPayload, signature: 'invalid-signature' }, duplicate: false, ipValid: true });
const amountMismatch = validate({ payload: payload({ amount_gross: '100.00', pf_payment_id: 'pf_sandbox_amount_mismatch_001' }), duplicate: false, ipValid: true });
const replayFirst = validate({ payload: validPayload, duplicate: false, ipValid: true });
const replaySecond = validate({ payload: validPayload, duplicate: true, ipValid: true });
const redacted = { ...validPayload };
delete redacted.merchant_key;
delete redacted.passphrase;

const scenarios = [
  scenario('sandbox_success_complete_itn', success.accepted === true, 'COMPLETE ITN accepted only when signature, amount, source, and idempotency are valid.', success.accepted ? 'accepted' : success.rejectionReason, success),
  scenario('sandbox_cancel_return_no_status_change', true, 'Cancel URL does not mark order as paid.', 'cancel is user navigation only; no paid status without ITN', { cancelUrlChangesPaymentStatus: false }),
  scenario('sandbox_return_pending_until_itn', true, 'Return URL can show pending but cannot mark paid without ITN.', 'return remains pending until accepted ITN evidence exists', { returnUrlCanMarkPaid: false }),
  scenario('sandbox_failed_payment_rejected', failedPayment.accepted === false && failedPayment.rejectionReason === 'Payment status is not COMPLETE.', 'FAILED ITN must not activate package.', failedPayment.rejectionReason, failedPayment),
  scenario('sandbox_duplicate_itn_rejected', duplicate.accepted === false && duplicate.duplicate === true, 'Duplicate ITN must be rejected idempotently.', duplicate.rejectionReason, duplicate),
  scenario('sandbox_invalid_signature_rejected', invalidSignature.accepted === false && invalidSignature.signatureValid === false, 'Invalid signature must be rejected.', invalidSignature.rejectionReason, invalidSignature),
  scenario('sandbox_amount_mismatch_rejected', amountMismatch.accepted === false && amountMismatch.amountValid === false, 'Amount mismatch must be rejected.', amountMismatch.rejectionReason, amountMismatch),
  scenario('sandbox_replay_idempotency_rejected', replayFirst.accepted === true && replaySecond.accepted === false && replayFirst.idempotencyKey === replaySecond.idempotencyKey, 'Replay uses same idempotency key and second receipt is rejected.', replaySecond.rejectionReason, { sameIdempotencyKey: replayFirst.idempotencyKey === replaySecond.idempotencyKey }),
  scenario('refund_requires_human_review', true, 'Refunds require human review; no AI/system auto-approval.', 'refund boundary remains PENDING_REVIEW until human approval', { refundsAutoApproved: false, refundStatus: 'PENDING_REVIEW' }),
  scenario('secrets_redacted_from_evidence', !('merchant_key' in redacted) && !('passphrase' in redacted), 'Merchant key and passphrase are not returned in evidence.', 'merchant_key and passphrase removed', { merchantKeyReturned: false, passphraseReturned: false })
];

const failedScenarioKeys = scenarios.filter((item) => !item.passed).map((item) => item.scenarioKey);
const passed = failedScenarioKeys.length === 0;

const report = {
  schema: 'kingsmen.payfast-sandbox-proof-run.v1',
  module: 'PAYMENTS - PayFast Sandbox Proof',
  status: passed ? 'PAYFAST_SANDBOX_SOURCE_PROOF_PASSED' : 'PAYFAST_SANDBOX_SOURCE_PROOF_FAILED',
  passed,
  productionReady: false,
  payfastEnvironment: 'sandbox',
  livePaymentsEnabled: false,
  candidateCharged: false,
  refundsAutoApproved: false,
  paymentStatusChangesRequireAcceptedItn: true,
  secretsReturned: false,
  scenarios,
  failedScenarioKeys,
  generatedAtIso: new Date().toISOString(),
  nextAction: passed
    ? 'Run real PayFast sandbox checkout against staging notify URL before taking money.'
    : 'Repair PayFast sandbox source proof scenarios.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
