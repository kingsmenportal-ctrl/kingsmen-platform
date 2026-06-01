#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const moduleDir = path.join(root, 'n-provider-1');
const reportDir = path.join(root, 'reports', 'provider');
fs.mkdirSync(reportDir, { recursive: true });

const registryPath = path.join(moduleDir, 'provider-registry.json');
const schemaPath = path.join(moduleDir, 'provider-states.schema.json');
const errors = [];
const warnings = [];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { errors.push(`Cannot read JSON ${file}: ${error.message}`); return null; }
}

const registry = readJson(registryPath);
const schema = readJson(schemaPath);

if (!registry) errors.push('Provider registry missing or invalid.');
if (!schema) errors.push('Provider schema missing or invalid.');

if (registry) {
  if (registry.module !== 'N_PROVIDER.1') errors.push('registry.module must be N_PROVIDER.1');
  if (registry.doctrine?.truth_source !== 'postgresql') errors.push('truth_source must be postgresql');
  if (registry.doctrine?.airtable_mode !== 'mirror_only') errors.push('Airtable must remain mirror_only');
  if (registry.doctrine?.communication_primary !== 'email') errors.push('communication_primary must be email');
  if (registry.doctrine?.whatsapp_policy !== 'urgent_only') errors.push('whatsapp_policy must be urgent_only');
  if (registry.doctrine?.sms_policy !== 'backup_only') errors.push('sms_policy must be backup_only');
  if (registry.doctrine?.deployment_default !== 'oracle_lite') errors.push('deployment_default must be oracle_lite');

  const providers = registry.providers || [];
  if (!Array.isArray(providers) || providers.length < 10) errors.push('Registry must include at least 10 providers.');
  const ids = new Set();
  for (const provider of providers) {
    if (!provider.id) errors.push('Provider missing id.');
    if (ids.has(provider.id)) errors.push(`Duplicate provider id: ${provider.id}`);
    ids.add(provider.id);
    for (const key of ['category','required_for_boot','enabled_by_default','mode','safe_if_missing','credentials','activation_gate']) {
      if (!(key in provider)) errors.push(`${provider.id || 'unknown'} missing ${key}`);
    }
    if (!provider.required_for_boot && provider.enabled_by_default) {
      errors.push(`${provider.id} is optional but enabled_by_default=true; unsafe for N_PROVIDER.1`);
    }
    if (provider.id === 'airtable' && provider.mode !== 'mirror_only') errors.push('Airtable provider must be mirror_only.');
    if (provider.id === 'whatsapp' && provider.mode !== 'urgent_only') errors.push('WhatsApp provider must be urgent_only.');
    if (provider.id === 'sms' && provider.mode !== 'backup_only') errors.push('SMS provider must be backup_only.');
    if (provider.id === 'payments' && provider.mode !== 'hosted_checkout_only') errors.push('Payments must be hosted_checkout_only.');
  }
  for (const required of ['github','postgres','redis','airtable','gmail','netlify','n8n','playwright','whatsapp','sms','payments','oracle_cloud']) {
    if (!ids.has(required)) errors.push(`Missing required provider entry: ${required}`);
  }
}

const files = [registryPath, schemaPath].filter(fs.existsSync);
const checksums = Object.fromEntries(files.map(file => [path.relative(root, file), crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const report = {
  module: 'N_PROVIDER.1',
  validator: 'validate-provider-registry.mjs',
  generated_at: new Date().toISOString(),
  passed: errors.length === 0,
  errors,
  warnings,
  provider_count: registry?.providers?.length ?? 0,
  checksums,
  safety: {
    no_raw_secret_values_checked_by_design: true,
    optional_providers_disabled_until_gated: true,
    airtable_mirror_only: registry?.doctrine?.airtable_mode === 'mirror_only',
    email_first: registry?.doctrine?.communication_primary === 'email'
  }
};

const reportPath = path.join(reportDir, 'provider-registry-validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
