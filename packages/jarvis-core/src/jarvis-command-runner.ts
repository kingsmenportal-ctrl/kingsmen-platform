import type {
  JarvisCommandEnvelope,
  JarvisPolicyDecision,
  JarvisToolCapabilityCard
} from '../../contracts/src/jarvis';
import {
  JarvisEvidenceLedger,
  jarvisAppendPolicyDecision,
  jarvisAppendToolPlan,
  jarvisAssertEvidenceLedgerSafe,
  jarvisStartEvidenceLedger
} from './jarvis-evidence-ledger';
import { jarvisEvaluatePolicy } from './jarvis-policy-gate';
import { jarvisGetTool } from './jarvis-tool-registry';

export interface JarvisCommandRunResult {
  readonly command: JarvisCommandEnvelope;
  readonly tool?: JarvisToolCapabilityCard;
  readonly decision: JarvisPolicyDecision;
  readonly ledger: JarvisEvidenceLedger;
  readonly executable: boolean;
  readonly nextStep:
    | 'respond_only'
    | 'dry_run_tool_plan'
    | 'request_founder_approval'
    | 'execute_allowed_tool'
    | 'blocked';
}

export function jarvisPlanCommandRun(input: {
  readonly command: JarvisCommandEnvelope;
  readonly toolRef?: string;
}): JarvisCommandRunResult {
  const tool = input.toolRef ? jarvisGetTool(input.toolRef) : undefined;
  let ledger = jarvisStartEvidenceLedger(input.command);

  if (tool) {
    ledger = jarvisAppendToolPlan(ledger, input.command, tool);
  }

  const decision = jarvisEvaluatePolicy(input.command, tool);
  ledger = jarvisAppendPolicyDecision(ledger, input.command, decision);
  jarvisAssertEvidenceLedgerSafe(ledger);

  if (decision.decision === 'BLOCK') {
    return {
      command: input.command,
      tool,
      decision,
      ledger,
      executable: false,
      nextStep: 'blocked'
    };
  }

  if (decision.decision === 'APPROVAL_REQUIRED') {
    return {
      command: input.command,
      tool,
      decision,
      ledger,
      executable: false,
      nextStep: 'request_founder_approval'
    };
  }

  if (decision.decision === 'DRY_RUN_ONLY') {
    return {
      command: input.command,
      tool,
      decision,
      ledger,
      executable: true,
      nextStep: 'dry_run_tool_plan'
    };
  }

  return {
    command: input.command,
    tool,
    decision,
    ledger,
    executable: true,
    nextStep: tool ? 'execute_allowed_tool' : 'respond_only'
  };
}
