#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj55-validation.json');
const closeoutPath = path.join(root, 'manifests', 'jarvis', 'pj55-final-runtime-closeout.json');
const statusPath = path.join(root, 'manifests', 'jarvis', 'pj55-runtime-status-map.json');
const repairsPath = path.join(root, 'manifests', 'jarvis', 'pj55-deferred-repair-carryover.json');
const nextPath = path.join(root, 'manifests', 'jarvis', 'pj55-next-pj56-plan.json');

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ55 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const validation = readJson(validationPath);
  const closeout = readJson(closeoutPath);
  const status = readJson(statusPath);
  const repairs = readJson(repairsPath);
  const next = readJson(nextPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file missing: ${file}`);
  }

  if (closeout.production_claim_allowed !== false) fail('production_claim_allowed must be false.');
  if (closeout.safe_preview_allowed !== true) fail('safe_preview_allowed must be true.');
  if (!Array.isArray(closeout.governed_runtime_path) || closeout.governed_runtime_path.length === 0) fail('governed runtime path missing.');

  if (status.production_ready !== false) fail('PJ55 must not mark production_ready true.');
  if (!Array.isArray(status.runtime_status) || status.runtime_status.length === 0) fail('runtime_status missing.');

  if (!Array.isArray(repairs.repair_items) || repairs.repair_items.length === 0) fail('repair_items missing.');
  if (repairs.carry_to !== 'PJ56') fail('repair carryover must target PJ56.');

  if (next.next_phase !== 'PJ56 Jarvis Repair Sprint and Build Proof') fail('next phase must be PJ56.');
  if (!Array.isArray(next.planned_work) || next.planned_work.length === 0) fail('PJ56 planned_work missing.');

  if (process.exitCode) return;
  console.log('PJ55 VALIDATION PASSED');
  console.log(`Runtime areas: ${status.runtime_status.length}`);
  console.log(`Repair items carried: ${repairs.repair_items.length}`);
  console.log(`PJ56 work items: ${next.planned_work.length}`);
}

main();
