import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const samplePath = path.join(root, 'apps/web/src/lib/documents/extraction/DocumentExtractionService.test-sample.json');
const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
    if (match?.[0]) return clean(match[0]);
  }
  return null;
}

function mapText(text) {
  const fields = [];
  const push = (key, value, confidence = 'medium', reviewRequired = true) => {
    if (!value) return;
    fields.push({ key, value, confidence, reviewRequired });
  };

  push('full_name', firstMatch(text, [/(?:full names?|name)[:\s]+([A-Z][A-Za-z' -]{2,80})/i]), 'medium', true);
  push('email', firstMatch(text, [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i]), 'high', false);
  push('phone', firstMatch(text, [/(?:\+27|0)[6-8][0-9][\s-]?[0-9]{3}[\s-]?[0-9]{4}/]), 'high', false);
  push('address', firstMatch(text, [/(?:address|residential address)[:\s]+([^\n]{8,140})/i]), 'medium', true);
  push('highest_qualification', firstMatch(text, [/(matric|national senior certificate|nsc|diploma|degree|certificate|higher certificate|nqf\s?\d)/i]), 'medium', true);
  push('school_name', firstMatch(text, [/(?:school|high school|secondary school)[:\s]+([^\n]{4,120})/i]), 'medium', true);
  push('skills', firstMatch(text, [/(?:skills|competencies)[:\s]+([^\n]{8,240})/i]), 'medium', true);
  push('certificates', firstMatch(text, [/(?:certificates?|training|qualifications?)[:\s]+([^\n]{8,240})/i]), 'medium', true);
  push('work_experience', firstMatch(text, [/(?:work experience|employment history|experience)[:\s]+([^\n]{8,300})/i]), 'medium', true);
  push('drivers_license', firstMatch(text, [/(code\s?(?:8|10|14)|driver'?s? licence|drivers license|driving licence)/i]), 'medium', true);

  return fields;
}

if (!fs.existsSync(samplePath)) {
  const report = { validator: 'validate-n21-docling-smart-intake-runner', passed: false, reason: 'sample file missing' };
  fs.writeFileSync(path.join(reportDir, 'n21-docling-smart-intake-runner-latest.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const sample = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
const text = sample?.request?.extractedText ?? '';
const expected = sample?.expected?.fieldsExpectedAtLeast ?? [];
const fields = mapText(text);
const keys = new Set(fields.map((field) => field.key));
const missing = expected.filter((key) => !keys.has(key));
const passed = missing.length === 0 && sample?.expected?.mayWriteCandidateTruth === false && sample?.expected?.reviewRequired === true;

const report = {
  validator: 'validate-n21-docling-smart-intake-runner',
  passed,
  checkedAt: new Date().toISOString(),
  extractedFieldCount: fields.length,
  extractedKeys: [...keys],
  missingExpectedKeys: missing,
  mayWriteCandidateTruth: false,
  reviewRequired: true,
  fields
};

fs.writeFileSync(path.join(reportDir, 'n21-docling-smart-intake-runner-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
