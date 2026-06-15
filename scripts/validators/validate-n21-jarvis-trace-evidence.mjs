import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/public-repos/live/adapters/LangfuseTraceGateway.contract.ts',
  'apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.ts',
  'apps/web/src/app/api/jarvis/trace/evidence/route.ts',
  'apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.api-example.json',
  'apps/web/src/lib/jarvis/runtime/types.ts',
  'apps/web/src/lib/jarvis/runtime/intent-router.ts',
  'apps/web/src/lib/jarvis/runtime/command-registry.ts',
  'apps/web/src/lib/jarvis/runtime/adapter-selector.ts',
  'apps/web/src/lib/public-repos/live/adapters/index.ts'
];

const requiredContent = [
  ['apps/web/src/lib/public-repos/live/adapters/LangfuseTraceGateway.contract.ts', 'productionTraceExportAllowed: false'],
  ['apps/web/src/lib/public-repos/live/adapters/LangfuseTraceGateway.contract.ts', 'postgresEvidenceAuthority: true'],
  ['apps/web/src/lib/public-repos/live/adapters/LangfuseTraceGateway.contract.ts', 'langfuse/langfuse'],
  ['apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.ts', 'redactTraceValue'],
  ['apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.ts', 'exportedToLangfuse: false'],
  ['apps/web/src/lib/jarvis/trace/JarvisTraceEvidenceGateway.ts', 'postgresEvidenceAuthority: true'],
  ['apps/web/src/app/api/jarvis/trace/evidence/route.ts', 'No raw audio'],
  ['apps/web/src/app/api/jarvis/trace/evidence/route.ts', 'PostgreSQL evidence ledger remains Kingsmen authority'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'jarvis_trace_evidence'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'JARVIS_TRACE_EVIDENCE'],
  ['apps/web/src/lib/jarvis/runtime/intent-router.ts', 'trace evidence'],
  ['apps/web/src/lib/jarvis/runtime/command-registry.ts', 'langfuse_trace_gateway_adapter'],
  ['apps/web/src/lib/jarvis/runtime/adapter-selector.ts', 'langfuse_trace_gateway_adapter'],
  ['apps/web/src/lib/public-repos/live/adapters/index.ts', 'LangfuseTraceGateway.contract']
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
  validator: 'validate-n21-jarvis-trace-evidence',
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
fs.writeFileSync(path.join(reportDir, 'n21-jarvis-trace-evidence-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
