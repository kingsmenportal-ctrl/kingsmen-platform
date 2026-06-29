import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md', [
    'NUMBER 16 — WHEN THE COMMANDER ASKS ABOUT POSTGRESQL',
    'PostgreSQL is the Kingsmen Truth Vault',
    'Runtime status: NOT YET PROVEN BY THIS FILE',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE'
  ]],
  ['packages/jarvis-core/src/postgresql-truth-vault-boundary.ts', [
    'jarvisAssessPostgreSQLTruthVault',
    'POSTGRESQL_TRUTH_VAULT_OR_DATABASE_REQUEST',
    'authority_layer_through_governed_schema_policy_audit_evidence',
    'airtable_must_not_override_postgresql_truth',
    'n8n_must_not_silently_mutate_truth',
    'runtimeProof: null',
    'truth_boundary_built_not_runtime_proven'
  ]],
  ['database/migrations/000004_jarvis_postgresql_truth_vault.sql', [
    'create schema if not exists jarvis_truth',
    'postgresql_truth_events',
    'postgresql_truth_read_models',
    'postgresql_truth_migration_proofs',
    'postgresql_truth_runtime_checks',
    'enable row level security',
    'v_postgresql_truth_hud_readiness',
    'HUD-safe summary view'
  ]],
  ['apps/web/src/app/api/jarvis/postgresql/route.ts', [
    'POSTGRESQL_TRUTH_VAULT_OR_DATABASE_REQUEST',
    'rawPrivateRowsBlockedByDefault',
    'safeVoiceResponse',
    'route_built_not_live_database_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisPostgreSQLTruthVaultPanel.tsx', [
    'JarvisPostgreSQLTruthVaultPanel',
    'POSTGRESQL TRUTH VAULT',
    'Raw private rows',
    'Runtime proof not captured yet',
    'HUD-safe read models'
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
    if (!content.includes(token)) {
      fail(`Required token not found in ${file}: ${token}`);
    }
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const boundary = read('packages/jarvis-core/src/postgresql-truth-vault-boundary.ts');
const migration = read('database/migrations/000004_jarvis_postgresql_truth_vault.sql');
const route = read('apps/web/src/app/api/jarvis/postgresql/route.ts');
const panel = read('apps/web/src/app/jarvis/components/JarvisPostgreSQLTruthVaultPanel.tsx');

if (boundary.includes('runtimeProof: "passed"') || route.includes('productionComplete: true')) {
  fail('Number 16 must not claim runtime or production proof from repo files.');
}

if (!migration.match(/alter table[\s\S]+enable row level security/i)) {
  fail('Number 16 migration must enable row-level security.');
}

if (!migration.includes('audit_required') || !migration.includes('evidence_required')) {
  fail('Number 16 migration must carry audit and evidence requirements.');
}

if (!panel.includes('must not expose raw private candidate')) {
  fail('Number 16 HUD panel must block raw private row exposure by default.');
}

const report = {
  validator: 'validate-jarvis-v5-number-16-postgresql',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    postgresqlIsTruthVault: true,
    airtableMirrorOnly: true,
    n8nThinWorkerOnly: true,
    rlsRequiredForPrivateData: true,
    auditRequiredForSensitiveMutation: true,
    readModelsRequiredForHud: true,
    noRuntimeClaimFromRepoFiles: true,
    noProductionClaimFromMarkdown: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-16-postgresql-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

console.log('JARVIS_V5_NUMBER_16_POSTGRESQL_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
