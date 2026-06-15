import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['apps/web/src/lib/documents/extraction/index.ts', 'DocumentExtractionService'],
  ['apps/web/src/lib/documents/extraction/index.ts', 'DocumentFieldMapper'],
  ['apps/web/src/lib/public-repos/live/adapters/index.ts', 'DoclingSmartIntakeAdapter'],
  ['apps/web/src/lib/public-repos/live/adapters/index.ts', 'DoclingAdapter.contract']
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

const report = { validator: 'validate-n21-docling-adapter-route-exports', passed, checkedAt: new Date().toISOString(), results };
const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-docling-adapter-route-exports-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
