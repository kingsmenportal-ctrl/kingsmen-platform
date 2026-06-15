import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const checks = [
  {
    path: 'packages/jarvis-core/src/jarvis-hud-route-handler.ts',
    tokens: ['jarvisCreateHudRouteHandler', 'JARVIS_HUD_ROUTE_HANDLER_LIVE']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-founder-console-read-model.ts',
    tokens: ['jarvisCreateFounderConsoleReadModel', 'JARVIS_FOUNDER_CONSOLE_READ_MODEL_LIVE']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-build-session-store.ts',
    tokens: ['jarvisCreateBuildSession', 'jarvisAdvanceBuildSession', 'JARVIS_BUILD_SESSION_STORE_LIVE']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-task-state-machine-adapter.ts',
    tokens: ['jarvisCanTransitionTask', 'jarvisApplyTaskTransition', 'JARVIS_TASK_STATE_MACHINE_ADAPTER_LIVE']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-patch-review-decision-flow.ts',
    tokens: ['jarvisDecidePatchReview', 'JARVIS_PATCH_REVIEW_DECISION_FLOW_LIVE']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-validator-report-viewer.ts',
    tokens: ['jarvisCreateValidatorReportView', 'JARVIS_VALIDATOR_REPORT_VIEWER_LIVE']
  }
];

const results = checks.map((check) => {
  const absolutePath = join(root, check.path);
  if (!existsSync(absolutePath)) {
    return { path: check.path, status: 'failed', missing: ['file'] };
  }
  const content = readFileSync(absolutePath, 'utf8');
  const missing = check.tokens.filter((token) => !content.includes(token));
  return { path: check.path, status: missing.length === 0 ? 'passed' : 'failed', missing };
});

const failed = results.filter((result) => result.status === 'failed');
const report = {
  validator: 'validate-jarvis-live-pass-05',
  status: failed.length === 0 ? 'passed' : 'failed',
  generatedAt: new Date().toISOString(),
  results
};

const reportPath = join(root, 'reports/jarvis/validate-jarvis-live-pass-05.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (failed.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
