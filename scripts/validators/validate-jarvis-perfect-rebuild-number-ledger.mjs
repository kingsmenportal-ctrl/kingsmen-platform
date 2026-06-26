#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ledgerPath = path.join(root, 'manifests', 'jarvis', 'perfect-rebuild-number-ledger.json');

function fail(message) {
  console.error(`JARVIS PERFECT REBUILD NUMBER LEDGER VALIDATION FAILED: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

assert(fs.existsSync(ledgerPath), `Missing ledger manifest: ${ledgerPath}`);

let ledger;
try {
  ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
} catch (error) {
  fail(`Ledger is not valid JSON: ${error.message}`);
}

assert(ledger.schema === 'kingsmen.jarvis.perfect_rebuild_number_ledger.v1', 'Unexpected or missing schema.');
assert(ledger.repository === 'kingsmenportal-ctrl/kingsmen-platform', 'Ledger repository must be kingsmenportal-ctrl/kingsmen-platform.');
assert(ledger.defaultBranch === 'main', 'Ledger defaultBranch must be main.');
assert(Array.isArray(ledger.canonicalSequence), 'canonicalSequence must be an array.');
assert(ledger.currentCanonicalNumber === 12, 'currentCanonicalNumber must be 12 until Number 13 is created.');
assert(ledger.nextAllowedNumber === 13, 'nextAllowedNumber must be 13 until Commander says NEXT.');
assert(typeof ledger.nextGate === 'string' && ledger.nextGate.includes('Commander'), 'nextGate must mention Commander control.');
assert(typeof ledger.globalBuildMatchRule === 'string' && ledger.globalBuildMatchRule.includes('markdown doctrine file'), 'globalBuildMatchRule must warn that markdown is not runtime proof.');

const sequence = ledger.canonicalSequence;
assert(sequence.length === 12, `Expected 12 canonical numbers, found ${sequence.length}.`);

const seen = new Set();
for (let index = 0; index < sequence.length; index += 1) {
  const item = sequence[index];
  const expectedNumber = index + 1;
  assert(item.number === expectedNumber, `Expected number ${expectedNumber}, found ${item.number}.`);
  assert(!seen.has(item.number), `Duplicate number ${item.number}.`);
  seen.add(item.number);
  assert(typeof item.title === 'string' && item.title.trim().length > 0, `Number ${item.number} missing title.`);
  assert(typeof item.path === 'string' && item.path.includes(`NUMBER_${String(item.number).padStart(2, '0')}`), `Number ${item.number} path must include padded number.`);
  assert(typeof item.commit === 'string' && /^[a-f0-9]{40}$/i.test(item.commit), `Number ${item.number} missing valid commit SHA.`);
  assert(typeof item.status === 'string' && item.status.trim().length > 0, `Number ${item.number} missing status.`);
  assert(typeof item.runtimeStatus === 'string' && item.runtimeStatus.trim().length > 0, `Number ${item.number} missing runtimeStatus.`);
  assert(typeof item.buildMatch === 'string' && item.buildMatch.trim().length > 0, `Number ${item.number} missing buildMatch.`);
  assert(!item.buildMatch.toLowerCase().includes('fully implemented'), `Number ${item.number} must not claim full implementation without proof.`);
}

const number11 = sequence.find((item) => item.number === 11);
assert(number11.title.toLowerCase().includes('app stack'), 'Number 11 must be app stack / connector registry in this created sequence.');
assert(!number11.title.toLowerCase().includes('lovable') || number11.title.toLowerCase().includes('app stack'), 'Number 11 must not be Lovable alone.');
assert(!number11.title.toLowerCase().includes('document vault'), 'Number 11 must not be Document Vault Agent in this created sequence.');

const number12 = sequence.find((item) => item.number === 12);
assert(number12.title.toLowerCase().includes('immutable numbering'), 'Number 12 must lock immutable numbering.');
assert(number12.path === 'docs/jarvis/perfect-rebuild/NUMBER_12_JARVIS_IMMUTABLE_NUMBERING_GITHUB_PROOF_AND_BUILD_MATCH_LEDGER.md', 'Number 12 path mismatch.');

assert(Array.isArray(ledger.correctionFiles), 'correctionFiles must be an array.');
assert(ledger.correctionFiles.length >= 4, 'Correction history must be preserved.');
for (const correction of ledger.correctionFiles) {
  assert(typeof correction.path === 'string' && correction.path.length > 0, 'Correction file missing path.');
  assert(typeof correction.commit === 'string' && /^[a-f0-9]{40}$/i.test(correction.commit), `Correction ${correction.path} missing valid commit.`);
  assert(typeof correction.purpose === 'string' && correction.purpose.length > 0, `Correction ${correction.path} missing purpose.`);
}

assert(Array.isArray(ledger.materializedSupportFiles), 'materializedSupportFiles must be an array.');
const supportPaths = new Set(ledger.materializedSupportFiles.map((item) => item.path));
assert(supportPaths.has('manifests/jarvis/jarvis-commander-app-stack.json'), 'Missing app stack manifest support file.');
assert(supportPaths.has('scripts/validators/validate-jarvis-commander-app-stack.mjs'), 'Missing app stack validator support file.');

assert(Array.isArray(ledger.forbiddenBehaviors), 'forbiddenBehaviors must be an array.');
assert(ledger.forbiddenBehaviors.some((rule) => rule.includes('silently change')), 'Forbidden behaviors must block silent number changes.');
assert(ledger.forbiddenBehaviors.some((rule) => rule.includes('runtime proof')), 'Forbidden behaviors must block fake runtime proof claims.');
assert(ledger.forbiddenBehaviors.some((rule) => rule.includes('Commander NEXT')), 'Forbidden behaviors must preserve Commander NEXT gate.');

console.log('Jarvis perfect rebuild number ledger validation passed.');
console.log(`Validated ${sequence.length} canonical numbers, ${ledger.correctionFiles.length} correction files, and ${ledger.materializedSupportFiles.length} support files.`);
