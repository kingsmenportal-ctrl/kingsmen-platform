#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const registryPath = 'apps/api/src/final-assembly/module-registry.ts';
const manifestPath = 'manifests/launch/kingsmen-launch-readiness-v1.json';
const outputPath = 'reports/architecture/kingsmen-repository-operating-inventory-latest.json';
const failures = [];
const read = (path) => existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null;
const registryText = read(registryPath);
const manifestText = read(manifestPath);
if (!registryText) failures.push(`missing:${registryPath}`);
if (!manifestText) failures.push(`missing:${manifestPath}`);

const modules = [];
if (registryText) {
  const re = /\{\s*moduleKey:\s*"(N\d{2})",\s*moduleName:\s*"([^"]+)",\s*phaseOrder:\s*(\d+),\s*releaseStatus:\s*"([^"]+)",\s*ownerBoundary:\s*"([^"]+)",\s*truthSource:\s*"([^"]+)",\s*hasValidator:\s*(true|false),\s*hasReport:\s*(true|false)\s*\}/g;
  for (const match of registryText.matchAll(re)) {
    modules.push({
      key: match[1], name: match[2], order: Number(match[3]),
      registeredReleaseStatus: match[4], ownerBoundary: match[5], truthSource: match[6],
      validatorRegistered: match[7] === 'true', reportRegistered: match[8] === 'true',
      runtimeVerification: 'NOT_INFERRED_FROM_SOURCE_REGISTRY',
      releaseReadiness: 'REQUIRES_LAUNCH_GATE_AND_RUNTIME_EVIDENCE'
    });
  }
}
const expectedKeys = Array.from({ length: 21 }, (_, i) => `N${String(i).padStart(2, '0')}`);
const actualKeys = modules.map((m) => m.key);
for (const key of expectedKeys) if (!actualKeys.includes(key)) failures.push(`module-missing:${key}`);
for (const key of actualKeys) if (actualKeys.filter((x) => x === key).length !== 1) failures.push(`module-duplicate:${key}`);
if (modules.length !== 21) failures.push(`module-count:${modules.length}:expected:21`);
for (const m of modules) {
  if (!m.validatorRegistered) failures.push(`module-validator-unregistered:${m.key}`);
  if (!m.reportRegistered) failures.push(`module-report-unregistered:${m.key}`);
}

let manifest = null;
try { manifest = manifestText ? JSON.parse(manifestText) : null; } catch { failures.push('launch-manifest-invalid-json'); }
const gates = Array.isArray(manifest?.requiredLaunchGates) ? manifest.requiredLaunchGates : [];
if (!gates.length) failures.push('launch-gates-missing');
const gateEvidence = gates.map((gate) => {
  const paths = Array.isArray(gate.evidencePaths) ? gate.evidencePaths : [];
  const evidence = paths.map((path) => ({ path, exists: existsSync(join(root, path)) }));
  return {
    key: gate.gateKey,
    title: gate.title,
    declaredStatus: gate.status ?? 'UNDECLARED',
    evidence,
    existingEvidencePathCount: evidence.filter((x) => x.exists).length,
    declaredEvidencePathCount: evidence.length,
    remainingConstraint: gate.remainingConstraint ?? null,
    liveGateStatus: 'NOT_PROMOTED_BY_FILE_EXISTENCE'
  };
});

