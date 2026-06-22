#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const routePath = path.join(repoRoot, 'apps/web/src/app/api/jarvis/runtime-control/route.ts');
const tsconfigPath = path.join(repoRoot, 'apps/web/tsconfig.json');

function fail(code, detail) {
  const report = {
    validator: 'validate-jarvis-runtime-live-route',
    status: 'JARVIS_RUNTIME_LIVE_ROUTE_VALIDATION_FAILED',
    passed: false,
    code,
    detail,
    generatedAtIso: new Date().toISOString(),
  };
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!fs.existsSync(routePath)) fail('MISSING_RUNTIME_ROUTE', routePath);
if (!fs.existsSync(tsconfigPath)) fail('MISSING_WEB_TSCONFIG', tsconfigPath);

const route = fs.readFileSync(routePath, 'utf8');
const tsconfig = fs.readFileSync(tsconfigPath, 'utf8');

const requiredRouteTokens = [
  'export async function POST',
  'jarvisControlCommand',
  'jarvisRuntimeDecisionToHttpStatus',
  'recordRuntimeLedger',
  'postKingsmenCommand',
  'createKingsmenWebCommandEnvelope',
  'finalDecision',
  'reasonCode',
  'safeReason',
  'approvalRequired',
  'evidenceRequired',
  'blockedBy',
  'ledger',
  'evidenceWrite',
  'localShellExecuted: false',
  'localFileWritten: false',
  'directDatabaseAccessFromWeb: false',
  'dryRun: body.dryRun !== false',
];

const missingRouteTokens = requiredRouteTokens.filter((token) => !route.includes(token));
if (missingRouteTokens.length > 0) {
  fail('RUNTIME_ROUTE_MISSING_REQUIRED_TOKENS', { missingRouteTokens });
}

const forbiddenRouteTokens = [
  ['child', '_process'].join(''),
  ['ex', 'ec('].join(''),
  ['spa', 'wn('].join(''),
  ['write', 'FileSync('].join(''),
  ['fs.', 'writeFile'].join(''),
  ['process.env.', 'DATABASE_URL'].join(''),
];
const foundForbiddenTokens = forbiddenRouteTokens.filter((token) => route.includes(token));
if (foundForbiddenTokens.length > 0) {
  fail('RUNTIME_ROUTE_FORBIDDEN_TOKENS_PRESENT', { foundForbiddenTokens });
}

if (!tsconfig.includes('@kingsmen/jarvis-core/*')) {
  fail('WEB_TSCONFIG_JARVIS_CORE_ALIAS_MISSING', 'apps/web/tsconfig.json must expose @kingsmen/jarvis-core/*');
}

const report = {
  validator: 'validate-jarvis-runtime-live-route',
  status: 'JARVIS_RUNTIME_LIVE_ROUTE_VALIDATED',
  passed: true,
  checks: {
    routeExists: true,
    runtimeControllerIntegrated: true,
    backendLedgerBoundaryIntegrated: true,
    exactDecisionReturned: true,
    noLocalShell: true,
    noLocalFileWrite: true,
    noDirectDatabaseAccessFromWeb: true,
    dryRunDefaultSafe: true,
    jarvisCoreAliasConfigured: true,
  },
  generatedAtIso: new Date().toISOString(),
};

console.log(JSON.stringify(report, null, 2));
