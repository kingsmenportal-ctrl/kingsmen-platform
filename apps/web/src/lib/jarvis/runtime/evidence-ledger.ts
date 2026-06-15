import type {
  JarvisCommandDefinition,
  JarvisEvidenceEntry,
  JarvisIntentResult,
  JarvisRuntimeRequest,
  JarvisSourceConfidenceDecision,
  JarvisToolRoute,
} from './types';

const makeEvidenceId = () => `jarvis_ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createEvidenceEntry(input: {
  request: JarvisRuntimeRequest;
  intent: JarvisIntentResult;
  command: JarvisCommandDefinition;
  toolRoute: JarvisToolRoute;
  sourceConfidence: JarvisSourceConfidenceDecision;
  resultSummary: string;
  nextSafeAction: string;
}): JarvisEvidenceEntry {
  return {
    evidenceId: makeEvidenceId(),
    timestamp: input.request.nowIso ?? new Date().toISOString(),
    actor: input.request.actor,
    intentId: input.intent.intentId,
    commandId: input.command.commandId,
    adapterId: input.toolRoute.adapterId,
    riskLevel: input.command.riskLevel,
    sourceConfidenceBand: input.sourceConfidence.band,
    resultSummary: input.resultSummary,
    nextSafeAction: input.nextSafeAction,
  };
}
