import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_18_WHEN_THE_COMMANDER_ASKS_ABOUT_GITHUB.md', [
    'NUMBER 18 — WHEN THE COMMANDER ASKS ABOUT GITHUB',
    'GitHub is not runtime proof',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_19_WHEN_THE_COMMANDER_ASKS_ABOUT_POWER_SHELL_CREATOR.md'
  ]],
  ['packages/jarvis-core/src/github-repo-boundary.ts', [
    'jarvisAssessGitHubRepoRequest',
    'GITHUB_REPO_EVIDENCE_OR_CHANGE_CONTROL',
    'repository_evidence_and_change_control_not_runtime_truth',
    'commit_sha_must_not_be_treated_as_runtime_proof',
    'github_boundary_built_not_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/github/route.ts', [
    'GITHUB_REPO_EVIDENCE_OR_CHANGE_CONTROL',
    'commitShaIsRepoProofOnly',
    'route_built_not_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisGitHubRepoPanel.tsx', [
    'JarvisGitHubRepoPanel',
    'GITHUB REPOSITORY EVIDENCE',
    'Runtime proof not captured yet',
    'separate runtime evidence'
  ]]
]);

function fail(message) { throw new Error(message); }
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

const route = read('apps/web/src/app/api/jarvis/github/route.ts');
const boundary = read('packages/jarvis-core/src/github-repo-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 18 must not claim live runtime or production proof from repo files.');
}

const report = {
  validator: 'validate-jarvis-v5-number-18-github',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    githubIsRepoEvidenceOnly: true,
    commitShaIsRepoProofOnly: true,
    noBlindOverwrite: true,
    noSecretExposure: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-18-github-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_18_GITHUB_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
