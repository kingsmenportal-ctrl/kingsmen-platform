#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj54-deployment-operator-runbook-validation.json');

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ54 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const validation = readJson(validationPath);
  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  const deployment = readJson(path.join(root, 'manifests', 'jarvis', 'pj54-deployment-checklist.json'));
  const routine = readJson(path.join(root, 'manifests', 'jarvis', 'pj54-operator-daily-routine.json'));
  const health = readJson(path.join(root, 'manifests', 'jarvis', 'pj54-runtime-health-checklist.json'));
  const incidents = readJson(path.join(root, 'manifests', 'jarvis', 'pj54-incident-repair-playbook.json'));
  const release = readJson(path.join(root, 'manifests', 'jarvis', 'pj54-release-evidence-checklist.json'));

  if (!Array.isArray(deployment.mode_order) || deployment.mode_order.length < 4) fail('deployment mode order missing.');
  if (!Array.isArray(routine.routine_blocks) || routine.routine_blocks.length < 3) fail('operator routine blocks missing.');
  if (!Array.isArray(health.health_surfaces) || health.health_surfaces.length === 0) fail('health surfaces missing.');
  if (!Array.isArray(incidents.incident_classes) || incidents.incident_classes.length === 0) fail('incident classes missing.');
  if (!Array.isArray(release.release_evidence_required) || release.release_evidence_required.length === 0) fail('release evidence list missing.');
  if (validation.next_phase !== 'PJ55 Jarvis Final Runtime Closeout') fail('next phase must be PJ55 Jarvis Final Runtime Closeout.');

  if (process.exitCode) return;
  console.log('PJ54 VALIDATION PASSED');
  console.log(`Deployment modes: ${deployment.mode_order.length}`);
  console.log(`Routine blocks: ${routine.routine_blocks.length}`);
  console.log(`Health surfaces: ${health.health_surfaces.length}`);
  console.log(`Incident classes: ${incidents.incident_classes.length}`);
}

main();
