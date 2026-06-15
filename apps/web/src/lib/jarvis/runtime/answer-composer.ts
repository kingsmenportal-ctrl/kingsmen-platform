import type { JarvisRuntimeResult } from './types';

export function composeJarvisAnswer(result: Omit<JarvisRuntimeResult, 'answer' | 'ok'>): string {
  const blocked = !result.policy.allowed || !result.toolRoute.allowed || result.command.riskLevel === 'blocked';

  if (blocked) {
    return [
      'Commander, Jarvis cannot execute that path.',
      `Reason: ${result.policy.reason || result.toolRoute.reason}`,
      `Intent: ${result.intent.intentId}`,
      `Command: ${result.command.commandId}`,
      'Next safe action: use an approved Kingsmen workflow or request a reviewable plan.',
    ].join('\n');
  }

  return [
    'Commander, Jarvis has routed the request safely.',
    `Intent: ${result.intent.intentId} (${result.intent.confidence})`,
    `Command: ${result.command.commandId}`,
    `Adapter: ${result.toolRoute.adapterId}`,
    `Source confidence: ${result.sourceConfidence.band}`,
    `Evidence: ${result.evidence.evidenceId}`,
  ].join('\n');
}
