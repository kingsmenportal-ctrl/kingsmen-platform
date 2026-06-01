#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'provider');
fs.mkdirSync(reportDir, { recursive: true });

const requiredFiles = [
  'n-provider-1/provider-registry.json',
  'n-provider-1/provider-states.schema.json',
  'n-provider-1/validate-provider-registry.mjs',
  'n-provider-1/validate-local-tools.mjs',
  'n-provider-1/install-windows-tools.ps1',
  'n-provider-2/Invoke-KingsmenProvider.ps1',
  'n-provider-2/KINGSMEN_PROVIDER_CREATOR_INTEGRATION.md'
];

const errors = [];
const warnings = [];
const checksums = {};

for (const relative of requiredFiles) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${relative}`);
    continue;
  }
  checksums[relative] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const wrapperPath = path.join(root, 'n-provider-2/Invoke-KingsmenProvider.ps1');
const wrapper = fs.existsSync(wrapperPath) ? fs.readFileSync(wrapperPath, 'utf8') : '';
for (const command of ['provider:check','provider:doctor','provider:report','provider:install']) {
  if (!wrapper.includes(command)) errors.push(`Wrapper missing command: ${command}`);
}
for (const expected of ['validate-provider-registry.mjs','validate-local-tools.mjs','install-windows-tools.ps1']) {
  if (!wrapper.includes(expected)) errors.push(`Wrapper does not route to N_PROVIDER.1 asset: ${expected}`);
}
for (const unsafe of ['WHATSAPP_TOKEN', 'PAYMENT_PROVIDER_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (wrapper.includes(unsafe)) warnings.push(`Wrapper references secret name ${unsafe}; verify no value is embedded.`);
}

const registryPath = path.join(root, 'n-provider-1/provider-registry.json');
let registry = null;
try { registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')); } catch { errors.push('Cannot parse provider registry.'); }
if (registry) {
  if (registry.doctrine?.truth_source !== 'postgresql') errors.push('PostgreSQL truth doctrine not preserved.');
  if (registry.doctrine?.airtable_mode !== 'mirror_only') errors.push('Airtable mirror-only doctrine not preserved.');
  if (registry.doctrine?.communication_primary !== 'email') errors.push('Email-first doctrine not preserved.');
  const unsafeEnabled = (registry.providers || []).filter(p => !p.required_for_boot && p.enabled_by_default);
  if (unsafeEnabled.length > 0) errors.push(`Optional providers enabled by default: ${unsafeEnabled.map(p => p.id).join(', ')}`);
}

const report = {
  module: 'N_PROVIDER.2',
  validator: 'validate-provider-creator-integration.mjs',
  generated_at: new Date().toISOString(),
  passed: errors.length === 0,
  errors,
  warnings,
  required_files: requiredFiles,
  checksums,
  safety: {
    no_raw_secret_values_checked_by_design: true,
    routes_to_n_provider_1_validators: wrapper.includes('validate-provider-registry.mjs') && wrapper.includes('validate-local-tools.mjs'),
    optional_providers_disabled_until_gated: errors.every(error => !error.includes('Optional providers enabled')),
    airtable_mirror_only: registry?.doctrine?.airtable_mode === 'mirror_only',
    email_first: registry?.doctrine?.communication_primary === 'email'
  }
};

const reportPath = path.join(reportDir, 'provider-creator-integration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
