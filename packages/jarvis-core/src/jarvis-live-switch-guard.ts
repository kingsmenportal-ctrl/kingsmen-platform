export type JarvisLiveSwitchDecision = 'READY_FOR_CONTROLLED_SWITCH' | 'BLOCKED_BY_GATE' | 'BLOCKED_BY_REVIEW';

export interface JarvisLiveGateInput {
  readonly gateRef: string;
  readonly title: string;
  readonly exists: boolean;
  readonly passed: boolean;
  readonly reviewed: boolean;
  readonly redacted: boolean;
  readonly status: string;
  readonly nextAction: string;
}

export interface JarvisLiveSwitchInput {
  readonly gates: readonly JarvisLiveGateInput[];
  readonly founderApprovalRef?: string;
  readonly finalBundleComplete: boolean;
  readonly launchAuditClear: boolean;
}

export interface JarvisLiveSwitchGuardResult {
  readonly decision: JarvisLiveSwitchDecision;
  readonly ready: boolean;
  readonly reasonCode: string;
  readonly safeReason: string;
  readonly blockedBy: readonly string[];
  readonly nextAction: string;
}

export function jarvisEvaluateLiveSwitch(input: JarvisLiveSwitchInput): JarvisLiveSwitchGuardResult {
  const blockedBy: string[] = [];

  for (const gate of input.gates) {
    if (!(gate.exists && gate.passed && gate.reviewed && gate.redacted)) {
      blockedBy.push(`${gate.gateRef}:${gate.status}`);
    }
  }

  if (!input.finalBundleComplete) blockedBy.push('final_bundle_incomplete');
  if (!input.launchAuditClear) blockedBy.push('launch_audit_not_clear');

  if (blockedBy.length > 0) {
    return {
      decision: 'BLOCKED_BY_GATE',
      ready: false,
      reasonCode: 'JARVIS_LIVE_SWITCH_GATES_BLOCKED',
      safeReason: `Jarvis cannot open the live switch because these gates are not complete: ${blockedBy.join(', ')}.`,
      blockedBy,
      nextAction: 'Complete the blocked gates with real evidence and rerun the gate evaluator.'
    };
  }

  if (!input.founderApprovalRef) {
    return {
      decision: 'BLOCKED_BY_REVIEW',
      ready: false,
      reasonCode: 'JARVIS_LIVE_SWITCH_FOUNDER_APPROVAL_REQUIRED',
      safeReason: 'Jarvis requires a final founder approval reference before controlled live switch can proceed.',
      blockedBy: ['founder_approval_ref_missing'],
      nextAction: 'Record final founder approval after every gate has passed.'
    };
  }

  return {
    decision: 'READY_FOR_CONTROLLED_SWITCH',
    ready: true,
    reasonCode: 'JARVIS_LIVE_SWITCH_READY_WITH_APPROVAL',
    safeReason: 'All Jarvis gates are complete and final founder approval is present. Proceed only through the controlled deployment process.',
    blockedBy: [],
    nextAction: 'Use controlled deployment approval. Do not bypass release controls.'
  };
}
