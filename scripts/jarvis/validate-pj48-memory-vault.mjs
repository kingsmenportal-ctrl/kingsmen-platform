#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const domainsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-memory-domains.json');
const writePath = path.join(root, 'manifests', 'jarvis', 'jarvis-memory-write-policy.json');
const readPath = path.join(root, 'manifests', 'jarvis', 'jarvis-memory-read-policy.json');
const retentionPath = path.join(root, 'manifests', 'jarvis', 'jarvis-memory-retention-policy.json');
const redactionPath = path.join(root, 'manifests', 'jarvis', 'jarvis-memory-redaction-policy.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj48-memory-vault-validation.json');

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ48 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const domains = readJson(domainsPath);
  const writePolicy = readJson(writePath);
  const readPolicy = readJson(readPath);
  const retention = readJson(retentionPath);
  const redaction = readJson(redactionPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(domains.memory_domains) || domains.memory_domains.length === 0) fail('memory_domains missing.');

  const domainIds = new Set();
  for (const domain of domains.memory_domains || []) {
    if (domainIds.has(domain.domain_id)) fail(`Duplicate domain_id: ${domain.domain_id}`);
    domainIds.add(domain.domain_id);
    if (domain.requires_summary_only !== true) fail(`${domain.domain_id} must require summary only.`);
    if (domain.requires_source_reference !== true) fail(`${domain.domain_id} must require source reference.`);
  }

  if (writePolicy.core_rules?.summary_only !== true) fail('write policy must require summary_only.');
  if (writePolicy.core_rules?.source_reference_required !== true) fail('write policy must require source_reference.');
  if (readPolicy.core_rules?.current_facts_require_live_data_router !== true) fail('read policy must route current facts to live data.');
  if (!Array.isArray(retention.retention_classes) || retention.retention_classes.length === 0) fail('retention classes missing.');
  if (!Array.isArray(redaction.redaction_rules) || redaction.redaction_rules.length === 0) fail('redaction rules missing.');

  if (process.exitCode) return;
  console.log('PJ48 VALIDATION PASSED');
  console.log(`Memory domains validated: ${domainIds.size}`);
  console.log(`Retention classes validated: ${(retention.retention_classes || []).length}`);
  console.log(`Redaction rules validated: ${(redaction.redaction_rules || []).length}`);
}

main();
