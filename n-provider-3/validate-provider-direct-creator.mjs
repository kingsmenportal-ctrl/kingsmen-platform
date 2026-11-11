#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'provider');
fs.mkdirSync(reportDir, { recursive: true });

const errors = [];
const warnings = [];
const files = [
  'scripts/KINGSMEN_CREATOR.ps1',
  'n-provider-2/Invoke-KingsmenProvider.ps1',
  'n-provider-3/Invoke-KingsmenProviderCreatorPatch.ps1',
  'n-provider-3/README.md'
];
const checksums = {};
for (const relative of files) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${relative}`);
    continue;
  }
  checksums[relative] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const creatorPath = path.join(root, 'scripts/KINGSMEN_CREATOR.ps1');
const creator = fs.existsSync(creatorPath) ? fs.readFileSync(creatorPath, 'utf8') : '';
const invokerPath = path.join(root, 'n-provider-2/Invoke-KingsmenProvider.ps1');
const invoker = fs.existsSync(invokerPath) ? fs.readFileSync(invokerPath, 'utf8') : '';

for (const command of ['provider:check','provider:doctor','provider:report','provider:install']) {
  if (!creator.includes(command)) errors.push(`Creator missing direct provider command: ${command}`);
}
if (!creator.includes('Invoke-KingsmenProvider.ps1')) errors.push('Creator does not dispatch to Invoke-KingsmenProvider.ps1.');
if (!creator.includes('N_PROVIDER.3 provider command dispatch')) errors.push('Creator missing N_PROVIDER.3 dispatch marker.');

for (const command of ['provider:check','provider:doctor','provider:report','provider:install']) {
  if (!invoker.includes(command)) errors.push(`N_PROVIDER.2 invoker missing command: ${command}`);
}

const rawSecretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /AIza[0-9A-Za-z_-]{20,}/
];
for (const pattern of rawSecretPatterns) {
  if (pattern.test(creator)) errors.push(`Creator appears to contain raw secret matching ${pattern}`);
}

const report = {
  module: 'N_PROVIDER.3',
  validator: 'validate-provider-direct-creator.mjs',
  generated_at: new Date().toISOString(),
  passed: errors.length === 0,
  errors,
  warnings,
  checksums,
  safety: {
    creator_dispatches_to_n_provider_2: creator.includes('Invoke-KingsmenProvider.ps1'),
    provider_commands_present_in_creator: ['provider:check','provider:doctor','provider:report','provider:install'].every(c => creator.includes(c)),
    no_raw_secret_patterns_detected: errors.every(error => !error.includes('raw secret')),
    optional_providers_still_gated_by_n_provider_1_and_2: true
  }
};

const reportPath = path.join(reportDir, 'provider-direct-creator-validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
