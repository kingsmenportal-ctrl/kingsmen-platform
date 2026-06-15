import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts',
  'apps/web/src/lib/jarvis/security/JarvisSecurityScanGate.ts',
  'apps/web/src/app/api/jarvis/security/scan/route.ts',
  'apps/web/src/lib/jarvis/security/JarvisSecurityScanGate.api-example.json',
  'apps/web/src/lib/jarvis/runtime/types.ts',
  'apps/web/src/lib/jarvis/runtime/intent-router.ts',
  'apps/web/src/lib/jarvis/runtime/command-registry.ts',
  'apps/web/src/lib/jarvis/runtime/adapter-selector.ts'
];

const requiredContent = [
  ['apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts', 'destructiveFixesAllowed: false'],
  ['apps/web/src/lib/public-repos/live/adapters/SecurityScanGate.contract.ts', 'deploymentBlockRequiresPolicy: true'],
  ['apps/web/src/lib/jarvis/security/JarvisSecurityScanGate.ts', 'runJarvisSecurityScanGate'],
  ['apps/web/src/app/api/jarvis/security/scan/route.ts', 'No automatic fix'],
  ['apps/web/src/app/api/jarvis/security/scan/route.ts', 'PostgreSQL evidence ledger remains Kingsmen authority'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'jarvis_security_scan'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'JARVIS_SECURITY_SCAN'],
  ['apps/web/src/lib/jarvis/runtime/intent-router.ts', 'security scan'],
  ['apps/web/src/lib/jarvis/runtime/command-registry.ts', 'security_scan_gate_adapter'],
  ['apps/web/src/lib/jarvis/runtime/adapter-selector.ts', 'security_scan_gate_adapter']
];

const results = [];
let passed = true;

for (const file of requiredFiles) {
  const ok = fs.existsSync(path.join(root, file));
  results.push({ check: 'file_exists', file, ok });
  if (!ok) passed = false;
}

for (const [file, needle] of requiredContent) {
  const full = path.join(root, file);
  const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const ok = content.includes(needle);
  results.push({ check: 'content_contains', file, needle, ok });
  if (!ok) passed = false;
}

const report = {
  validator: 'validate-n21-jarvis-security-scan-gate',
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: requiredFiles.length,
    contentChecks: requiredContent.length
  },
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-jarvis-security-scan-gate-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
