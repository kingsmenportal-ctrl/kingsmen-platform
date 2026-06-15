#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adaptersPath = path.join(root, 'manifests', 'jarvis', 'jarvis-approved-tool-adapters.json');
const routingPath = path.join(root, 'manifests', 'jarvis', 'jarvis-tool-routing-matrix.json');
const policyPath = path.join(root, 'manifests', 'jarvis', 'jarvis-tool-policy.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-tool-router-validation.json');
const commandRegistryPath = path.join(root, 'manifests', 'jarvis', 'jarvis-command-registry.json');

const knownRisk = new Set(['safe_read', 'safe_generate', 'review_required', 'approval_required', 'blocked']);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.4 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const adapters = readJson(adaptersPath);
  const routing = readJson(routingPath);
  const policy = readJson(policyPath);
  const validation = readJson(validationPath);
  const commandRegistry = readJson(commandRegistryPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  const commandIds = new Set((commandRegistry.commands || []).map((command) => command.command_id));
  const adapterIds = new Set();

  if (!Array.isArray(adapters.adapters) || adapters.adapters.length === 0) {
    fail('adapters list missing or empty.');
    return;
  }

  for (const adapter of adapters.adapters) {
    if (adapterIds.has(adapter.adapter_id)) fail(`Duplicate adapter_id: ${adapter.adapter_id}`);
    adapterIds.add(adapter.adapter_id);

    if (!/^[a-z0-9_]+$/.test(adapter.adapter_id)) fail(`Invalid adapter_id format: ${adapter.adapter_id}`);
    if (!knownRisk.has(adapter.risk_level)) fail(`${adapter.adapter_id} has unknown risk level ${adapter.risk_level}`);
    if (adapter.evidence_required !== true) fail(`${adapter.adapter_id} must require evidence.`);
    if (!Array.isArray(adapter.allowed_commands) || adapter.allowed_commands.length === 0) fail(`${adapter.adapter_id} missing allowed_commands.`);
    for (const commandId of adapter.allowed_commands || []) {
      if (!commandIds.has(commandId)) fail(`${adapter.adapter_id} references unknown command ${commandId}`);
    }
    if (adapter.risk_level === 'blocked' && !adapter.blocked_reason) fail(`${adapter.adapter_id} is blocked but missing blocked_reason.`);
    if ((adapter.risk_level === 'approval_required' || adapter.risk_level === 'review_required') && adapter.approval_required !== true) {
      fail(`${adapter.adapter_id} risk requires approval_required true.`);
    }
    if (!Array.isArray(adapter.output_surfaces) || adapter.output_surfaces.length === 0) fail(`${adapter.adapter_id} missing output_surfaces.`);
    if (!adapter.failure_fallback) fail(`${adapter.adapter_id} missing failure_fallback.`);
  }

  if (!adapterIds.has('blocked_adapter')) fail('blocked_adapter is required.');

  if (!Array.isArray(routing.routes) || routing.routes.length === 0) fail('tool routes missing or empty.');
  for (const route of routing.routes || []) {
    if (!commandIds.has(route.command_id)) fail(`Route references unknown command ${route.command_id}`);
    if (!adapterIds.has(route.adapter_id)) fail(`Route for ${route.command_id} references unknown adapter ${route.adapter_id}`);
    const adapter = adapters.adapters.find((item) => item.adapter_id === route.adapter_id);
    if (adapter && !adapter.allowed_commands.includes(route.command_id)) fail(`${route.command_id} is not allowed by adapter ${route.adapter_id}`);
    if (adapter && (adapter.risk_level === 'approval_required' || adapter.risk_level === 'review_required') && route.requires_policy_gate !== true) {
      fail(`${route.command_id} is risky but route does not require policy gate.`);
    }
    if (adapter && adapter.risk_level === 'approval_required' && route.requires_approval_token !== true) {
      fail(`${route.command_id} requires approval but route does not require approval token.`);
    }
  }

  if (policy.global_rules?.free_text_tool_calling_allowed !== false) fail('free_text_tool_calling_allowed must be false.');
  if (policy.global_rules?.unknown_tool_default !== 'blocked') fail('unknown_tool_default must be blocked.');
  if (policy.global_rules?.evidence_required_for_all_adapters !== true) fail('evidence_required_for_all_adapters must be true.');
  if (!policy.failure_policy) fail('failure_policy is required.');

  if (process.exitCode) return;
  console.log('PJ42.4 VALIDATION PASSED');
  console.log(`Adapters validated: ${adapterIds.size}`);
  console.log(`Routes validated: ${(routing.routes || []).length}`);
  console.log(`Known commands referenced: ${commandIds.size}`);
  console.log('Unknown tool default: blocked');
}

main();
