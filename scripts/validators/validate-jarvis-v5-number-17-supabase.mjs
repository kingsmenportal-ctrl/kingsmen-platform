import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_17_WHEN_THE_COMMANDER_ASKS_ABOUT_SUPABASE.md', [
    'NUMBER 17 — WHEN THE COMMANDER ASKS ABOUT SUPABASE',
    'Supabase may assist with PostgreSQL',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_18_WHEN_THE_COMMANDER_ASKS_ABOUT_GITHUB.md'
  ]],
  ['packages/jarvis-core/src/supabase-platform-boundary.ts', [
    'jarvisAssessSupabasePlatform',
    'SUPABASE_PLATFORM_SUPPORT_REQUEST',
    'supports_postgresql_auth_storage_edge_services_under_kingsmen_doctrine',
    'supabase_must_not_replace_postgresql_truth_doctrine',
    'supabase_boundary_built_not_live_project_proven'
  ]],
  ['apps/web/src/app/api/jarvis/supabase/route.ts', [
    'SUPABASE_PLATFORM_SUPPORT_REQUEST',
    'liveRuntime',
    'route_built_not_live_project_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisSupabasePlatformPanel.tsx', [
    'JarvisSupabasePlatformPanel',
    'SUPABASE PLATFORM SUPPORT',
    'Runtime proof not captured yet',
    'disciplined access remain in control'
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
for (const [file, tokens] of required.entries()) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) fail(`Required token not found in ${file}: ${token}`);
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const route = read('apps/web/src/app/api/jarvis/supabase/route.ts');
const boundary = read('packages/jarvis-core/src/supabase-platform-boundary.ts');

if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 17 must not claim live runtime or production proof from repo files.');
}

const report = {
  validator: 'validate-jarvis-v5-number-17-supabase',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    supabaseSupportLayerOnly: true,
    postgresqlTruthVaultStillControls: true,
    backendPolicyGateRequired: true,
    auditEvidenceRequiredForSensitiveActions: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-17-supabase-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

console.log('JARVIS_V5_NUMBER_17_SUPABASE_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
