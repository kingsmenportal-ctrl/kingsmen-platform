#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const taxonomyPath = path.join(root, 'manifests', 'jarvis', 'jarvis-intent-taxonomy.json');
const routingPath = path.join(root, 'manifests', 'jarvis', 'jarvis-intent-routing-matrix.json');
const rulesPath = path.join(root, 'manifests', 'jarvis', 'jarvis-intent-classifier-rules.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-intent-router-validation.json');

const knownRisk = new Set(['safe_read', 'safe_generate', 'review_required', 'approval_required', 'blocked']);
const knownConfidence = new Set(['high', 'medium', 'low', 'blocked']);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.3 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const taxonomy = readJson(taxonomyPath);
  const routing = readJson(routingPath);
  const rules = readJson(rulesPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(taxonomy.intents) || taxonomy.intents.length === 0) {
    fail('taxonomy.intents missing or empty.');
    return;
  }

  const intentIds = new Set();
  const commandFamilies = new Set();

  for (const intent of taxonomy.intents) {
    if (intentIds.has(intent.intent_id)) fail(`Duplicate intent_id: ${intent.intent_id}`);
    intentIds.add(intent.intent_id);
    commandFamilies.add(intent.default_command_family);

    if (!/^[a-z0-9_]+$/.test(intent.intent_id)) fail(`Invalid intent_id format: ${intent.intent_id}`);
    if (!knownRisk.has(intent.default_risk_level)) fail(`${intent.intent_id} has unknown risk level ${intent.default_risk_level}`);
    if (!Array.isArray(intent.allowed_confidence) || intent.allowed_confidence.length === 0) fail(`${intent.intent_id} missing allowed_confidence.`);
    for (const confidence of intent.allowed_confidence || []) {
      if (!knownConfidence.has(confidence)) fail(`${intent.intent_id} has unknown confidence ${confidence}`);
    }
    if (!intent.fallback_when_low_confidence) fail(`${intent.intent_id} missing fallback_when_low_confidence.`);
  }

  if (!intentIds.has('blocked_unsafe_action')) fail('blocked_unsafe_action intent is required.');
  if (!intentIds.has('live_research')) fail('live_research intent is required.');

  if (!Array.isArray(routing.routing_rules) || routing.routing_rules.length === 0) fail('routing_rules missing or empty.');
  for (const route of routing.routing_rules || []) {
    if (!intentIds.has(route.intent_id)) fail(`Routing matrix references unknown intent ${route.intent_id}`);
    if (!Array.isArray(route.command_candidates) || route.command_candidates.length === 0) fail(`${route.intent_id} missing command_candidates.`);
    if (!Array.isArray(route.output_surface) || route.output_surface.length === 0) fail(`${route.intent_id} missing output_surface.`);
  }

  if (!routing.fallbacks?.low_confidence) fail('routing fallback for low_confidence is required.');
  if (!routing.fallbacks?.unknown_intent) fail('routing fallback for unknown_intent is required.');

  if (!Array.isArray(rules.rules) || rules.rules.length === 0) fail('classifier rules missing or empty.');
  for (const rule of rules.rules || []) {
    if (!intentIds.has(rule.then_intent)) fail(`Classifier rule ${rule.rule_id} references unknown intent ${rule.then_intent}`);
    if (!Array.isArray(rule.if_any_terms) || rule.if_any_terms.length === 0) fail(`Classifier rule ${rule.rule_id} missing if_any_terms.`);
  }

  if (!rules.tie_breakers || rules.tie_breakers.length === 0) fail('tie_breakers are required.');
  if (!rules.confidence_rules) fail('confidence_rules are required.');

  if (process.exitCode) return;
  console.log('PJ42.3 VALIDATION PASSED');
  console.log(`Intents validated: ${intentIds.size}`);
  console.log(`Routing rules validated: ${(routing.routing_rules || []).length}`);
  console.log(`Classifier rules validated: ${(rules.rules || []).length}`);
  console.log(`Command families referenced: ${commandFamilies.size}`);
}

main();
