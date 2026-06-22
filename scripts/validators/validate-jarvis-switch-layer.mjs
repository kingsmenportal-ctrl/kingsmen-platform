#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['switch_api', 'apps/web/src/app/api/jarvis/switch-request/route.ts', 'JARVIS_SWITCH_REQUEST_BLOCKED'],
  ['switch_page', 'apps/web/src/app/admin/jarvis-switch/page.tsx', 'Controlled Switch Request'],
  ['switch_simulator', 'scripts/jarvis/simulate-jarvis-controlled-switch.mjs', 'JARVIS_CONTROLLED_SWITCH_SIMULATION_BLOCKED'],
  ['admin_link', 'apps/web/src/app/admin/page.tsx', '/admin/jarvis-switch'],
  ['readiness_api', 'apps/web/src/app/api/jarvis/live-readiness/route.ts', 'JARVIS_LIVE_READINESS_BLOCKED'],
];

const results = checks.map(([name, file, token]) => {
  const full = path.join(root, file);
  const exists = fs.existsSync(full);
  const text = exists ? fs.readFileSync(full, 'utf8') : '';
  return { name, file, passed: exists && text.includes(token) };
});

const passed = results.every((item) => item.passed);
console.log(JSON.stringify({
  validator: 'validate-jarvis-switch-layer',
  status: passed ? 'JARVIS_SWITCH_LAYER_VALIDATED' : 'JARVIS_SWITCH_LAYER_FAILED',
  passed,
  checks: results,
  generatedAtIso: new Date().toISOString()
}, null, 2));

if (!passed) process.exit(1);
