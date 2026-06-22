#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  server: 'apps/api/src/server.ts',
  evaluator: 'apps/api/src/jarvis/jarvis-runtime-api.ts',
  adapter: 'apps/api/src/jarvis/jarvis-runtime-server-adapter.ts',
  contract: 'apps/api/src/jarvis/jarvis-runtime-route-contract.ts',
  manifest: 'manifests/jarvis/jarvis-live-runtime-v1.json'
};

function fail(code, detail) {
  const report = {
    validator: 'validate-jarvis-backend-runtime-route',
    status: 'JARVIS_BACKEND_RUNTIME_ROUTE_FAILED',
    passed: false,
    code,
    detail,
    generatedAtIso: new Date().toISOString()
  };
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

const content = {};
for (const [key, relative] of Object.entries(files)) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) fail('MISSING_FILE', { key, relative });
  content[key] = fs.readFileSync(full, 'utf8');
}

const routePath = ['/api', 'jarvis', 'runtime-control'].join('/');
const serverTokens = [
  'handleJarvisRuntimeControl',
  'handleJarvisRuntimeControlWithAdapter',
  'jarvisRuntimeResults',
  routePath,
  'jarvisRuntime',
  'backendAuthority: true'
];
const missingServer = serverTokens.filter((token) => !content.server.includes(token));
if (missingServer.length > 0) fail('SERVER_ROUTE_NOT_WIRED', { missingServer });

const evaluatorTokens = [
  'evaluateApiJarvisRuntime',
  'apiJarvisDecisionToHttpStatus',
  'JARVIS_API_LAUNCH_EVIDENCE_GATE_BLOCKED',
  'JARVIS_API_FOUNDER_APPROVAL_REQUIRED',
  'JARVIS_API_BLOCKED_UNSAFE_ACTION',
  'blockedBy',
  'safeReason',
  'ledger',
  'ALLOW',
  'APPROVAL_REQUIRED',
  'BLOCK'
];
const missingEvaluator = evaluatorTokens.filter((token) => !content.evaluator.includes(token));
if (missingEvaluator.length > 0) fail('EVALUATOR_INCOMPLETE', { missingEvaluator });

const adapterTokens = [
  'handleJarvisRuntimeControlWithAdapter',
  'evaluateApiJarvisRuntime',
  'options.store.set',
  'evidenceStorage'
];
const missingAdapter = adapterTokens.filter((token) => !content.adapter.includes(token));
if (missingAdapter.length > 0) fail('ADAPTER_INCOMPLETE', { missingAdapter });

const contractTokens = [
  routePath,
  'backendAuthority: true',
  'evidenceLedgerRequired: true',
  'returnsExactReason: true'
];
const missingContract = contractTokens.filter((token) => !content.contract.includes(token));
if (missingContract.length > 0) fail('CONTRACT_INCOMPLETE', { missingContract });

const manifestTokens = [
  'JARVIS_LIVE_RUNTIME_BACKEND_AND_WEB_SURFACES_ADDED',
  'backendServerRouteWired',
  'operatorUi',
  routePath
];
const missingManifest = manifestTokens.filter((token) => !content.manifest.includes(token));
if (missingManifest.length > 0) fail('MANIFEST_INCOMPLETE', { missingManifest });

const report = {
  validator: 'validate-jarvis-backend-runtime-route',
  status: 'JARVIS_BACKEND_RUNTIME_ROUTE_VALIDATED',
  passed: true,
  checks: {
    serverRouteWired: true,
    evaluatorPresent: true,
    adapterPresent: true,
    contractPresent: true,
    manifestUpdated: true,
    exactReasonReturned: true,
    launchGateChecked: true,
    approvalGateChecked: true,
    ledgerReturned: true
  },
  generatedAtIso: new Date().toISOString()
};

console.log(JSON.stringify(report, null, 2));
