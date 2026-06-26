#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'manifests', 'jarvis', 'jarvis-commander-app-stack.json');

const requiredApps = [
  'ai_voice_generator',
  'ai_wisebase',
  'airtable',
  'b12_website_generator',
  'canva',
  'catalyst_by_zoho',
  'github',
  'gmail',
  'google_calendar',
  'google_contacts',
  'google_drive',
  'indeed',
  'internshala',
  'jotform',
  'lovable',
  'midpage_legal_research',
  'namecheap',
  'neon_postgres',
  'netlify',
  'norton',
  'openai_platform',
  'replit',
  'softonic',
  'supabase',
  'vivin'
];

const requiredFields = [
  'key',
  'displayName',
  'category',
  'availability',
  'routePurpose',
  'allowedActions',
  'blockedActions',
  'dataBoundary',
  'evidenceType',
  'approvalRequired',
  'sourceOfTruthStatus',
  'hudChip'
];

function fail(message) {
  console.error(`JARVIS COMMANDER APP STACK VALIDATION FAILED: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

assert(fs.existsSync(manifestPath), `Missing manifest: ${manifestPath}`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`Manifest is not valid JSON: ${error.message}`);
}

assert(manifest.schema === 'kingsmen.jarvis.commander_app_stack.v1', 'Unexpected or missing schema.');
assert(Array.isArray(manifest.apps), 'Manifest apps must be an array.');
assert(manifest.apps.length === requiredApps.length, `Expected ${requiredApps.length} unique apps, found ${manifest.apps.length}.`);

const appsByKey = new Map();
for (const app of manifest.apps) {
  assert(app && typeof app === 'object', 'Each app must be an object.');
  for (const field of requiredFields) {
    assert(Object.prototype.hasOwnProperty.call(app, field), `App entry missing required field: ${field}`);
  }
  assert(!appsByKey.has(app.key), `Duplicate app key: ${app.key}`);
  appsByKey.set(app.key, app);
  assert(Array.isArray(app.allowedActions), `${app.key} allowedActions must be an array.`);
  assert(Array.isArray(app.blockedActions), `${app.key} blockedActions must be an array.`);
  assert(Array.isArray(app.approvalRequired), `${app.key} approvalRequired must be an array.`);
  assert(app.allowedActions.length > 0, `${app.key} must define at least one allowed action.`);
  assert(app.blockedActions.length > 0, `${app.key} must define at least one blocked action.`);
  assert(typeof app.routePurpose === 'string' && app.routePurpose.trim().length > 0, `${app.key} routePurpose cannot be empty.`);
  assert(typeof app.dataBoundary === 'string' && app.dataBoundary.trim().length > 0, `${app.key} dataBoundary cannot be empty.`);
  assert(typeof app.evidenceType === 'string' && app.evidenceType.trim().length > 0, `${app.key} evidenceType cannot be empty.`);
  assert(typeof app.sourceOfTruthStatus === 'string' && app.sourceOfTruthStatus.trim().length > 0, `${app.key} sourceOfTruthStatus cannot be empty.`);
  assert(typeof app.hudChip === 'string' && app.hudChip.trim().length > 0, `${app.key} hudChip cannot be empty.`);
}

for (const key of requiredApps) {
  assert(appsByKey.has(key), `Missing Commander-listed app: ${key}`);
}

const lovable = appsByKey.get('lovable');
assert(lovable.availability.includes('available_like_other_apps'), 'Lovable must be marked available like other apps.');
assert(lovable.sourceOfTruthStatus.includes('not_truth'), 'Lovable must not be source of truth.');
assert(lovable.blockedActions.includes('send_secrets'), 'Lovable must block secrets.');
assert(lovable.blockedActions.includes('send_raw_candidate_data'), 'Lovable must block raw candidate data.');
assert(lovable.hudChip.includes('LOVABLE AVAILABLE'), 'Lovable HUD chip must state availability.');

const airtable = appsByKey.get('airtable');
assert(airtable.sourceOfTruthStatus === 'mirror_only', 'Airtable must remain mirror only.');

const github = appsByKey.get('github');
assert(github.evidenceType === 'repo_proof', 'GitHub must be repo proof.');

const global = manifest.globalRules || {};
assert(global.futureNumbersMustUseThisRegistry === true, 'Future numbers must use this registry.');
assert(global.externalToolsMustNotReceiveSecrets === true, 'External tools must not receive secrets.');
assert(global.externalToolsMustNotReceiveRawCandidateData === true, 'External tools must not receive raw candidate data.');
assert(global.writeActionsRequireCommanderApproval === true, 'Write actions must require Commander approval.');

console.log('Jarvis Commander app stack validation passed.');
console.log(`Validated ${manifest.apps.length} Commander-listed apps with boundaries, evidence types, and HUD chips.`);
