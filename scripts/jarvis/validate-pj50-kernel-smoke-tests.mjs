#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj50-kernel-smoke-tests-validation.json');
const scenariosPath = path.join(root, 'manifests', 'jarvis', 'jarvis-kernel-smoke-scenarios.json');
const contractPath = path.join(root, 'manifests', 'jarvis', 'pj50-api-smoke-contract.json');
const smokeRuntimePath = path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'smoke-tests.ts');
const runtimeIndexPath = path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'index.ts');
const apiRoutePath = path.join(root, 'apps', 'web', 'src', 'app', 'api', 'jarvis', 'kernel', 'smoke', 'route.ts');

const requiredScenarios = new Set([
  'SMOKE_GENERAL_DIALOGUE',
  'SMOKE_KINGSMEN_KNOWLEDGE',
  'SMOKE_LIVE_DATA_ROUTE',
  'SMOKE_BLOCKED_ACTION',
  'SMOKE_SOURCE_CONFIDENCE',
  'SMOKE_ORCHESTRATOR_PLAN',
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return readFileSync(filePath, 'utf8');
}

function fail(message) {
  console.error(`PJ50 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const validation = readJson(validationPath);
  const scenarios = readJson(scenariosPath);
  const contract = readJson(contractPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  if (!Array.isArray(scenarios.scenarios) || scenarios.scenarios.length === 0) {
    fail('scenarios list missing or empty.');
    return;
  }

  const scenarioIds = new Set();
  for (const scenario of scenarios.scenarios) {
    if (scenarioIds.has(scenario.scenario_id)) fail(`Duplicate scenario_id: ${scenario.scenario_id}`);
    scenarioIds.add(scenario.scenario_id);
    for (const field of ['input', 'expected_intent', 'expected_command', 'expected_route_family', 'expected_safety_outcome']) {
      if (!scenario[field]) fail(`${scenario.scenario_id} missing ${field}`);
    }
  }

  for (const id of requiredScenarios) {
    if (!scenarioIds.has(id)) fail(`Required smoke scenario missing: ${id}`);
  }

  const smokeRuntime = readText(smokeRuntimePath);
  if (!smokeRuntime.includes('runJarvisKernelSmokeSuite')) fail('smoke-tests.ts must export runJarvisKernelSmokeSuite.');
  if (!smokeRuntime.includes('runJarvisKernel')) fail('smoke-tests.ts must call runJarvisKernel.');

  const runtimeIndex = readText(runtimeIndexPath);
  if (!runtimeIndex.includes("./smoke-tests")) fail('runtime index must export smoke-tests.');

  const apiRoute = readText(apiRoutePath);
  if (!apiRoute.includes('runJarvisKernelSmokeSuite')) fail('smoke API route must call runJarvisKernelSmokeSuite.');
  if (!apiRoute.includes('NextResponse.json')) fail('smoke API route must return JSON.');

  if (!Array.isArray(contract.suite_response_fields) || contract.suite_response_fields.length === 0) fail('contract suite_response_fields missing.');
  if (!Array.isArray(contract.result_fields) || contract.result_fields.length === 0) fail('contract result_fields missing.');

  if (process.exitCode) return;
  console.log('PJ50 VALIDATION PASSED');
  console.log(`Smoke scenarios validated: ${scenarioIds.size}`);
  console.log('Runtime smoke helper: present');
  console.log('Smoke API route: present');
}

main();
