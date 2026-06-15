import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts',
  'apps/web/src/lib/documents/extraction/DocumentExtractionService.ts',
  'apps/web/src/app/api/documents/extract/route.ts',
  'apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts',
  'docs/N21-LIVE-PUBLIC-REPOS/N21_2_DOCLING_SMART_INTAKE_FOUNDATION.md'
];

const requiredContent = [
  ['apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts', 'mapExtractedTextToCandidateDraftFields'],
  ['apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts', 'id_number'],
  ['apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts', 'review_required'],
  ['apps/web/src/lib/documents/extraction/DocumentExtractionService.ts', 'extractCandidateDraftFromDocument'],
  ['apps/web/src/lib/documents/extraction/DocumentExtractionService.ts', 'mayWriteCandidateTruth: false'],
  ['apps/web/src/app/api/documents/extract/route.ts', 'Document extraction requires documentId'],
  ['apps/web/src/app/api/documents/extract/route.ts', 'Draft extraction only'],
  ['apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts', 'DoclingAdapterContract'],
  ['apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts', 'automatic_truth_write']
];

const results = [];
let passed = true;

for (const file of requiredFiles) {
  const ok = fs.existsSync(path.join(root, file));
  results.push({ check: 'file_exists', file, ok });
  if (!ok) passed = false;
}

for (const [file, needle] of requiredContent) {
  const full = path.join(root, file);
  const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const ok = content.includes(needle);
  results.push({ check: 'content_contains', file, needle, ok });
  if (!ok) passed = false;
}

const report = {
  validator: 'validate-n21-docling-smart-intake',
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: requiredFiles.length,
    contentChecks: requiredContent.length
  },
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-docling-smart-intake-latest.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
