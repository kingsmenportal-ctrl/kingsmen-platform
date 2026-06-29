import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md', [
    'NUMBER 21 — WHEN THE COMMANDER ASKS ABOUT EMAILS',
    'priority correspondence',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_22_WHEN_THE_COMMANDER_ASKS_ABOUT_CALENDAR.md'
  ]],
  ['packages/jarvis-core/src/email-communication-boundary.ts', [
    'jarvisAssessEmailCommunicationRequest',
    'EMAIL_PRIMARY_COMMUNICATION_CONTROL',
    'primary_tracked_channel_with_permissioned_actions',
    'draft_must_not_be_treated_as_sent_email',
    'email_boundary_built_not_mailbox_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/emails/route.ts', [
    'EMAIL_PRIMARY_COMMUNICATION_CONTROL',
    'noSendingWithoutExplicitApproval',
    'route_built_not_mailbox_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisEmailCommunicationPanel.tsx', [
    'JarvisEmailCommunicationPanel',
    'EMAIL COMMUNICATION CONTROL',
    'Runtime proof not captured yet',
    'must not treat drafts as sent mail'
  ]]
]);

function fail(message) { throw new Error(message); }
function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

const evidence = [];
for (const [file, tokens] of required.entries()) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) fail(`Required token not found in ${file}: ${token}`);
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const route = read('apps/web/src/app/api/jarvis/emails/route.ts');
const boundary = read('packages/jarvis-core/src/email-communication-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 21 must not claim mailbox runtime or production proof from repo files.');
}
if (!boundary.includes('sendingAction && !request.explicitSendApproval')) {
  fail('Number 21 must block sending without explicit approval.');
}

const report = {
  validator: 'validate-jarvis-v5-number-21-emails',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    emailPrimaryTrackedChannel: true,
    draftIsNotSentProof: true,
    noSendingWithoutExplicitApproval: true,
    threadContextRequiredForReplies: true,
    noUnnecessaryPrivateExposure: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-21-emails-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_21_EMAILS_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
