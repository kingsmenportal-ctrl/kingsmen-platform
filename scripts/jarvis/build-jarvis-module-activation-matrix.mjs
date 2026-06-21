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
const credentialReportPath = flags.getAll(['credential-report-path', 'credentialreportpath'], 'reports/jarvis/jarvis-credential-readiness-latest.json');
const finalEvidenceBundlePath = flags.getAll(['final-evidence-bundle-path', 'finalevidencebundlepath'], 'reports/final-assembly/final-assembly-evidence-bundle-latest.json');
const outputPath = flags.getAll(['output-path', 'outputpath'], 'reports/jarvis/jarvis-module-activation-matrix-latest.json');

function readJson(relativePath) {
  const parsed = readJsonFileSafe(path.join(repoRoot, relativePath));
  return parsed.ok ? parsed.value : null;
}

const credentialReport = readJson(credentialReportPath);
const finalEvidenceBundle = readJson(finalEvidenceBundlePath);

function moduleCredentialReady(moduleRef) {
  const modules = Array.isArray(credentialReport?.modules) ? credentialReport.modules : [];
  const module = modules.find((item) => item.moduleRef === moduleRef);
  return Boolean(module?.readyForStagingProof);
}

function evidenceReport(relativePath) {
  const fromBundle = Array.isArray(finalEvidenceBundle?.reports)
    ? finalEvidenceBundle.reports.find((item) => item.path === relativePath)
    : null;
  if (fromBundle) return fromBundle;

  const direct = readJson(relativePath);
  if (!direct) return null;
  return {
    path: relativePath,
    exists: true,
    passed: Boolean(direct.passed),
    reviewed: Boolean(direct.reviewed),
    redacted: Boolean(direct.redacted ?? true),
    status: direct.status ? String(direct.status) : 'STATUS_NOT_REPORTED',
    generatedAt: direct.generatedAt ?? null,
  };
}

function activationModule({ moduleRef, displayName, credentialModuleRef, evidencePath, credentialRequired = true, evidenceRequired = true }) {
  const credentialReady = credentialRequired ? moduleCredentialReady(credentialModuleRef) : true;
  const evidence = evidenceRequired ? evidenceReport(evidencePath) : null;
  const evidencePassed = evidenceRequired ? Boolean(evidence?.passed) : true;
  const evidenceReviewed = evidenceRequired ? Boolean(evidence?.reviewed) : true;
  const evidenceRedacted = evidenceRequired ? Boolean(evidence?.redacted) : true;
  const evidenceStatus = evidenceRequired ? (evidence ? String(evidence.status) : 'MISSING_EVIDENCE_REPORT') : 'NOT_REQUIRED';
  const readyForStagingProof = credentialReady;
  const readyForLiveAfterApproval = credentialReady && evidencePassed && evidenceReviewed && evidenceRedacted;

  let status = 'READY_FOR_LIVE_AFTER_APPROVAL';
  if (!credentialReady) status = 'BLOCKED_CREDENTIALS';
  else if (!evidencePassed) status = 'BLOCKED_STAGING_EVIDENCE';
  else if (!evidenceReviewed) status = 'BLOCKED_FOUNDER_REVIEW';
  else if (!evidenceRedacted) status = 'BLOCKED_REDACTION';

  return {
    moduleRef,
    displayName,
    credentialModuleRef: credentialRequired ? credentialModuleRef : 'NOT_REQUIRED',
    evidencePath: evidenceRequired ? evidencePath : 'NOT_REQUIRED',
    credentialReady,
    evidencePassed,
    evidenceReviewed,
    evidenceRedacted,
    evidenceStatus,
    readyForStagingProof,
    readyForLiveAfterApproval,
    status,
  };
}

const modules = [
  activationModule({ moduleRef: 'truth_vault', displayName: 'PostgreSQL Truth Vault', credentialModuleRef: 'truth_vault', evidencePath: 'reports/staging/truth-vault-persistence-staging-latest.json' }),
  activationModule({ moduleRef: 'web_backend_boundary', displayName: 'Web to Backend Boundary', credentialModuleRef: 'web_backend_boundary', evidencePath: 'reports/staging/web-backend-boundary-staging-latest.json' }),
  activationModule({ moduleRef: 'queue_fabric', displayName: 'Redis Queue Fabric', credentialModuleRef: 'queue_fabric', evidencePath: 'reports/staging/observability-incident-staging-latest.json' }),
  activationModule({ moduleRef: 'payments', displayName: 'PayFast Payments', credentialModuleRef: 'payments', evidencePath: 'reports/staging/payfast-provider-sandbox-staging-latest.json' }),
  activationModule({ moduleRef: 'communications', displayName: 'Email / WhatsApp / SMS Communications', credentialModuleRef: 'communications', evidencePath: 'reports/staging/communications-provider-staging-latest.json' }),
  activationModule({ moduleRef: 'document_vault', displayName: 'Document Vault Storage', credentialModuleRef: 'document_vault', evidencePath: 'reports/staging/document-vault-storage-staging-latest.json' }),
  activationModule({ moduleRef: 'legal_privacy', displayName: 'Legal Privacy Publication', credentialModuleRef: 'NOT_REQUIRED', credentialRequired: false, evidencePath: 'reports/staging/legal-privacy-publication-staging-latest.json' }),
  activationModule({ moduleRef: 'branch_protection', displayName: 'GitHub Main Branch Protection', credentialModuleRef: 'NOT_REQUIRED', credentialRequired: false, evidencePath: 'reports/repo/main-branch-protection-apply-latest.json' }),
];

const blocked = modules.filter((module) => module.readyForLiveAfterApproval !== true);
const ready = modules.filter((module) => module.readyForLiveAfterApproval === true);
const allReady = blocked.length === 0;

const report = {
  schema: 'kingsmen.jarvis-module-activation-matrix.v1',
  module: 'Jarvis Module Activation Matrix',
  status: allReady ? 'JARVIS_MODULE_ACTIVATION_MATRIX_READY_FOR_FOUNDER_APPROVAL' : 'JARVIS_MODULE_ACTIVATION_MATRIX_BLOCKED',
  passed: allReady,
  productionReady: false,
  publicLaunchAllowed: false,
  rawSecretsPrinted: false,
  rawConnectionStringsPrinted: false,
  jarvisMayStoreSecrets: false,
  credentialReportPath,
  finalEvidenceBundlePath,
  moduleCount: modules.length,
  readyForLiveCount: ready.length,
  blockedCount: blocked.length,
  modules,
  generatedAt: utcNowIso(),
  nextAction: allReady
    ? 'Founder may review live activation approvals. Do not enable production writes without explicit founder approval.'
    : 'Resolve blocked credentials and staging evidence, then rebuild the Jarvis module activation matrix.',
};

const output = writeJsonFile(path.join(repoRoot, outputPath), report);
process.stdout.write(output);
if (!allReady) process.exit(1);
