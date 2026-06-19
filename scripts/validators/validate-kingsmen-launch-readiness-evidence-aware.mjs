import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptRepoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const cwdRoot = process.cwd();
const repoRoots = [...new Set([scriptRepoRoot, cwdRoot])];
const args = new Set(process.argv.slice(2));
const gateMode = args.has('--gate');
const modeArg = gateMode ? '--gate' : '--audit';

function relative(path, root = scriptRepoRoot) {
  return join(root, path);
}

function decodeJsonBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return '';

  const hasUtf16LeBom = buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe;
  const hasUtf16BeBom = buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff;
  const hasUtf8Bom = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;

  if (hasUtf16LeBom) return buffer.subarray(2).toString('utf16le');
  if (hasUtf16BeBom) {
    const swapped = Buffer.alloc(buffer.length - 2);
    for (let index = 2; index + 1 < buffer.length; index += 2) {
      swapped[index - 2] = buffer[index + 1];
      swapped[index - 1] = buffer[index];
    }
    return swapped.toString('utf16le');
  }
  if (hasUtf8Bom) return buffer.subarray(3).toString('utf8');

  const sampleLength = Math.min(buffer.length, 80);
  let nulOdd = 0;
  let nulEven = 0;
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index % 2 === 0) nulEven += 1;
    else nulOdd += 1;
  }

  if (nulOdd > nulEven && nulOdd >= 4) return buffer.toString('utf16le');

  return buffer.toString('utf8');
}

function parseJsonFile(full) {
  const raw = readFileSync(full);
  const text = decodeJsonBuffer(raw).replace(/^\uFEFF/, '').trim();
  return JSON.parse(text);
}

function readJson(path) {
  let firstFound = null;
  let firstParseError = null;

  for (const root of repoRoots) {
    const full = relative(path, root);
    if (!existsSync(full)) continue;
    if (!firstFound) firstFound = full;

    try {
      return {
        json: parseJsonFile(full),
        foundAt: full,
        parseFailed: false,
        encodingAware: true
      };
    } catch (error) {
      if (!firstParseError) {
        firstParseError = error instanceof Error ? error.message : 'unknown_parse_error';
      }
    }
  }

  if (firstFound) {
    return {
      json: null,
      foundAt: firstFound,
      parseFailed: true,
      parseError: firstParseError ?? 'unknown_parse_error',
      encodingAware: true
    };
  }

  return { json: null, foundAt: null, parseFailed: false, encodingAware: true };
}

function writeJson(path, value) {
  const full = relative(path, cwdRoot);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function reportEntryPassed(report) {
  return Boolean(
    report &&
    report.exists !== false &&
    report.passed === true &&
    report.reviewed !== false &&
    report.redacted !== false
  );
}

function readFinalBundle() {
  return readJson('reports/final-assembly/final-assembly-evidence-bundle-latest.json');
}

function evidencePassed(path, finalBundleJson) {
  const bundleReport = Array.isArray(finalBundleJson?.reports)
    ? finalBundleJson.reports.find((entry) => entry.path === path)
    : null;

  if (bundleReport) {
    return {
      passed: reportEntryPassed(bundleReport),
      source: 'final-assembly-bundle',
      found: true,
      status: bundleReport.status ?? 'unknown'
    };
  }

  const direct = readJson(path);
  return {
    passed: reportEntryPassed(direct.json),
    source: 'individual-runtime-report',
    found: Boolean(direct.foundAt),
    status: direct.json?.status ?? (direct.parseFailed ? 'parse_failed' : 'missing'),
    parseError: direct.parseError ?? null
  };
}

function finalBundleReady(finalBundleJson) {
  return Boolean(
    finalBundleJson &&
    finalBundleJson.totalReports > 0 &&
    finalBundleJson.presentReports === finalBundleJson.totalReports &&
    finalBundleJson.passedReports === finalBundleJson.totalReports &&
    finalBundleJson.reviewedReports === finalBundleJson.totalReports &&
    finalBundleJson.redactedReports === finalBundleJson.totalReports
  );
}

const original = spawnSync(process.execPath, ['scripts/validators/validate-kingsmen-launch-readiness.mjs', modeArg], {
  cwd: cwdRoot,
  encoding: 'utf8'
});

const launchReport = readJson('reports/launch/kingsmen-launch-readiness-latest.json');
const report = launchReport.json;
if (!report) {
  if (original.stdout) process.stdout.write(original.stdout);
  if (original.stderr) process.stderr.write(original.stderr);
  process.exitCode = original.status ?? 1;
} else {
  const finalBundleRead = readFinalBundle();
  const finalBundle = finalBundleRead.json;
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
  const warningEvidence = {};
  const evidenceAwareWarnings = originalWarnings.filter((warning) => {
    const evidencePath = evidenceByWarningCode[warning.code];
    if (!evidencePath) return true;
    const result = evidencePassed(evidencePath, finalBundle);
    warningEvidence[warning.code] = {
      evidencePath,
      ...result
    };
    return !result.passed;
  });

  const bundleIsReady = finalBundleReady(finalBundle);
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
    evidenceSource: finalBundle ? 'final-assembly-bundle' : 'individual-runtime-reports',
    finalBundleFound: Boolean(finalBundleRead.foundAt),
    finalBundleParsed: Boolean(finalBundle),
    finalBundleParseError: finalBundleRead.parseError ?? null,
    launchReportFound: Boolean(launchReport.foundAt),
    launchReportParsed: Boolean(launchReport.json),
    rootCandidatesChecked: repoRoots.length,
    jsonReader: 'encoding-aware-utf8-utf16le-bom',
    rule: 'Suppress source-boundary warnings only when matching runtime evidence is passed, reviewed, and redacted.',
    evidenceByWarningCode: warningEvidence
  };

  writeJson('reports/launch/kingsmen-launch-readiness-latest.json', report);

  console.log(report.publicLaunchStatus === 'open' ? 'KINGSMEN_LAUNCH_GATE_OPEN' : 'KINGSMEN_LAUNCH_GATE_BLOCKED');
  console.log(JSON.stringify(report, null, 2));

  if (gateMode && Array.isArray(report.blockers) && report.blockers.length > 0) {
    process.exitCode = 1;
  }
}
