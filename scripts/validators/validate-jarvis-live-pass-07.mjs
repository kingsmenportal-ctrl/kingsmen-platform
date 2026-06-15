import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const checks = [
  {
    path: 'packages/jarvis-core/src/jarvis-founder-console-page-shell.ts',
    tokens: ['JarvisFounderConsolePageShell', 'jarvisCreateFounderConsolePageShell', 'JARVIS_FOUNDER_CONSOLE_PAGE_SHELL_LIVE'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-hud-panel-composer.ts',
    tokens: ['JarvisHudPanelComposition', 'jarvisComposeHudPanels', 'JARVIS_HUD_PANEL_COMPOSER_LIVE'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-build-session-list-view.ts',
    tokens: ['JarvisBuildSessionListView', 'jarvisCreateBuildSessionListView', 'JARVIS_BUILD_SESSION_LIST_VIEW_LIVE'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-review-queue-read-route.ts',
    tokens: ['JarvisReviewQueueReadRoute', 'jarvisCreateReviewQueueReadRoute', 'JARVIS_REVIEW_QUEUE_READ_ROUTE_LIVE'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-validation-report-list-view.ts',
    tokens: ['JarvisValidationReportListView', 'jarvisCreateValidationReportListView', 'JARVIS_VALIDATION_REPORT_LIST_VIEW_LIVE'],
  },
  {
    path: 'packages/jarvis-core/src/jarvis-pass-validator-registry.ts',
    tokens: ['JarvisPassValidatorRegistry', 'jarvisCreatePassValidatorRegistry', 'JARVIS_PASS_VALIDATOR_REGISTRY_LIVE'],
  },
];

const results = checks.map((check) => {
  if (!existsSync(check.path)) {
    return { path: check.path, ok: false, missingTokens: check.tokens, reason: 'missing_file' };
  }
  const content = readFileSync(check.path, 'utf8');
  const missingTokens = check.tokens.filter((token) => !content.includes(token));
  return { path: check.path, ok: missingTokens.length === 0, missingTokens, reason: missingTokens.length ? 'missing_tokens' : 'ok' };
});

const ok = results.every((result) => result.ok);
const report = {
  validatorRef: 'validate-jarvis-live-pass-07',
  status: ok ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  checkedCount: results.length,
  results,
};

const reportPath = 'reports/jarvis/validate-jarvis-live-pass-07.json';
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
