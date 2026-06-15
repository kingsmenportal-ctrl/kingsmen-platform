import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const checks = [
  {
    path: 'packages/jarvis-core/src/live-pass-06-index.ts',
    tokens: ['jarvis-patch-review-hud-panel', 'jarvis-validator-aggregator-safe'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-validator-aggregator-safe.ts',
    tokens: ['JarvisSafeValidatorAggregate', 'jarvisAggregateValidatorReportsSafe'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-founder-console-route-readonly.ts',
    tokens: ['JarvisFounderConsoleRouteReadonlyModel', 'read_model_only'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-build-session-persistence-adapter.ts',
    tokens: ['JarvisBuildSessionPersistenceRecord', 'store_snapshot_only'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-patch-review-hud-panel.ts',
    tokens: ['JarvisPatchReviewHudPanel', 'read_only_review'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-validator-report-hud-panel.ts',
    tokens: ['JarvisValidatorReportHudPanel', 'read_only_validation'],
  },
];

const results = checks.map((check) => {
  const absolute = join(root, check.path);
  if (!existsSync(absolute)) {
    return { path: check.path, status: 'fail', missing: ['file'] };
  }
  const content = readFileSync(absolute, 'utf8');
  const missing = check.tokens.filter((token) => !content.includes(token));
  return {
    path: check.path,
    status: missing.length === 0 ? 'pass' : 'fail',
    missing,
  };
});

const report = {
  validator: 'validate-jarvis-live-pass-06',
  status: results.every((result) => result.status === 'pass') ? 'pass' : 'fail',
  checkedAt: new Date().toISOString(),
  results,
};

const reportPath = join(root, 'reports/jarvis/validate-jarvis-live-pass-06.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
