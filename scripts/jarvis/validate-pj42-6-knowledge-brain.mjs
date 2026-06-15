#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const domainsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-knowledge-domains.json');
const retrievalPath = path.join(root, 'manifests', 'jarvis', 'jarvis-knowledge-retrieval-policy.json');
const storagePath = path.join(root, 'manifests', 'jarvis', 'jarvis-knowledge-indexing-storage.json');
const boundaryPath = path.join(root, 'manifests', 'jarvis', 'jarvis-knowledge-memory-boundary.json');
const answerPath = path.join(root, 'manifests', 'jarvis', 'jarvis-knowledge-answer-composition.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-knowledge-brain-validation.json');

const requiredDomains = new Set([
  'kingsmen_doctrine_laws',
  'pj42_jarvis_law_package',
  'n_series_architecture',
  'workflow_registry',
  'pricing_business_pack',
  'route_universe_public_sources',
  'github_build_evidence',
  'founder_decisions_command_outcomes',
  'system_incident_summaries',
  'visual_hud_product_decisions'
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.6 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const domains = readJson(domainsPath);
  const retrieval = readJson(retrievalPath);
  const storage = readJson(storagePath);
  const boundary = readJson(boundaryPath);
  const answer = readJson(answerPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(domains.knowledge_domains) || domains.knowledge_domains.length === 0) {
    fail('knowledge_domains missing or empty.');
    return;
  }

  const domainIds = new Set();
  for (const domain of domains.knowledge_domains) {
    if (domainIds.has(domain.domain_id)) fail(`Duplicate domain_id: ${domain.domain_id}`);
    domainIds.add(domain.domain_id);
    if (!Array.isArray(domain.allowed_sources) || domain.allowed_sources.length === 0) fail(`${domain.domain_id} missing allowed_sources.`);
    if (!Array.isArray(domain.blocked_sources)) fail(`${domain.domain_id} missing blocked_sources array.`);
    if (!Array.isArray(domain.answer_status_labels) || domain.answer_status_labels.length === 0) fail(`${domain.domain_id} missing answer_status_labels.`);
    if (typeof domain.may_cache_summary !== 'boolean') fail(`${domain.domain_id} missing may_cache_summary boolean.`);
    if (typeof domain.requires_source_confidence !== 'boolean') fail(`${domain.domain_id} missing requires_source_confidence boolean.`);
  }

  for (const required of requiredDomains) {
    if (!domainIds.has(required)) fail(`Required knowledge domain missing: ${required}`);
  }

  if (!Array.isArray(retrieval.retrieval_order) || retrieval.retrieval_order.length === 0) fail('retrieval_order missing.');
  if (!Array.isArray(retrieval.query_expansion_rules) || retrieval.query_expansion_rules.length === 0) fail('query_expansion_rules missing.');
  if (retrieval.core_rules?.retrieve_before_claiming_kingsmen_fact !== true) fail('retrieve_before_claiming_kingsmen_fact must be true.');

  if (!Array.isArray(storage.indexable_content) || storage.indexable_content.length === 0) fail('indexable_content missing.');
  if (!Array.isArray(storage.not_indexable_content) || storage.not_indexable_content.length === 0) fail('not_indexable_content missing.');
  if (!storage.not_indexable_content.includes('raw_candidate_records')) fail('raw_candidate_records must be not indexable.');
  if (!storage.not_indexable_content.includes('raw_payment_records')) fail('raw_payment_records must be not indexable.');

  if (!Array.isArray(boundary.forbidden_memory_types) || boundary.forbidden_memory_types.length === 0) fail('forbidden_memory_types missing.');
  if (!boundary.forbidden_memory_types.includes('raw_candidate_profile')) fail('raw_candidate_profile must be forbidden memory.');
  if (!boundary.forbidden_memory_types.includes('raw_payment_record')) fail('raw_payment_record must be forbidden memory.');

  if (!answer.status_language || Object.keys(answer.status_language).length === 0) fail('status_language missing.');
  if (!Array.isArray(answer.prohibited_answer_patterns) || answer.prohibited_answer_patterns.length === 0) fail('prohibited_answer_patterns missing.');
  if (!answer.prohibited_answer_patterns.includes('claiming_unbuilt_features_as_built')) fail('must prohibit claiming unbuilt features as built.');
  if (!answer.prohibited_answer_patterns.includes('exposing_private_raw_data')) fail('must prohibit exposing private raw data.');

  if (process.exitCode) return;
  console.log('PJ42.6 VALIDATION PASSED');
  console.log(`Knowledge domains validated: ${domainIds.size}`);
  console.log(`Retrieval sources ranked: ${(retrieval.retrieval_order || []).length}`);
  console.log(`Indexable content types: ${(storage.indexable_content || []).length}`);
  console.log(`Forbidden memory types: ${(boundary.forbidden_memory_types || []).length}`);
}

main();
