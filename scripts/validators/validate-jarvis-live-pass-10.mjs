import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const checks = [
  ['packages/jarvis-core/src/live-pass-09-index.ts', 'JARVIS_LIVE_PASS_09_INDEX'],
  ['packages/contracts/src/jarvis/console-data-provider.ts', 'JarvisConsoleDataProviderInterface'],
  ['packages/jarvis-core/src/jarvis-founder-console-real-route-file.ts', 'JarvisFounderConsoleRealRouteFile'],
  ['packages/jarvis-core/src/jarvis-console-server-read-adapter.ts', 'JarvisConsoleServerReadAdapter'],
  ['packages/jarvis-core/src/jarvis-console-view-model-assembler.ts', 'JarvisConsoleViewModelAssembler'],
  ['packages/jarvis-core/src/jarvis-console-ui-snapshot-validator.ts', 'JarvisConsoleUiSnapshotValidator'],
];

const failures = [];

for (const [relativePath, token] of checks) {
  const absolutePath = join(root, relativePath);
  let content = '';
  try {
    content = readFileSync(absolutePath, 'utf8');
  } catch (error) {
    failures.push({ relativePath, token, reason: 'missing-file' });
    continue;
  }

  if (!content.includes(token)) {
    failures.push({ relativePath, token, reason: 'missing-token' });
  }
}

const report = {
  validator: 'validate-jarvis-live-pass-10',
  status: failures.length === 0 ? 'passed' : 'failed',
  checkedAt: new Date().toISOString(),
  checkedFiles: checks.map(([relativePath]) => relativePath),
  failures,
};

const reportPath = join(root, 'reports/jarvis/validate-jarvis-live-pass-10.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
