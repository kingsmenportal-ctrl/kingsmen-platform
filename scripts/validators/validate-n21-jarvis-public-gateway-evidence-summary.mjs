import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checkedAt = new Date().toISOString();

const requiredFiles = [
  'apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts',
  'apps/web/src/app/api/jarvis/public-repos/evidence-summary/route.ts',
  'apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.api-example.json'
];

const contentChecks = [
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts', 'buildJarvisPublicIntegrationHud'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts', 'buildJarvisPublicGatewayHealthProbe'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts', 'buildJarvisLocalInstallationReadiness'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts', "mode: 'jarvis_public_gateway_evidence_summary'"],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts', "evidenceState === 'ready'"],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.ts', 'No POST actions'],
  ['apps/web/src/app/api/jarvis/public-repos/evidence-summary/route.ts', 'buildJarvisPublicGatewayEvidenceSummary'],
  ['apps/web/src/app/api/jarvis/public-repos/evidence-summary/route.ts', 'timeoutMs'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.api-example.json', 'noToolExecution'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary.api-example.json', 'postgresEvidenceAuthority']
];

const results = [];
for (const file of requiredFiles) {
  results.push({ check: 'file_exists', file, ok: fs.existsSync(path.join(root, file)) });
}

for (const [file, needle] of contentChecks) {
  const full = path.join(root, file);
  const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  results.push({ check: 'content_contains', file, needle, ok: content.includes(needle) });
}

const passed = results.every((item) => item.ok);
const report = {
  validator: 'validate-n21-jarvis-public-gateway-evidence-summary',
  passed,
  checkedAt,
  summary: {
    files: requiredFiles.length,
    contentChecks: contentChecks.length
  },
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-jarvis-public-gateway-evidence-summary-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
