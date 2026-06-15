import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const validator = 'validate-n21-jarvis-public-integration-hud';

const requiredFiles = [
  'apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts',
  'apps/web/src/app/api/jarvis/public-repos/hud/route.ts',
  'apps/web/src/app/jarvis/JarvisAgentClient.tsx',
  'apps/web/src/app/jarvis/JarvisAgent.module.css'
];

const contentChecks = [
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts', 'Docling Smart Intake'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts', 'Playwright Scout Gateway'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts', 'Jarvis Voice Gateway'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts', 'Jarvis Trace Evidence Gateway'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts', 'Jarvis Security Scan Gate'],
  ['apps/web/src/lib/jarvis/public-integrations/JarvisPublicIntegrationHud.ts', 'The HUD displays status and safe routes only'],
  ['apps/web/src/app/api/jarvis/public-repos/hud/route.ts', 'buildJarvisPublicIntegrationHud'],
  ['apps/web/src/app/jarvis/JarvisAgentClient.tsx', '/api/jarvis/public-repos/hud'],
  ['apps/web/src/app/jarvis/JarvisAgentClient.tsx', 'N21 PUBLIC INTEGRATION HUD'],
  ['apps/web/src/app/jarvis/JarvisAgentClient.tsx', 'PUBLIC_INTEGRATION_HUD'],
  ['apps/web/src/app/jarvis/JarvisAgent.module.css', '.integrationHud'],
  ['apps/web/src/app/jarvis/JarvisAgent.module.css', '.integrationGrid']
];

const results = [];

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(root, file));
  results.push({ check: 'file_exists', file, ok: exists });
}

for (const [file, needle] of contentChecks) {
  const absolute = path.join(root, file);
  const ok = fs.existsSync(absolute) && fs.readFileSync(absolute, 'utf8').includes(needle);
  results.push({ check: 'content_contains', file, needle, ok });
}

const passed = results.every((result) => result.ok);
const payload = {
  validator,
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: requiredFiles.length,
    contentChecks: contentChecks.length
  },
  results
};

fs.mkdirSync(path.join(root, 'reports', 'validation'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'reports', 'validation', 'n21-jarvis-public-integration-hud-latest.json'),
  `${JSON.stringify(payload, null, 2)}\n`
);

console.log(JSON.stringify(payload, null, 2));

if (!passed) {
  process.exitCode = 1;
}
