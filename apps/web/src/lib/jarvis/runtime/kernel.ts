import { composeJarvisAnswer } from './answer-composer';
import { getCommandForIntent } from './command-registry';
import { createEvidenceEntry } from './evidence-ledger';
import { evaluateJarvisPolicy } from './policy-gate';
import { routeJarvisIntent } from './intent-router';
import { classifySourceConfidence } from './source-confidence';
import { selectJarvisAdapter } from './adapter-selector';
import type { JarvisRuntimeRequest, JarvisRuntimeResult } from './types';

export function runJarvisKernel(request: JarvisRuntimeRequest): JarvisRuntimeResult {
  const intent = routeJarvisIntent(request);
  const command = getCommandForIntent(intent.intentId);
  const policy = evaluateJarvisPolicy(request, command);
  const toolRoute = selectJarvisAdapter(command, policy);
  const sourceConfidence = classifySourceConfidence({
    hasEvidence: true,
    isOfficial: command.category === 'kingsmen_knowledge' || command.category === 'repo_inspection',
    isTrusted: true,
    isFresh: intent.freshnessRequired ? command.category !== 'dialogue' : true,
    hasConflict: false,
    isUnsafe: command.riskLevel === 'blocked',
  });

  const evidence = createEvidenceEntry({
    request,
    intent,
    command,
    toolRoute,
    sourceConfidence,
    resultSummary: policy.allowed && toolRoute.allowed ? 'Jarvis request routed safely.' : 'Jarvis request blocked or held for review.',
    nextSafeAction: policy.allowed && toolRoute.allowed ? 'Proceed to adapter implementation.' : 'Use approved Kingsmen review path.',
  });

  const partial = { intent, command, policy, toolRoute, sourceConfidence, evidence };
  const answer = composeJarvisAnswer(partial);

  return {
    ok: policy.allowed && toolRoute.allowed,
    answer,
    ...partial,
  };
}

export function runJarvisKernelSmokeTest(): JarvisRuntimeResult {
  return runJarvisKernel({
    input: 'Jarvis, check Kingsmen knowledge and tell me the safe next phase.',
    actor: 'commander',
    nowIso: new Date().toISOString(),
  });
}
