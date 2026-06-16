import fs from 'node:fs';

const checks = [];

function fileExists(file) {
  const ok = fs.existsSync(file);
  checks.push({ check: 'file_exists', file, ok });
  return ok;
}

function contains(file, needle) {
  const ok = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(needle);
  checks.push({ check: 'content_contains', file, needle, ok });
  return ok;
}

const files = [
  'apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts',
  'apps/web/src/app/api/jarvis/public-repos/local-readiness/route.ts',
  'apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.api-example.json',
  'apps/web/src/app/jarvis/JarvisAgentClient.tsx'
];

files.forEach(fileExists);

contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'jarvis_local_installation_readiness');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'noInstall: true');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'noMutation: true');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'noSecretOutput: true');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'allowlistedCheckOnly: true');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'Docling Runtime');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'Playwright Browser Runtime');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'openWakeWord Runtime');
contains('apps/web/src/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness.ts', 'gitleaks Runtime');
contains('apps/web/src/app/api/jarvis/public-repos/local-readiness/route.ts', 'buildJarvisLocalInstallationReadiness');
contains('apps/web/src/app/jarvis/JarvisAgentClient.tsx', 'LOCAL_INSTALL_READINESS');
contains('apps/web/src/app/jarvis/JarvisAgentClient.tsx', '/api/jarvis/public-repos/local-readiness');
contains('apps/web/src/app/jarvis/JarvisAgentClient.tsx', 'Local installation readiness');

const passed = checks.every((item) => item.ok);
const result = {
  validator: 'validate-n21-jarvis-local-installation-readiness',
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: files.length,
    contentChecks: checks.length - files.length
  },
  results: checks
};

fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/n21-jarvis-local-installation-readiness-latest.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(passed ? 0 : 1);
