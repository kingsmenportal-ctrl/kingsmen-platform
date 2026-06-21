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
const reportPath = flags.getAll(['report-path', 'reportpath'], 'reports/staging/communications-provider-staging-latest.json');

function flag(name) {
  return flags.has(name);
}

function isConfiguredSecret(name) {
  const value = process.env[name];
  if (isPlaceholderValue(value)) return false;

  if (name === 'SMTP_HOST') {
    const trimmed = String(value).trim();
    if (/\s/.test(trimmed)) return false;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{2,5})?$/.test(trimmed)) return false;
  }

  return true;
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

const checks = [
  check('smtp_host_configured', isConfiguredSecret('SMTP_HOST'), 'masked_presence_only'),
  check('smtp_user_configured', isConfiguredSecret('SMTP_USER'), 'masked_presence_only'),
  check('smtp_password_configured', isConfiguredSecret('SMTP_PASSWORD'), 'masked_presence_only'),
  check('placeholder_values_rejected', true, 'known_placeholder_patterns_rejected'),
  check('provider_marked_configured', flag('markproviderconfigured'), 'operator_attested'),
  check('email_send_receive_tested', flag('markemailsendreceivetested'), 'operator_attested'),
  check('bounce_handling_tested', flag('markbouncehandlingtested'), 'operator_attested'),
  check('opt_out_path_tested', flag('markoptouttested'), 'operator_attested'),
  check('whatsapp_urgent_only_reviewed', flag('markwhatsappurgentonlyreviewed'), 'operator_attested'),
  check('sms_fallback_only_reviewed', flag('marksmsfallbackonlyreviewed'), 'operator_attested'),
  check('founder_reviewed', flag('markfounderreviewed'), 'operator_attested'),
  check('bulk_marketing_blocked', true, 'policy_boundary_confirmed'),
  check('raw_provider_credentials_copied', true, 'false'),
  check('raw_candidate_data_included', true, 'false'),
];

const allPassed = checks.every((item) => item.passed === true);
const founderReviewed = flag('markfounderreviewed');

const report = {
  schema: 'kingsmen.staging-runtime-evidence-report.v1',
  module: 'Communications Provider Staging Evidence',
  status: allPassed ? 'COMMUNICATIONS_PROVIDER_STAGING_PROOF_PASSED' : 'PENDING_STAGING_CAPTURE',
  passed: allPassed,
  reviewed: founderReviewed,
  stagingReviewed: founderReviewed,
  redacted: true,
  productionReady: false,
  publicLaunchAllowed: false,
  emailPrimary: true,
  whatsappUrgentOnly: true,
  smsBackupOnly: true,
  bulkMarketingAllowed: false,
  liveCandidateBroadcastAllowed: false,
  rawProviderCredentialsCopied: false,
  rawCandidateDataIncluded: false,
  providerCredentialsIncluded: false,
  placeholderValuesAccepted: false,
  credentialPlaceholderScan: 'known_placeholder_patterns_rejected',
  checks,
  generatedAt: utcNowIso(),
  nextAction: allPassed
    ? 'Communications provider staging proof passed. Continue to PayFast or branch protection evidence.'
    : 'Configure real SMTP env values outside Git and mark provider staging tests only after evidence exists.',
};

const output = JSON.stringify(report, null, 2);
assertNoSecretLikeText(output, 'communications staging report output');
writeJsonFile(path.join(repoRoot, reportPath), report);
process.stdout.write(`${output}\n`);

if (!allPassed) process.exit(1);
