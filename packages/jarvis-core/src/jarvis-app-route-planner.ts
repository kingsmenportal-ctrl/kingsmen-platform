import type { JarvisCommandEnvelope } from '../../contracts/src/jarvis';
import type { JarvisAppRoutePlanV1 } from '../../contracts/src/jarvis/app-route-plan';
import { jarvisEvaluatePolicy } from './jarvis-policy-gate';
import { jarvisRequireTool } from './jarvis-tool-registry';

export function jarvisCreateAppRoutePlan(input: {
  readonly planRef: string;
  readonly command: JarvisCommandEnvelope;
  readonly appRef: string;
  readonly safeSummary?: string;
}): JarvisAppRoutePlanV1 {
  const tool = jarvisRequireTool(input.appRef);
  const decision = jarvisEvaluatePolicy(input.command, tool);
  return {
    planRef: input.planRef,
    commandRef: input.command.commandRef,
    appRef: tool.toolRef,
    routeTrust: tool.trustLevel,
    routeDecision: decision.decision,
    dryRun: decision.decision === 'DRY_RUN_ONLY',
    founderApprovalRequired: decision.approvalRequired,
    evidenceRequired: decision.evidenceRequired,
    safeSummary:
      input.safeSummary ??
      `Jarvis app route plan ${input.planRef} prepared for ${tool.toolRef} with decision ${decision.decision}.`
  };
}
