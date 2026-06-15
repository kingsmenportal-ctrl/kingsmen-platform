#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj43-runtime-validation.json');

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return readFileSync(filePath, 'utf8');
}

function fail(message) {
  console.error(`PJ43 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  const kernel = readText(path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'kernel.ts'));
  const index = readText(path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'index.ts'));
  const commandRegistry = readText(path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'command-registry.ts'));
  const selector = readText(path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'adapter-selector.ts'));
  const evidence = readText(path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'evidence-ledger.ts'));

  if (!kernel.includes('runJarvisKernel')) fail('kernel must export runJarvisKernel.');
  if (!kernel.includes('runJarvisKernelSmokeTest')) fail('kernel must export runJarvisKernelSmokeTest.');
  if (!commandRegistry.includes('BLOCKED_UNKNOWN_COMMAND')) fail('command registry must include fallback command guard.');
  if (!selector.includes('known')) fail('adapter selector must include registered adapter guard.');
  if (!evidence.includes('createEvidenceEntry')) fail('evidence ledger must create evidence entries.');
  if (!index.includes("export * from './kernel'")) fail('runtime index must export kernel.');
  if (!index.includes("export * from './intent-router'")) fail('runtime index must export intent router.');

  if (process.exitCode) return;
  console.log('PJ43 VALIDATION PASSED');
  console.log(`Required files checked: ${(validation.required_files || []).length}`);
  console.log('Runtime kernel present.');
  console.log('Runtime index exports present.');
}

main();
