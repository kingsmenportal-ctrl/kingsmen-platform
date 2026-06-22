#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['contracts', 'packages/contracts/src/jarvis/index.ts', 'JarvisCommandEnvelope'],
  ['policy_gate', 'packages/jarvis-core/src/jarvis-policy-gate.ts', 'jarvisEvaluatePolicy'],
  ['runtime_controller', 'packages/jarvis-core/src/jarvis-runtime-controller.ts', 'jarvisControlCommand'],
  ['evidence_ledger', 'packages/jarvis-core/src/jarvis-evidence-ledger.ts', 'jarvisStartEvidenceLedger'],
  ['core_exports', 'packages/jarvis-core/src/index.ts', 'jarvis-runtime-controller'],
  ['backend_runtime_eval', 'apps/api/src/jarvis/jarvis-runtime-api.ts', 'evaluateApiJarvisRuntime'],
  ['backend_adapter', 'apps/api/src/jarvis/jarvis-runtime-server-adapter.ts', 'handleJarvisRuntimeControlWithAdapter'],
  ['backend_server_route', 'apps/api/src/server.ts', '/api/jarvis/runtime-control'],
  ['web_runtime_proxy', 'apps/web/src/app/api/jarvis/runtime-control/route.ts', 'kingsmenBackendJson'],
  ['jarvis_status_api', 'apps/web/src/app/api/jarvis/status/route.ts', 'jarvisRuntimeRouteConfirmed'],
  ['jarvis_live_ui', 'apps/web/src/app/admin/jarvis-live/page.tsx', 'Jarvis Live Runtime Control'],
  ['gates_api', 'apps/web/src/app/api/jarvis/gates/route.ts', 'JARVIS_GATES_BLOCKED'],
  ['gates_ui', 'apps/web/src/app/admin/jarvis-gates/page.tsx', '/api/jarvis/gates'],
  ['readiness_api', 'apps/web/src/app/api/jarvis/live-readiness/route.ts', 'JARVIS_LIVE_READINESS_BLOCKED'],
  ['readiness_ui', 'apps/web/src/app/admin/jarvis-readiness/page.tsx', 'Live Readiness'],
  ['switch_api', 'apps/web/src/app/api/jarvis/switch-request/route.ts', 'JARVIS_SWITCH_REQUEST_BLOCKED'],
  ['switch_ui', 'apps/web/src/app/admin/jarvis-switch/page.tsx', 'Controlled Switch Request'],
  ['admin_console', 'apps/web/src/app/admin/page.tsx', '/admin/jarvis-switch'],
  ['live_guard', 'packages/jarvis-core/src/jarvis-live-switch-guard.ts', 'jarvisEvaluateLiveSwitch'],
  ['gate_eval_cli', 'scripts/jarvis/evaluate-jarvis-gates.mjs', 'JARVIS_GATES_BLOCKED'],
  ['readiness_cli', 'scripts/jarvis/complete-jarvis-live-readiness.mjs', 'JARVIS_LIVE_READINESS_BLOCKED'],
  ['switch_cli', 'scripts/jarvis/simulate-jarvis-switch-request.mjs', 'JARVIS_SWITCH_REQUEST_BLOCKED'],
  ['package_scripts', 'package.json', 'jarvis:switch:request'],
];

const results = checks.map(([name, relativePath, token]) => {
  const fullPath = path.join(root, relativePath);
  const exists = fs.existsSync(fullPath);
  const text = exists ? fs.readFileSync(fullPath, 'utf8') : '';
  return {
    name,
    path: relativePath,
    passed: exists && text.includes(token),
  };
});

const passed = results.every((item) => item.passed);
const failed = results.filter((item) => !item.passed);
const report = {
  validator: 'validate-jarvis-connected-live',
  status: passed ? 'JARVIS_CONNECTED_LIVE_VALIDATED' : 'JARVIS_CONNECTED_LIVE_FAILED',
  passed,
  failed,
  checks: results,
  generatedAtIso: new Date().toISOString(),
};

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
