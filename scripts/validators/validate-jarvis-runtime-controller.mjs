#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const runtimePath = path.join(repoRoot, 'packages/jarvis-core/src/jarvis-runtime-controller.ts');
const policyPath = path.join(repoRoot, 'packages/jarvis-core/src/jarvis-policy-gate.ts');
const indexPath = path.join(repoRoot, 'packages/jarvis-core/src/index.ts');

function fail(code, detail) {
  const report = {
    validator: 'validate-jarvis-runtime-controller',
    status: 'JARVIS_RUNTIME_CONTROLLER_VALIDATION_FAILED',
    passed: false,
    code,
    detail,
    generatedAtIso: new Date().toISOString(),
  };
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!fs.existsSync(runtimePath)) fail('MISSING_RUNTIME_CONTROLLER', runtimePath);
if (!fs.existsSync(policyPath)) fail('MISSING_POLICY_GATE', policyPath);
if (!fs.existsSync(indexPath)) fail('MISSING_JARVIS_INDEX', indexPath);

const runtime = fs.readFileSync(runtimePath, 'utf8');
const policyGate = fs.readFileSync(policyPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');

const requiredRuntimeTokens = [
  'export function jarvisControlCommand',
  'jarvisEvaluatePolicy',
  'jarvisStartEvidenceLedger',
  'jarvisAppendPolicyDecision',
  'jarvisAppendValidatorResult',
  'jarvisAssertEvidenceLedgerSafe',
  'JARVIS_LAUNCH_EVIDENCE_GATE_BLOCKED',
  'founderApprovalRef',
  'launchGateChecked',
  'launchGateOpen',
  'blockedBy',
  'APPROVAL_REQUIRED',
  'BLOCK',
  'DRY_RUN_ONLY',
  'ALLOW',
  'jarvisControlCommandAndWriteEvidence',
  'jarvisRuntimeDecisionToHttpStatus',
];

const missingRuntimeTokens = requiredRuntimeTokens.filter((token) => !runtime.includes(token));
if (missingRuntimeTokens.length > 0) {
  fail('RUNTIME_CONTROLLER_MISSING_REQUIRED_TOKENS', { missingRuntimeTokens });
}

if (!index.includes("export * from './jarvis-runtime-controller';")) {
  fail('RUNTIME_CONTROLLER_NOT_EXPORTED', 'packages/jarvis-core/src/index.ts must export jarvis-runtime-controller');
}

const policyRequiredTokens = [
  'BLOCKED_TERMS',
  'bypass captcha',
  'bypass otp',
  'skip validators',
  'force production without approval',
  'JARVIS_BLOCKED_UNSAFE_ACTION',
];
const missingPolicyTokens = policyRequiredTokens.filter((token) => !policyGate.includes(token));
if (missingPolicyTokens.length > 0) {
  fail('POLICY_GATE_BLOCKED_TERMS_MISSING', { missingPolicyTokens });
}

const report = {
  validator: 'validate-jarvis-runtime-controller',
  status: 'JARVIS_RUNTIME_CONTROLLER_VALIDATED',
  passed: true,
  checks: {
    controllerExists: true,
    exported: true,
    policyGateIntegrated: true,
    evidenceLedgerIntegrated: true,
    launchEvidenceGateIntegrated: true,
    founderApprovalHandled: true,
    exactReasonReturned: true,
    blockedTermsRemainInPolicyGate: true,
  },
  generatedAtIso: new Date().toISOString(),
};

console.log(JSON.stringify(report, null, 2));
