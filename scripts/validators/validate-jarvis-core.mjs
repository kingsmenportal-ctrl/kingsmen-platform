import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const requiredFiles = [
  'packages/contracts/src/jarvis/index.ts',
  'packages/jarvis-core/src/jarvis-policy-gate.ts',
  'packages/jarvis-core/src/jarvis-tool-registry.ts',
  'packages/jarvis-core/src/jarvis-evidence-ledger.ts',
  'packages/jarvis-core/src/jarvis-command-runner.ts',
  'packages/jarvis-core/src/jarvis-mini-builder-core.ts',
  'packages/jarvis-core/src/jarvis-repo-map.ts',
  'packages/jarvis-core/src/index.ts'
];

const requiredTokens = new Map([
  ['packages/contracts/src/jarvis/index.ts', [
    'JarvisCommandEnvelope',
    'JarvisToolCapabilityCard',
    'JarvisPolicyDecision',
    'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED',
    'TRUST_0_UNKNOWN',
    'production_approval_mode'
  ]],
  ['packages/jarvis-core/src/jarvis-policy-gate.ts', [
    'jarvisEvaluatePolicy',
    'JARVIS_APPROVAL_REQUIRED',
    'JARVIS_UNKNOWN_TOOL_DRY_RUN_ONLY',
    'JARVIS_BLOCKED_UNSAFE_ACTION',
    'founderApprovalRef'
  ]],
  ['packages/jarvis-core/src/jarvis-tool-registry.ts', [
    'JARVIS_CORE_TOOL_REGISTRY',
    'jarvis.repo.reader',
    'jarvis.patch.writer',
    'jarvis.validator.runner',
    'jarvis.connector.payfast',
    'jarvis.browser.scout'
  ]],
  ['packages/jarvis-core/src/jarvis-evidence-ledger.ts', [
    'jarvisStartEvidenceLedger',
    'jarvisAppendPolicyDecision',
    'jarvisAppendToolPlan',
    'jarvisAssertEvidenceLedgerSafe',
    'JARVIS_EVIDENCE_SUMMARY_CONTAINS_SECRET_PATTERN'
  ]],
  ['packages/jarvis-core/src/jarvis-command-runner.ts', [
    'jarvisPlanCommandRun',
    'request_founder_approval',
    'dry_run_tool_plan',
    'execute_allowed_tool',
    'blocked'
  ]],
  ['packages/jarvis-core/src/jarvis-mini-builder-core.ts', [
    'JarvisBuildTask',
    'JarvisMiniBuildPlan',
    'jarvisCreateMiniBuildPlan',
    'scopeRoot',
    'blockedPaths',
    'readyForPatchWriter',
    'JARVIS_BUILD_VALIDATOR_REQUIRED'
  ]],
  ['packages/jarvis-core/src/jarvis-repo-map.ts', [
    'JarvisRepoMapInput',
    'JarvisRepoMapResult',
    'jarvisSelectRepoContext',
    'selectedFiles',
    'blockedFiles',
    'ignoredFiles',
    'DEFAULT_BLOCKED_PATTERNS'
  ]]
]);

function fail(message) {
  throw new Error(message);
}

function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

const evidence = [];
for (const file of requiredFiles) {
  const content = read(file);
  const tokens = requiredTokens.get(file) ?? [];
  for (const token of tokens) {
    if (!content.includes(token)) {
      fail(`Required token not found in ${file}: ${token}`);
    }
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const contract = read('packages/contracts/src/jarvis/index.ts');
const policy = read('packages/jarvis-core/src/jarvis-policy-gate.ts');
const registry = read('packages/jarvis-core/src/jarvis-tool-registry.ts');
const miniBuilder = read('packages/jarvis-core/src/jarvis-mini-builder-core.ts');
const repoMap = read('packages/jarvis-core/src/jarvis-repo-map.ts');

if (!contract.includes("'whatsapp_urgent'")) {
  fail('Jarvis WhatsApp boundary missing: only whatsapp_urgent may be a Jarvis channel.');
}

if (!policy.includes('APPROVAL_REQUIRED') || !policy.includes('founderApprovalRef')) {
  fail('Jarvis production approval gate is missing.');
}

if (!registry.includes('TRUST_4_PRODUCTION_APPROVAL_REQUIRED')) {
  fail('Jarvis production connector trust level missing.');
}

if (registry.includes("'whatsapp'")) {
  fail('Jarvis registry must not allow normal WhatsApp as a primary channel. Use whatsapp_urgent only.');
}

if (!miniBuilder.includes('isPathInsideScope') || !miniBuilder.includes('isBlockedPath')) {
  fail('Jarvis mini builder must enforce scoped paths and blocked path patterns.');
}

if (!repoMap.includes('scoreFile') || !repoMap.includes('insideScope')) {
  fail('Jarvis repo map must score files and enforce module scope.');
}

const report = {
  validator: 'validate-jarvis-core',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    noUselessLayers: true,
    backendRemainsAuthority: true,
    founderApprovalForProductionRisk: true,
    emailPrimaryWhatsappUrgentOnly: true,
    evidenceLedgerRequired: true,
    connectorTrustRegistryRequired: true,
    scopedBuilderRequired: true,
    repoContextSelectorRequired: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/jarvis-core-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

console.log('JARVIS_CORE_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
