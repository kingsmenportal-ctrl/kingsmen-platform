#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-connector-catalog.json');
const contractsPath = path.join(root, 'manifests', 'jarvis', 'jarvis-adapter-contracts.json');
const routingPath = path.join(root, 'manifests', 'jarvis', 'jarvis-connector-routing-policy.json');
const evidencePath = path.join(root, 'manifests', 'jarvis', 'jarvis-connector-evidence-policy.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj47-tool-adapters-live-connectors-validation.json');

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ47 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const catalog = readJson(catalogPath);
  const contracts = readJson(contractsPath);
  const routing = readJson(routingPath);
  const evidence = readJson(evidencePath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  const connectorIds = new Set();
  const adapterIds = new Set();

  for (const connector of catalog.connectors || []) {
    if (connectorIds.has(connector.connector_id)) fail(`Duplicate connector_id: ${connector.connector_id}`);
    connectorIds.add(connector.connector_id);
    adapterIds.add(connector.adapter_id);
    if (!connector.adapter_id) fail(`${connector.connector_id} missing adapter_id.`);
    if (connector.requires_evidence !== true) fail(`${connector.connector_id} must require evidence.`);
    if (!connector.default_failure) fail(`${connector.connector_id} missing default_failure.`);
  }

  if (!connectorIds.has('blocked_manual_review')) fail('blocked_manual_review connector is required.');
  if (!connectorIds.has('web_research')) fail('web_research connector is required.');
  if (!connectorIds.has('github_repo')) fail('github_repo connector is required.');

  for (const contract of contracts.contracts || []) {
    if (!adapterIds.has(contract.adapter_id)) fail(`Contract references unknown adapter ${contract.adapter_id}`);
    if (!Array.isArray(contract.input_required) || contract.input_required.length === 0) fail(`${contract.adapter_id} missing input_required.`);
    if (!Array.isArray(contract.output_required) || contract.output_required.length === 0) fail(`${contract.adapter_id} missing output_required.`);
  }

  if (routing.default_route !== 'blocked_manual_review') fail('default_route must be blocked_manual_review.');
  for (const route of routing.routing_rules || []) {
    if (!connectorIds.has(route.preferred_connector)) fail(`Route ${route.need} has unknown preferred_connector.`);
    if (!connectorIds.has(route.fallback_connector)) fail(`Route ${route.need} has unknown fallback_connector.`);
  }

  if (evidence.evidence_required_for_all_connectors !== true) fail('evidence_required_for_all_connectors must be true.');
  if (!Array.isArray(evidence.evidence_fields) || evidence.evidence_fields.length === 0) fail('evidence_fields missing.');

  if (process.exitCode) return;
  console.log('PJ47 VALIDATION PASSED');
  console.log(`Connectors validated: ${connectorIds.size}`);
  console.log(`Adapter contracts validated: ${(contracts.contracts || []).length}`);
  console.log(`Routing rules validated: ${(routing.routing_rules || []).length}`);
}

main();