const ignoredDirs = new Set(['.git', 'node_modules', '.next', '.turbo', 'coverage', 'dist', 'build', '.netlify']);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.sql', '.ps1', '.yml', '.yaml', '.md', '.html', '.css']);
const counts = { trackedByFilesystemFiles: 0, sourceAndDocumentationFiles: 0, apiRouteFiles: 0, validatorFiles: 0, migrationFiles: 0, workflowFiles: 0, packageManifests: 0 };
const topLevel = [];
function walk(dir) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.isFile()) continue;
    const path = relative(root, full).split(sep).join('/');
    counts.trackedByFilesystemFiles += 1;
    if (sourceExtensions.has(extname(entry.name).toLowerCase())) counts.sourceAndDocumentationFiles += 1;
    if (path.startsWith('apps/api/src/') && /\/route\.(ts|js)$/.test(path)) counts.apiRouteFiles += 1;
    if (path.startsWith('scripts/validators/') && /\.(mjs|js|ts)$/.test(path)) counts.validatorFiles += 1;
    if (/^(db\/migrations|supabase\/migrations)\//.test(path) && /\.sql$/.test(path)) counts.migrationFiles += 1;
    if (path.startsWith('.github/workflows/') && /\.ya?ml$/.test(path)) counts.workflowFiles += 1;
    if (/(^|\/)package\.json$/.test(path)) counts.packageManifests += 1;
    if (!path.includes('/')) topLevel.push(path);
  }
}
walk(root);
let rootPackage = null;
try { rootPackage = JSON.parse(read('package.json') ?? 'null'); } catch { failures.push('root-package-json-invalid'); }
const scripts = Object.keys(rootPackage?.scripts ?? {});
const validationScripts = scripts.filter((key) => /validate|verify|test|audit|gate|prove/.test(key));
async function fetchAllPages(path, token, apiBase) {
  const values = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(`${apiBase}/repos/${process.env.GITHUB_REPOSITORY}/${path}?per_page=100&page=${page}`, {
      headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28' },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`GitHub API ${path} returned HTTP ${response.status}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error(`GitHub API ${path} did not return an array`);
    values.push(...batch);
    if (batch.length < 100) return values;
  }
  throw new Error(`GitHub API ${path} exceeded 2000 records; census is incomplete`);
}

let remoteInventory = {
  status: 'NOT_AVAILABLE_OUTSIDE_AUTHENTICATED_GITHUB_ACTIONS',
  branches: [],
  openPullRequests: [],
  openIssues: [],
  failures: []
};
if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  const apiBase = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
  try {
    const [branchRows, pullRows, issueRows] = await Promise.all([
      fetchAllPages('branches', process.env.GITHUB_TOKEN, apiBase),
      fetchAllPages('pulls?state=open'.split('?')[0], process.env.GITHUB_TOKEN, apiBase),
      fetchAllPages('issues?state=open'.split('?')[0], process.env.GITHUB_TOKEN, apiBase)
    ]);
    // The collection helper owns pagination; apply state filters locally so every page uses the same endpoint.
    const openPullRequests = pullRows.filter((pr) => pr.state === 'open').map((pr) => ({
      number: pr.number, title: pr.title, url: pr.html_url,
      head: pr.head?.ref ?? null, base: pr.base?.ref ?? null,
      changedFiles: pr.changed_files ?? null, additions: pr.additions ?? null, deletions: pr.deletions ?? null,
      draft: Boolean(pr.draft), mergeable: pr.mergeable ?? null
    }));
    const openIssues = issueRows.filter((issue) => !issue.pull_request && issue.state === 'open').map((issue) => ({
      number: issue.number, title: issue.title, url: issue.html_url,
      labels: (issue.labels ?? []).map((label) => typeof label === 'string' ? label : label.name)
    }));
    remoteInventory = {
      status: 'LIVE_GITHUB_API_CENSUS_PASSED',
      capturedAt: new Date().toISOString(),
      branchCount: branchRows.length,
      branches: branchRows.map((branch) => branch.name),
      openPullRequestCount: openPullRequests.length,
      openPullRequests,
      openIssueCount: openIssues.length,
      openIssues,
      failures: []
    };
  } catch (error) {
    remoteInventory = {
      status: 'LIVE_GITHUB_API_CENSUS_FAILED',
      branches: [], openPullRequests: [], openIssues: [],
      failures: [String(error?.message ?? error)]
    };
    failures.push('live-github-census-failed');
  }
} else if (process.env.GITHUB_ACTIONS === 'true') {
  remoteInventory.status = 'LIVE_GITHUB_API_CENSUS_FAILED';
  remoteInventory.failures = ['GITHUB_TOKEN or GITHUB_REPOSITORY missing inside GitHub Actions'];
  failures.push('live-github-census-credentials-missing');
}

const registeredValidated = modules.filter((m) => m.registeredReleaseStatus === 'validated').length;
const registeredLocked = modules.filter((m) => m.registeredReleaseStatus === 'locked').length;
const gatesWithDeclaredBlockers = gates.filter((g) => g.remainingConstraint).length;
const gatesWithAllEvidenceFiles = gateEvidence.filter((g) => g.declaredEvidencePathCount > 0 && g.existingEvidencePathCount === g.declaredEvidencePathCount).length;
const report = {
  schema: 'kingsmen.repository-operating-inventory.v1',
  generatedAt: new Date().toISOString(),
  scope: 'Current checked-out repository tree, source registries, and (when authenticated in CI) paginated live GitHub branches/open pull requests/open issues; not live provider or database state.',
  sourceOfTruth: {
    moduleRegistry: registryPath,
    launchManifest: manifestPath,
    rootPackage: 'package.json'
  },
  counts,
  remoteInventory,
  inventoryCoverage: {
    registeredModules: modules.length,
    expectedModules: 21,
    registrationCoveragePercent: Math.round((modules.length / 21) * 100),
    registryStatusCounts: { validated: registeredValidated, locked: registeredLocked },
    modulesWithValidatorAndReportRegistered: modules.filter((m) => m.validatorRegistered && m.reportRegistered).length,
    launchGates: gates.length,
    gatesWithDeclaredRemainingConstraints: gatesWithDeclaredBlockers,
    gatesWhoseDeclaredEvidencePathsAllExist: gatesWithAllEvidenceFiles,
    rootValidationCommands: validationScripts.length,
    publicLaunchStatus: manifest?.publicLaunchStatus ?? 'UNKNOWN'
  },
  modules,
  launchGates: gateEvidence,
  rootValidationCommands: validationScripts,
  integrity: {
    pass: failures.length === 0,
    failures,
    note: 'A source file, registered validator, passing CI workflow, or declared module status is not equivalent to live staging or production proof.'
  }
};
mkdirSync(dirname(join(root, outputPath)), { recursive: true });
writeFileSync(join(root, outputPath), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  schema: report.schema,
  status: failures.length ? 'FAILED' : 'PASSED',
  passed: failures.length === 0,
  modules: modules.length,
  launchGates: gates.length,
  filesystemFileCount: counts.trackedByFilesystemFiles,
  sourceAndDocumentationFiles: counts.sourceAndDocumentationFiles,
  validatorFiles: counts.validatorFiles,
  migrationFiles: counts.migrationFiles,
  workflowFiles: counts.workflowFiles,
  packageManifests: counts.packageManifests,
  launchGatesWithConstraints: gatesWithDeclaredBlockers,
  remoteInventoryStatus: remoteInventory.status,
  remoteBranchCount: remoteInventory.branchCount ?? null,
  remoteOpenPullRequestCount: remoteInventory.openPullRequestCount ?? null,
  remoteOpenIssueCount: remoteInventory.openIssueCount ?? null,
  failures,
  reportPath: outputPath
}, null, 2));
if (failures.length) process.exitCode = 1;
