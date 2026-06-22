#!/usr/bin/env node
import path from 'node:path';
import {
  parseFlags,
  readJsonFileSafe,
  resolveRepoRoot,
  utcNowIso,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));

const gates = [
  {
    gateRef: 'payfast_sandbox_itn_evidence',
    title: 'PayFast sandbox ITN evidence',
    reportPath: 'reports/staging/payfast-provider-sandbox-staging-latest.json',
  },
  {
    gateRef: 'communications_provider_evidence',
    title: 'Real communications provider proof',
    reportPath: 'reports/staging/communications-provider-staging-latest.json',
  },
  {
    gateRef: 'branch_protection_account_review',
    title: 'Branch protection/account review',
    reportPath: 'reports/repo/main-branch-protection-apply-latest.json',
  },
  {
    gateRef: 'final_assembly_founder_review',
    title: 'Final assembly founder review',
    reportPath: 'reports/final-assembly/final-founder-review-latest.json',
  },
];

function gateState(gate) {
  const fullPath = path.join(repoRoot, gate.reportPath);
  const parsed = readJsonFileSafe(fullPath);
  if (!parsed.ok || !parsed.value) {
    return {
      ...gate,
      exists: false,
      passed: false,
      reviewed: false,
      status: parsed.ok ? 'MISSING_REPORT' : 'UNREADABLE_REPORT',
      nextAction: 'Generate the gate report with the registered Node runner.',
      parseError: parsed.ok ? null : parsed.error,
    };
  }

  const report = parsed.value;
  return {
    ...gate,
    exists: true,
    passed: report.passed === true,
    reviewed: report.reviewed === true || report.stagingReviewed === true,
    redacted: report.redacted !== false,
    status: String(report.status ?? 'STATUS_NOT_REPORTED'),
    nextAction: String(report.nextAction ?? 'Review this gate.'),
  };
}

const gateStates = gates.map(gateState);
const blocked = gateStates.filter((gate) => !(gate.exists && gate.passed && gate.reviewed && gate.redacted !== false));
const passed = blocked.length === 0;

const result = {
  schema: 'kingsmen.jarvis-gate-evaluation.v1',
  status: passed ? 'JARVIS_GATES_READY_FOR_FINAL_SWITCH_REVIEW' : 'JARVIS_GATES_BLOCKED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  gateCount: gateStates.length,
  passedGateCount: gateStates.length - blocked.length,
  blockedGateCount: blocked.length,
  gates: gateStates,
  blockedGates: blocked.map((gate) => ({
    gateRef: gate.gateRef,
    title: gate.title,
    status: gate.status,
    nextAction: gate.nextAction,
  })),
  generatedAt: utcNowIso(),
  nextAction: passed
    ? 'All tracked gates passed. Continue to controlled production switch review.'
    : 'Complete each blocked gate with real evidence. Do not force live activation.',
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!passed) process.exit(1);
