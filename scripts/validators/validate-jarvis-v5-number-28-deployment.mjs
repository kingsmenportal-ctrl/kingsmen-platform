import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const checks = [
  ['docs/jarvis/v5/script-library/NUMBER_28_WHEN_THE_COMMANDER_ASKS_FOR_DEPLOYMENT.md', 'NUMBER 28 — WHEN THE COMMANDER ASKS FOR DEPLOYMENT'],
  ['packages/jarvis-core/src/deployment-command-boundary.ts', 'jarvisAssessDeploymentCommandRequest'],
  ['apps/web/src/app/api/jarvis/deployment/route.ts', 'validatorsRequired'],
  ['apps/web/src/app/jarvis/components/JarvisDeploymentCommandPanel.tsx', 'JarvisDeploymentCommandPanel']
];

for (const [path, token] of checks) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) throw new Error(`Missing ${path}`);
  const text = readFileSync(full, 'utf8');
  if (!text.includes(token)) throw new Error(`Missing token ${token} in ${path}`);
  if (text.includes('productionCompletion: true') || text.includes('runtimeProof: "passed"')) {
    throw new Error(`False runtime or production proof claim in ${path}`);
  }
}

console.log('JARVIS_V5_NUMBER_28_DEPLOYMENT_VALIDATION_PASSED');
