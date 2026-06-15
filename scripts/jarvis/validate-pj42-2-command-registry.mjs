#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'manifests', 'jarvis', 'jarvis-command-registry.json');
const categoriesPath = path.join(root, 'manifests', 'jarvis', 'jarvis-command-categories.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-command-registry-validation.json');

const allowedRisk = new Set(['safe_read', 'safe_generate', 'review_required', 'approval_required', 'blocked']);
const requiredFields = [
  'command_id',
  'label',
  'category',
  'description',
  'risk_level',
  'allowed_actor',
  'adapter',
  'approval_required',
  'evidence_required',
  'timeout_ms',
  'output_surface',
  'rollback_note'
];

function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.2 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const registry = readJson(registryPath);
  const categories = readJson(categoriesPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (registry.default_unknown_command !== 'blocked') {
    fail('default_unknown_command must be blocked.');
  }

  if (!Array.isArray(registry.commands) || registry.commands.length === 0) {
    fail('commands array is missing or empty.');
    return;
  }

  const categoryIds = new Set((categories.categories || []).map((item) => item.id));
  const commandIds = new Set();

  for (const command of registry.commands) {
    for (const field of requiredFields) {
      if (!(field in command)) fail(`${command.command_id || 'UNKNOWN'} missing field ${field}`);
    }

    if (commandIds.has(command.command_id)) fail(`Duplicate command_id: ${command.command_id}`);
    commandIds.add(command.command_id);

    if (!/^[A-Z0-9_]+$/.test(command.command_id)) fail(`Invalid command_id format: ${command.command_id}`);
    if (!categoryIds.has(command.category)) fail(`${command.command_id} uses unknown category ${command.category}`);
    if (!allowedRisk.has(command.risk_level)) fail(`${command.command_id} uses unknown risk level ${command.risk_level}`);
    if (command.evidence_required !== true) fail(`${command.command_id} must require evidence.`);
    if (command.risk_level === 'blocked' && !command.blocked_reason) fail(`${command.command_id} is blocked but has no blocked_reason.`);
    if (command.risk_level === 'approval_required' && command.approval_required !== true) fail(`${command.command_id} requires approval risk but approval_required is not true.`);
    if (!Array.isArray(command.output_surface) || command.output_surface.length === 0) fail(`${command.command_id} must define output_surface.`);
    if (!Array.isArray(command.allowed_actor) || command.allowed_actor.length === 0) fail(`${command.command_id} must define allowed_actor.`);
  }

  if (process.exitCode) return;

  console.log('PJ42.2 VALIDATION PASSED');
  console.log(`Commands validated: ${registry.commands.length}`);
  console.log(`Categories validated: ${categoryIds.size}`);
  console.log('Unknown command default: blocked');
}

main();
