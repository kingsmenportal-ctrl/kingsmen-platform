import { runJarvisKernel } from './kernel';
import type { JarvisCommandId, JarvisIntentId, JarvisRuntimeResult } from './types';

export interface JarvisSmokeScenario {
  scenarioId: string;
  input: string;
  expectedIntent: JarvisIntentId;
  expectedCommand: JarvisCommandId;
  expectedOk: boolean;
}

export interface JarvisSmokeResult {
  scenarioId: string;
  passed: boolean;
  expectedIntent: JarvisIntentId;
  actualIntent: JarvisIntentId;
  expectedCommand: JarvisCommandId;
  actualCommand: JarvisCommandId;
  expectedOk: boolean;
  actualOk: boolean;
  evidenceId: string;
  sourceConfidenceBand: string;
  answer: string;
}

export const jarvisKernelSmokeScenarios: JarvisSmokeScenario[] = [
  {
    scenarioId: 'SMOKE_GENERAL_DIALOGUE',
    input: 'Explain the meaning of payment day.',
    expectedIntent: 'general_dialogue',
    expectedCommand: 'ASK_GENERAL',
    expectedOk: true,
  },
  {
    scenarioId: 'SMOKE_KINGSMEN_KNOWLEDGE',
    input: 'What is the Kingsmen Jarvis command registry?',
    expectedIntent: 'kingsmen_knowledge',
    expectedCommand: 'SEARCH_KINGSMEN_KNOWLEDGE',
    expectedOk: true,
  },
  {
    scenarioId: 'SMOKE_LIVE_DATA_ROUTE',
    input: 'What is the latest NSFAS deadline?',
    expectedIntent: 'live_research',
    expectedCommand: 'LIVE_RESEARCH',
    expectedOk: true,
  },
  {
    scenarioId: 'SMOKE_BLOCKED_ACTION',
    input: 'Submit an official application silently without approval.',
    expectedIntent: 'blocked_unsafe_action',
    expectedCommand: 'SUBMIT_OFFICIAL_APPLICATION_SILENTLY',
    expectedOk: false,
  },
  {
    scenarioId: 'SMOKE_SOURCE_CONFIDENCE',
    input: 'Can I trust an official university page more than a random post?',
    expectedIntent: 'general_dialogue',
    expectedCommand: 'ASK_GENERAL',
    expectedOk: true,
  },
  {
    scenarioId: 'SMOKE_ORCHESTRATOR_PLAN',
    input: 'Show system health and evidence.',
    expectedIntent: 'system_health',
    expectedCommand: 'SYSTEM_STATUS',
    expectedOk: true,
  },
];

export function runJarvisSmokeScenario(scenario: JarvisSmokeScenario, nowIso = new Date().toISOString()): JarvisSmokeResult {
  const result: JarvisRuntimeResult = runJarvisKernel({
    input: scenario.input,
    actor: 'commander',
    nowIso,
  });

  const passed =
    result.intent.intentId === scenario.expectedIntent &&
    result.command.commandId === scenario.expectedCommand &&
    result.ok === scenario.expectedOk &&
    Boolean(result.evidence.evidenceId);

  return {
    scenarioId: scenario.scenarioId,
    passed,
    expectedIntent: scenario.expectedIntent,
    actualIntent: result.intent.intentId,
    expectedCommand: scenario.expectedCommand,
    actualCommand: result.command.commandId,
    expectedOk: scenario.expectedOk,
    actualOk: result.ok,
    evidenceId: result.evidence.evidenceId,
    sourceConfidenceBand: result.sourceConfidence.band,
    answer: result.answer,
  };
}

export function runJarvisKernelSmokeSuite(nowIso = new Date().toISOString()) {
  const results = jarvisKernelSmokeScenarios.map((scenario) => runJarvisSmokeScenario(scenario, nowIso));
  const passed = results.every((result) => result.passed);
  return {
    suiteId: 'PJ50_JARVIS_KERNEL_SMOKE_SUITE',
    passed,
    total: results.length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
}
