import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = new Set(process.argv.slice(2));
const gateMode = args.has('--gate');
const modeArg = gateMode ? '--gate' : '--audit';

function relative(path) {
  return join(repoRoot, path);
}

function readJson(path) {
  const full = relative(path);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(path, value) {
  const full = relative(path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function evidencePassed(path) {
  const report = readJson(path);
  return Boolean(
    report &&
    report.exists !== false &&
    report.passed === true &&
    report.reviewed !== false &&
    report.redacted !== false
  );
}

function finalBundleReady() {
  const bundle = readJson('reports/final-assembly/final-assembly-evidence-bundle-latest.json');
  return Boolean(
    bundle &&
    bundle.totalReports > 0 &&
    bundle.presentReports === bundle.totalReports &&
    bundle.passedReports === bundle.totalReports &&
    bundle.reviewedReports === bundle.totalReports &&
    bundle.redactedReports === bundle.totalReports
  );
}

const original = spawnSync(process.execPath, ['scripts/validators/validate-kingsmen-launch-readiness.mjs', modeArg], {
  cwd: repoRoot,
  encoding: 'utf8'
});

const report = readJson('reports/launch/kingsmen-launch-readiness-latest.json');
if (!report) {
  if (original.stdout) process.stdout.write(original.stdout);
  if (original.stderr) process.stderr.write(original.stderr);
  process.exitCode = original.status ?? 1;
} else {
  const evidenceByWarningCode = {
    MAIN_BRANCH_PROTECTION_APPLY_REQUIRED: 'reports/repo/main-branch-protection-apply-latest.json',
    RLS_STAGING_PROOF_REQUIRED: 'reports/staging/rls-sql-isolation-staging-latest.json',
    BACKUP_RESTORE_STAGING_DRILL_REQUIRED: 'reports/staging/backup-restore-drill-staging-latest.json',
    SECRETS_RUNTIME_HEALTH_PROOF_REQUIRED: 'reports/security/secrets-wiring-runtime-health-latest.json',
    COMMUNICATIONS_PROVIDER_STAGING_PROOF_REQUIRED: 'reports/staging/communications-provider-staging-latest.json',
    OBSERVABILITY_STAGING_PROOF_REQUIRED: 'reports/staging/observability-incident-staging-latest.json',
    LEGAL_PRIVACY_PUBLICATION_PROOF_REQUIRED: 'reports/staging/legal-privacy-publication-staging-latest.json'
  };

  const originalWarnings = Array.isArray(report.warnings) ? report.warnings : [];
  const evidenceAwareWarnings = originalWarnings.filter((warning) => {
    const evidencePath = evidenceByWarningCode[warning.code];
    if (!evidencePath) return true;
    return !evidencePassed(evidencePath);
  });

  const bundleIsReady = finalBundleReady();
  const finalWarningCodes = new Set([
    'STAGING_RUNTIME_EVIDENCE_PACK_REQUIRED',
    'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_REQUIRED'
  ]);

  report.warnings = evidenceAwareWarnings.filter((warning) => {
    if (!finalWarningCodes.has(warning.code)) return true;
    return !bundleIsReady;
  });

  report.summary = {
    ...report.summary,
    warnings: report.warnings.length
  };
  report.evidenceAwareWarnings = true;
  report.warningFilter = {
    sourceValidator: 'validate-kingsmen-launch-readiness',
    suppressedWarnings: originalWarnings.length - report.warnings.length,
    rule: 'Suppress source-boundary warnings only when matching runtime evidence is passed, reviewed, and redacted.'
  };

  writeJson('reports/launch/kingsmen-launch-readiness-latest.json', report);

  console.log(report.publicLaunchStatus === 'open' ? 'KINGSMEN_LAUNCH_GATE_OPEN' : 'KINGSMEN_LAUNCH_GATE_BLOCKED');
  console.log(JSON.stringify(report, null, 2));

  if (gateMode && Array.isArray(report.blockers) && report.blockers.length > 0) {
    process.exitCode = 1;
  }
}
