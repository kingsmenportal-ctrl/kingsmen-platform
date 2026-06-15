import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['apps/web/src/lib/public-repos/live/adapters/DoclingSmartIntakeAdapter.ts', 'runDoclingSmartIntakeAdapter'],
  ['apps/web/src/lib/public-repos/live/adapters/DoclingSmartIntakeAdapter.ts', 'mayWriteCandidateTruth: false'],
  ['apps/web/src/app/api/jarvis/public-repos/docling-smart-intake/route.ts', 'DoclingAdapter'],
  ['apps/web/src/app/api/jarvis/public-repos/docling-smart-intake/route.ts', 'No candidate profile truth is written'],
  ['reports/N21-LIVE-PUBLIC-REPOS/N21_2_DOCLING_ADAPTER_APPEND.md', 'GET /api/jarvis/public-repos/docling-smart-intake']
];

let passed = true;
const results = checks.map(([file, needle]) => {
  const full = path.join(root, file);
  const exists = fs.existsSync(full);
  const content = exists ? fs.readFileSync(full, 'utf8') : '';
  const ok = exists && content.includes(needle);
  if (!ok) passed = false;
  return { file, needle, exists, ok };
});

const report = {
  validator: 'validate-n21-docling-adapter-route',
  passed,
  checkedAt: new Date().toISOString(),
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-docling-adapter-route-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
