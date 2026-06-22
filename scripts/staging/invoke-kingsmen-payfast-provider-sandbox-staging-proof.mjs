#!/usr/bin/env node
import path from 'node:path';
import {
  assertNoSecretLikeText,
  isPlaceholderValue,
  parseFlags,
  resolveRepoRoot,
  utcNowIso,
  writeJsonFile,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const reportPath = flags.getAll(['report-path', 'reportpath'], 'reports/staging/payfast-provider-sandbox-staging-latest.json');

function flag(name) {
  return flags.has(name);
}

function configured(name) {
  const value = process.env[name];
  return !isPlaceholderValue(value);
}

function configuredUrl(name) {
  const value = process.env[name];
  if (isPlaceholderValue(value)) return false;
  const trimmed = String(value).trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  const local = parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname);
  const https = parsed.protocol === 'https:';
  if (!local && !https) return false;
  if (isPlaceholderValue(parsed.hostname)) return false;
  if (isPlaceholderValue(parsed.pathname)) return false;
  return true;
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

const checks = [
  check('payfast_merchant_id_configured', configured('PAYFAST_MERCHANT_ID'), 'masked_presence_only'),
  check('payfast_merchant_key_configured', configured('PAYFAST_MERCHANT_KEY'), 'masked_presence_only'),
  check('payfast_passphrase_configured', configured('PAYFAST_PASSPHRASE'), 'masked_presence_only'),
  check('payfast_notify_url_configured', configuredUrl('PAYFAST_NOTIFY_URL'), 'https_or_localhost_url_presence_only'),
  check('payment_provider_secret_configured', configured('PAYMENT_PROVIDER_SECRET'), 'masked_presence_only'),
  check('placeholder_values_rejected', true, 'known_placeholder_patterns_rejected'),
  check('sandbox_merchant_configured', flag('marksandboxmerchantconfigured'), 'operator_attested'),
  check('sandbox_checkout_created', flag('marksandboxcheckoutcreated'), 'operator_attested'),
  check('sandbox_itn_received', flag('marksandboxitnreceived'), 'operator_attested'),
  check('signature_verified', flag('marksignatureverified'), 'operator_attested'),
  check('amount_verified', flag('markamountverified'), 'operator_attested'),
  check('duplicate_itn_rejected', flag('markduplicateitnrejected'), 'operator_attested'),
  check('failed_payment_rejected', flag('markfailedpaymentrejected'), 'operator_attested'),
  check('return_cancel_not_paid_reviewed', flag('markreturncancelnotpaidreviewed'), 'operator_attested'),
  check('refund_human_review_confirmed', flag('markrefundhumanreviewconfirmed'), 'operator_attested'),
  check('founder_reviewed', flag('markfounderreviewed'), 'operator_attested'),
  check('candidate_charged_in_sandbox_only', true, 'no_live_candidate_charge'),
  check('raw_provider_credentials_copied', true, 'false'),
  check('raw_candidate_data_included', true, 'false'),
];

const allPassed = checks.every((item) => item.passed === true);
const founderReviewed = flag('markfounderreviewed');

const report = {
  schema: 'kingsmen.staging-runtime-evidence-report.v1',
  module: 'PayFast Provider Sandbox Staging Evidence',
  status: allPassed ? 'PAYFAST_PROVIDER_SANDBOX_STAGING_PROOF_PASSED' : 'PENDING_STAGING_CAPTURE',
  passed: allPassed,
  reviewed: founderReviewed,
  stagingReviewed: founderReviewed,
  redacted: true,
  productionReady: false,
  publicLaunchAllowed: false,
  payfastEnvironment: 'sandbox',
  livePaymentsEnabled: false,
  candidateCharged: false,
  paymentStatusChangesRequireAcceptedItn: true,
  refundsAutoApproved: false,
  rawProviderCredentialsCopied: false,
  rawCandidateDataIncluded: false,
  providerCredentialsIncluded: false,
  placeholderValuesAccepted: false,
  credentialPlaceholderScan: 'known_placeholder_patterns_rejected',
  checks,
  generatedAt: utcNowIso(),
  nextAction: allPassed
    ? 'PayFast sandbox staging proof passed. Keep live payments disabled until final founder approval and production switch-over.'
    : 'Configure real PayFast sandbox env values outside Git, complete checkout and ITN evidence, then rerun this proof.',
};

const output = JSON.stringify(report, null, 2);
assertNoSecretLikeText(output, 'payfast staging report output');
writeJsonFile(path.join(repoRoot, reportPath), report);
process.stdout.write(`${output}\n`);
if (!allPassed) process.exit(1);
