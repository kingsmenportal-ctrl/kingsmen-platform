import type { JarvisCommandDefinition, JarvisPolicyDecision, JarvisRuntimeRequest } from './types';

export function evaluateJarvisPolicy(
  request: JarvisRuntimeRequest,
  command: JarvisCommandDefinition,
): JarvisPolicyDecision {
  if (request.actor !== 'commander' && request.actor !== 'founder_operator') {
    return { allowed: false, riskLevel: 'blocked', approvalRequired: false, reason: 'Actor not allowed.' };
  }

  if (command.riskLevel === 'blocked') {
    return { allowed: false, riskLevel: 'blocked', approvalRequired: true, reason: command.blockedReason ?? 'Command blocked.' };
  }

  if (command.approvalRequired && !request.approvalToken) {
    return { allowed: false, riskLevel: command.riskLevel, approvalRequired: true, reason: 'Commander review required.' };
  }

  if (!command.evidenceRequired) {
    return { allowed: false, riskLevel: 'blocked', approvalRequired: false, reason: 'Evidence rule missing.' };
  }

  return { allowed: true, riskLevel: command.riskLevel, approvalRequired: command.approvalRequired, reason: 'Allowed.' };
}
