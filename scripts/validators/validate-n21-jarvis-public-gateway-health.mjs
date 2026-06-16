import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checkedAt = new Date().toISOString();

const files = [
  'apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayHealthProbe.ts',
  'apps/web/src/app/api/jarvis/public-repos/health/route.ts',
  'apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayHealthProbe.api-example.json',
  'apps/web/src/app/jarvis/JarvisAgentClient.tsx'
];

const checks = [
  {
    file: 'apps/web/src/lib/jarvis/public-integrations/JarvisPublicGatewayHealthProbe.ts',
    needles: [
      'jarvis_public_gateway_health_probe',
      "method: 'GET'",
      'noPost: true',
      'noToolExecution: true',
      'noMutation: true',
      'green',
      'yellow',
      'red'
    ]
  },
  {
    file: 'apps/web/src/app/api/jarvis/public-repos/health/route.ts',
    needles: [
      'buildJarvisPublicGatewayHealthProbe',
      'force-dynamic'
    ]
  },
  {
    file: 'apps/web/src/app/jarvis/JarvisAgentClient.tsx',
    needles: [
      'PUBLIC_GATEWAY_HEALTH',
      '/api/jarvis/public-repos/health',
      'Health Probe',
      'green ·',
      'without executing POST actions'
    ]
  }
];

const results = [];

for (const file of files) {
  const exists = fs.existsSync(path.join(root, file));
  results.push({ check: 'file_exists', file, ok: exists });
}

for (const check of checks) {
  const absolute = path.join(root, check.file);
  const content = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
  for (const needle of check.needles) {
    results.push({
      check: 'content_contains',
      file: check.file,
      needle,
      ok: content.includes(needle)
    });
  }
}

const passed = results.every((result) => result.ok);
const report = {
  validator: 'validate-n21-jarvis-public-gateway-health',
  passed,
  checkedAt,
  summary: {
    files: files.length,
    contentChecks: checks.reduce((total, check) => total + check.needles.length, 0)
  },
  results
};

fs.mkdirSync(path.join(root, 'reports', 'validation'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'reports', 'validation', 'n21-jarvis-public-gateway-health-latest.json'),
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
