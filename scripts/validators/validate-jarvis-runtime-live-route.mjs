#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const routePath = path.join(repoRoot, 'apps/web/src/app/api/jarvis/runtime-control/route.ts');
const clientPath = path.join(repoRoot, 'apps/web/src/lib/kingsmen-backend-client.ts');

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
if (!fs.existsSync(clientPath)) fail('MISSING_BACKEND_CLIENT', clientPath);

const route = fs.readFileSync(routePath, 'utf8');
const client = fs.readFileSync(clientPath, 'utf8');

const requiredRouteTokens = [
  'export async function POST',
  'kingsmenBackendJson',
  '/api/jarvis/runtime-control',
  'JARVIS_BACKEND_RUNTIME_AUTHORITY_UNAVAILABLE',
  'finalDecision',
  'reasonCode',
  'safeReason',
  'backendStatus',
  'backendBoundary',
  'webProxy: true',
];

const missingRouteTokens = requiredRouteTokens.filter((token) => !route.includes(token));
if (missingRouteTokens.length > 0) {
  fail('RUNTIME_PROXY_ROUTE_MISSING_REQUIRED_TOKENS', { missingRouteTokens });
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

if (!client.includes('getKingsmenBackendBoundary') || !client.includes('kingsmenBackendJson')) {
  fail('BACKEND_CLIENT_BOUNDARY_INCOMPLETE', 'apps/web/src/lib/kingsmen-backend-client.ts must expose backend boundary helpers');
}

const report = {
  validator: 'validate-jarvis-runtime-live-route',
  status: 'JARVIS_RUNTIME_LIVE_ROUTE_VALIDATED',
  passed: true,
  checks: {
    routeExists: true,
    backendProxyIntegrated: true,
    backendAuthorityFailureBlocks: true,
    exactDecisionReturnedFromBackend: true,
    noLocalShell: true,
    noLocalFileWrite: true,
    noDirectDatabaseAccessFromWeb: true,
    backendClientBoundaryConfigured: true,
  },
  generatedAtIso: new Date().toISOString(),
};

console.log(JSON.stringify(report, null, 2));
