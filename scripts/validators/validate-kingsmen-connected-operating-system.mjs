import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const failures = [];

function relative(path) {
  return join(repoRoot, path);
}

function read(path) {
  const full = relative(path);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function requireFile(path, tokens = []) {
  const content = read(path);
  if (content === null) {
    failures.push(`Missing file: ${path}`);
    return;
  }
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${path} missing token: ${token}`);
  }
}

requireFile('apps/api/src/system/kingsmen-operating-system-spine.ts', [
  'N00',
  'N01',
  'N02',
  'N03',
  'N04',
  'N05',
  'N06',
  'N07',
  'N08',
  'N09',
  'N10',
  'N11',
  'N12',
  'N13',
  'N14',
  'N15',
  'N16',
  'N17',
  'N18',
  'N19',
  'N20',
  'backendIsAuthority',
  'postgresIsTruth',
  'brain_router_not_secret_store_not_final_authority',
  'OPENCLAW_OPERATOR',
  'POWERSHELL_CREATOR',
  'AIRTABLE_MIRROR',
  'N8N_THIN_RELAY',
  'PLAYWRIGHT_SCOUT',
  'MAP fallback',
  'Phoenix fallback',
  'SETA/QCTO',
  'npm run kingsmen:launch:gate'
]);

requireFile('packages/jarvis-core/src/jarvis-kingsmen-system-bridge.ts', [
  'JARVIS_KINGSMEN_BRIDGE_SURFACES',
  'JARVIS_KINGSMEN_COMMAND_ROUTES',
  'JARVIS_KINGSMEN_SYSTEM_BRIDGE_DOCTRINE',
  'backendRemainsAuthority',
  'postgresRemainsTruth',
  'founderApprovalRequiredForRisk',
  'rawSecretsNeverStoredByJarvis',
  'evidenceRequiredForEveryCommand',
  'airtableMirrorOnly',
  'n8nThinRelayOnly',
  'finance',
  'opportunity_engine',
  'execution_orchestrator',
  'launch_gate'
]);

requireFile('packages/jarvis-core/src/live-index.ts', [
  'jarvis-kingsmen-system-bridge',
  'listJarvisKingsmenBridgeSurfaces',
  'resolveJarvisKingsmenCommandRoute'
]);

requireFile('manifests/system/kingsmen-connected-operating-system-v1.json', [
  'kingsmen.connected-operating-system.v1',
  'productionReady',
  'publicLaunchAllowed',
  'backendIsAuthority',
  'postgresIsTruth',
  'jarvisIsBrainRouter',
  'openclawIsOperatorWorker',
  'playwrightIsScoutOnly',
  'N20 final assembly launch gate',
  'npm run kingsmen:validate:connected-system'
]);

requireFile('docs/system/KINGSMEN_JARVIS_CONNECTED_OPERATING_SYSTEM.md', [
  'Production ready: **false**',
  'Backend API is the authority',
  'PostgreSQL is the truth vault',
  'Jarvis is the brain/router',
  'OpenClaw is an operator/worker',
  'Airtable is mirror only',
  'n8n is thin relay only',
  'Playwright is scout/probe only',
  'N15 Opportunity engine, SETA, QCTO, employer and skills routes',
  'npm run kingsmen:validate:connected-system'
]);

requireFile('package.json', ['kingsmen:validate:connected-system']);

const spine = read('apps/api/src/system/kingsmen-operating-system-spine.ts') ?? '';
const moduleMatches = spine.match(/moduleCode: "N\d{2}"/g) ?? [];
if (new Set(moduleMatches).size < 21) failures.push('Operating spine must cover N00 through N20 without narrowing Kingsmen to one module.');

const bridge = read('packages/jarvis-core/src/jarvis-kingsmen-system-bridge.ts') ?? '';
for (const denied of ['markPaidFromReturnUrl', 'aiRefundApproval', 'bulkWhatsapp', 'forcePortalSubmit', 'publicLaunchWithoutGate']) {
  if (!bridge.includes(denied)) failures.push(`Jarvis bridge missing denied action: ${denied}`);
}

const manifest = JSON.parse(read('manifests/system/kingsmen-connected-operating-system-v1.json') ?? '{}');
if (manifest.productionReady !== false) failures.push('Connected operating system manifest must keep productionReady=false until runtime proof passes.');
if (manifest.publicLaunchAllowed !== false) failures.push('Connected operating system manifest must keep publicLaunchAllowed=false until final gate passes.');

const report = {
  validator: 'validate-kingsmen-connected-operating-system',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/api/src/system/kingsmen-operating-system-spine.ts',
    'packages/jarvis-core/src/jarvis-kingsmen-system-bridge.ts',
    'packages/jarvis-core/src/live-index.ts',
    'manifests/system/kingsmen-connected-operating-system-v1.json',
    'docs/system/KINGSMEN_JARVIS_CONNECTED_OPERATING_SYSTEM.md',
    'package.json'
  ],
  doctrine: {
    fullNSeriesCoverage: true,
    notPayFastOnly: true,
    backendAuthority: true,
    postgresTruth: true,
    jarvisBrainRouterOnly: true,
    openclawPolicyBoundWorker: true,
    noRawSecrets: true,
    noBulkWhatsapp: true,
    noForcedPortalAutomation: true,
    noPublicLaunchWithoutGate: true
  }
};

const reportPath = relative('reports/system/kingsmen-connected-operating-system-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'KINGSMEN_CONNECTED_OPERATING_SYSTEM_VALIDATED' : 'KINGSMEN_CONNECTED_OPERATING_SYSTEM_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
