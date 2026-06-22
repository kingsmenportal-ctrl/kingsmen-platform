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
const founderApprovalRef = flags.getAll(['founder-approval-ref', 'founderapprovalref'], '');
const requestedBy = flags.getAll(['requested-by', 'requestedby'], 'operator');
const dryRun = !flags.has('execute');
const outputPath = flags.getAll(['output-path', 'outputpath'], 'reports/jarvis/jarvis-switch-request-latest.json');

const readinessPath = path.join(repoRoot, 'reports/jarvis/jarvis-live-readiness-latest.json');
const readinessRead = readJsonFileSafe(readinessPath);
const readiness = readinessRead.value;
const readinessOk = Boolean(readinessRead.ok && readiness && readiness.passed === true && readiness.status === 'JARVIS_READY_FOR_CONTROLLED_SWITCH_REVIEW');
const approvalOk = founderApprovalRef.trim().length > 0;

const blockers = [
  ...(readinessOk ? [] : ['jarvis_live_readiness_not_ready']),
  ...(approvalOk ? [] : ['founder_approval_ref_missing']),
];
const authorized = blockers.length === 0;

const report = {
  schema: 'kingsmen.jarvis-switch-request.v1',
  status: authorized ? (dryRun ? 'JARVIS_SWITCH_REQUEST_DRY_RUN_READY' : 'JARVIS_SWITCH_REQUEST_READY_FOR_CONTROLLED_DEPLOYMENT') : 'JARVIS_SWITCH_REQUEST_BLOCKED',
  passed: authorized,
  switchAuthorized: authorized,
  switchExecuted: false,
  dryRun,
  requestedBy,
  founderApprovalRef: approvalOk ? founderApprovalRef : null,
  readinessStatus: readiness?.status ?? 'MISSING_READINESS_REPORT',
  blockers,
  productionReady: false,
  publicLaunchAllowed: false,
  generatedAt: utcNowIso(),
  nextAction: authorized
    ? 'Use controlled deployment review. This simulator does not directly switch live traffic.'
    : 'Complete blocked readiness and approval requirements first.',
};

const output = writeJsonFile(path.join(repoRoot, outputPath), report);
process.stdout.write(output);
if (!authorized) process.exit(1);
