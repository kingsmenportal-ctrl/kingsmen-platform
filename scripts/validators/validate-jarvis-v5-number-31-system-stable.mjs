import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const checks = [
  ['docs/jarvis/v5/script-library/NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md', 'NUMBER 31 — WHEN THE SYSTEM IS STABLE'],
  ['packages/jarvis-core/src/system-stable-boundary.ts', 'jarvisAssessSystemStableRequest'],
  ['apps/web/src/app/api/jarvis/system-stable/route.ts', 'doNotInventUrgency'],
  ['apps/web/src/app/jarvis/components/JarvisSystemStablePanel.tsx', 'JarvisSystemStablePanel']
];

for (const [path, token] of checks) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) throw new Error(`Missing required file: ${path}`);
  const text = readFileSync(full, 'utf8');
  if (!text.includes(token)) throw new Error(`Missing token ${token} in ${path}`);
  if (text.includes('productionCompletion: true') || text.includes('runtimeProof: "passed"')) {
    throw new Error(`False runtime or production proof claim in ${path}`);
  }
}

console.log('JARVIS_V5_NUMBER_31_SYSTEM_STABLE_VALIDATION_PASSED');
