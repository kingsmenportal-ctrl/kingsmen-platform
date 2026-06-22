#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['live_switch_guard', 'packages/jarvis-core/src/jarvis-live-switch-guard.ts', 'jarvisEvaluateLiveSwitch'],
  ['core_export', 'packages/jarvis-core/src/index.ts', 'jarvis-live-switch-guard'],
  ['api_gate_eval', 'apps/api/src/jarvis/jarvis-gates-api.ts', 'evaluateApiJarvisGates'],
  ['web_gate_api', 'apps/web/src/app/api/jarvis/gates/route.ts', 'JARVIS_GATES_BLOCKED'],
  ['live_readiness', 'scripts/jarvis/complete-jarvis-live-readiness.mjs', 'JARVIS_LIVE_READINESS_BLOCKED'],
  ['package_readiness_script', 'package.json', 'jarvis:live:readiness'],
  ['gates_ui_dynamic', 'apps/web/src/app/admin/jarvis-gates/page.tsx', '/api/jarvis/gates'],
];

const results = checks.map(([name, relativePath, token]) => {
  const fullPath = path.join(root, relativePath);
  const exists = fs.existsSync(fullPath);
  const content = exists ? fs.readFileSync(fullPath, 'utf8') : '';
  return {
    name,
    path: relativePath,
    passed: exists && content.includes(token),
  };
});

const passed = results.every((item) => item.passed);
console.log(JSON.stringify({
  validator: 'validate-jarvis-complete-live-batch',
  status: passed ? 'JARVIS_COMPLETE_LIVE_BATCH_VALIDATED' : 'JARVIS_COMPLETE_LIVE_BATCH_FAILED',
  passed,
  checks: results,
  generatedAtIso: new Date().toISOString()
}, null, 2));

if (!passed) process.exit(1);
