#!/usr/bin/env node
import path from 'node:path';
import {
  parseFlags,
  readJsonFileSafe,
  resolveRepoRoot,
  utcNowIso,
  writeJsonFile,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const outputPath = flags.getAll(['output-path', 'outputpath'], 'reports/jarvis/jarvis-controlled-switch-simulation-latest.json');
const founderApprovalRef = flags.getAll(['founder-approval-ref', 'founderapprovalref'], '');
const requestedBy = flags.getAll(['requested-by', 'requestedby'], 'operator');

function read(relativePath) {
  return readJsonFileSafe(path.join(repoRoot, relativePath));
}

const readiness = read('reports/jarvis/jarvis-live-readiness-latest.json').value;
const readinessOk = readiness?.passed === true;
const approvalOk = founderApprovalRef.trim().length > 0;
const blockedBy = [
  ...(readinessOk ? [] : ['jarvis_live_readiness_not_passed']),
  ...(approvalOk ? [] : ['founder_approval_ref_missing']),
];
const authorized = blockedBy.length === 0;

const report = {
  schema: 'kingsmen.jarvis-controlled-switch-simulation.v1',
  status: authorized ? 'JARVIS_CONTROLLED_SWITCH_SIMULATION_READY' : 'JARVIS_CONTROLLED_SWITCH_SIMULATION_BLOCKED',
  passed: authorized,
  switchAuthorized: authorized,
  switchExecuted: false,
  productionReady: false,
  publicLaunchAllowed: false,
  requestedBy,
  founderApprovalRef: approvalOk ? founderApprovalRef : null,
  readinessStatus: readiness?.status ?? 'MISSING_JARVIS_LIVE_READINESS_REPORT',
  blockedBy,
  generatedAt: utcNowIso(),
  nextAction: authorized
    ? 'Simulation ready. Actual switch must happen through controlled deployment process.'
    : 'Complete readiness and founder approval before controlled switch simulation can pass.',
};

const output = writeJsonFile(path.join(repoRoot, outputPath), report);
process.stdout.write(output);
if (!authorized) process.exit(1);
