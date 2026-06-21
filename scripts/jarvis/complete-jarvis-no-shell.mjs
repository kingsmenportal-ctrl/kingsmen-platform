#!/usr/bin/env node
import path from 'node:path';
import { parseFlags, readJsonFileSafe, resolveRepoRoot, utcNowIso, writeJsonFile } from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const finalEvidenceBundlePath = flags.getAll(['final-evidence-bundle-path', 'finalevidencebundlepath'], 'reports/final-assembly/final-assembly-evidence-bundle-latest.json');
const activationMatrixPath = flags.getAll(['activation-matrix-path', 'activationmatrixpath'], 'reports/jarvis/jarvis-module-activation-matrix-latest.json');
const launchReportPath = flags.getAll(['launch-report-path', 'launchreportpath'], 'reports/launch/kingsmen-launch-readiness-latest.json');
const outputPath = flags.getAll(['output-path', 'outputpath'], 'reports/jarvis/jarvis-completion-status-latest.json');

function read(relativePath) {
  const parsed = readJsonFileSafe(path.join(repoRoot, relativePath));
  return parsed.ok ? parsed.value : null;
}

const finalBundle = read(finalEvidenceBundlePath);
const activationMatrix = read(activationMatrixPath);
const launchReport = read(launchReportPath);

const finalReports = Array.isArray(finalBundle?.reports) ? finalBundle.reports : [];
const finalBlockedReports = finalReports.filter((report) => !(report.exists && report.passed && report.reviewed && report.redacted));
const activationModules = Array.isArray(activationMatrix?.modules) ? activationMatrix.modules : [];
const blockedModules = activationModules.filter((module) => module.readyForLiveAfterApproval !== true);
const launchBlockers = Array.isArray(launchReport?.blockers) ? launchReport.blockers : [];
const launchWarnings = Array.isArray(launchReport?.warnings) ? launchReport.warnings : [];

const evidenceComplete = finalBlockedReports.length === 0 && finalBundle?.status === 'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW';
const activationComplete = blockedModules.length === 0 && activationMatrix?.status === 'JARVIS_MODULE_ACTIVATION_MATRIX_READY_FOR_FOUNDER_APPROVAL';
const launchGateOpen = launchBlockers.length === 0 && launchReport?.publicLaunchStatus === 'open';
const passed = evidenceComplete && activationComplete && launchGateOpen;

const report = {
  schema: 'kingsmen.jarvis-completion-status.v1',
  module: 'Jarvis Completion Status',
  status: passed ? 'JARVIS_READY_FOR_FOUNDER_APPROVAL' : 'JARVIS_COMPLETE_BLOCKED_BY_EXTERNAL_GATES',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noShellRuntime: true,
  finalEvidenceBundlePath,
  activationMatrixPath,
  launchReportPath,
  finalAssembly: {
    status: finalBundle?.status ?? 'MISSING_FINAL_BUNDLE',
    totalReports: finalBundle?.totalReports ?? 0,
    passedReports: finalBundle?.passedReports ?? 0,
    reviewedReports: finalBundle?.reviewedReports ?? 0,
    blockedReportCount: finalBlockedReports.length,
    blockedReports: finalBlockedReports.map((item) => ({ path: item.path, status: item.status, passed: Boolean(item.passed), reviewed: Boolean(item.reviewed) })),
  },
  activation: {
    status: activationMatrix?.status ?? 'MISSING_ACTIVATION_MATRIX',
    moduleCount: activationMatrix?.moduleCount ?? activationModules.length,
    readyForLiveCount: activationMatrix?.readyForLiveCount ?? activationModules.filter((item) => item.readyForLiveAfterApproval).length,
    blockedCount: activationMatrix?.blockedCount ?? blockedModules.length,
    blockedModules: blockedModules.map((item) => ({ moduleRef: item.moduleRef, status: item.status, evidenceStatus: item.evidenceStatus })),
  },
  launchGate: {
    status: launchReport?.publicLaunchStatus ?? 'MISSING_LAUNCH_REPORT',
    blockerCount: launchBlockers.length,
    warningCount: launchWarnings.length,
    blockers: launchBlockers.map((item) => ({ code: item.code, title: item.title })),
    warnings: launchWarnings.map((item) => ({ code: item.code, title: item.title })),
  },
  generatedAt: utcNowIso(),
  nextAction: passed
    ? 'Founder may review production activation. Live writes still require explicit founder approval.'
    : 'Resolve remaining external provider and account gates. Jarvis status generation is complete.',
};

const output = writeJsonFile(path.join(repoRoot, outputPath), report);
process.stdout.write(output);
if (!passed) process.exit(1);
