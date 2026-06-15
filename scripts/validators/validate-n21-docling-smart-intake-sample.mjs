import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/documents/extraction/DocumentFieldMapper.ts',
  'apps/web/src/lib/documents/extraction/DocumentExtractionService.ts',
  'apps/web/src/app/api/documents/extract/route.ts',
  'apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts',
  'apps/web/src/lib/documents/extraction/DocumentExtractionService.test-sample.json',
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
  ['apps/web/src/lib/public-repos/live/adapters/DoclingAdapter.contract.ts', 'automatic_truth_write'],
  ['apps/web/src/lib/documents/extraction/DocumentExtractionService.test-sample.json', 'candidate_draft_review']
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

const samplePath = path.join(root, 'apps/web/src/lib/documents/extraction/DocumentExtractionService.test-sample.json');
if (fs.existsSync(samplePath)) {
  const sample = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  const text = sample?.request?.extractedText ?? '';
  const expected = sample?.expected?.fieldsExpectedAtLeast ?? [];
  const sampleChecks = [
    ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)],
    ['phone', /(?:\+27|0)[6-8][0-9][\s-]?[0-9]{3}[\s-]?[0-9]{4}/.test(text)],
    ['full_name_label', /full name:/i.test(text)],
    ['skills_label', /skills:/i.test(text)],
    ['expected_fields_present', expected.length >= 6]
  ];
  for (const [check, ok] of sampleChecks) {
    results.push({ check: 'sample_payload', sampleCheck: check, ok });
    if (!ok) passed = false;
  }
} else {
  results.push({ check: 'sample_payload', ok: false, reason: 'sample file missing' });
  passed = false;
}

const report = {
  validator: 'validate-n21-docling-smart-intake-sample',
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
fs.writeFileSync(path.join(reportDir, 'n21-docling-smart-intake-sample-latest.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
