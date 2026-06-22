import type {
  JarvisActionRisk,
  JarvisCommandEnvelope,
  JarvisDecision,
  JarvisEvidenceEvent,
  JarvisPolicyDecision,
  JarvisToolCapabilityCard
} from '../../contracts/src/jarvis';
import {
  JarvisEvidenceLedger,
  jarvisAppendPolicyDecision,
  jarvisAppendToolPlan,
  jarvisAppendValidatorResult,
  jarvisAssertEvidenceLedgerSafe,
  jarvisCreateEvidenceEvent,
  jarvisStartEvidenceLedger
} from './jarvis-evidence-ledger';
import { jarvisEvaluatePolicy } from './jarvis-policy-gate';
import { jarvisGetTool } from './jarvis-tool-registry';

export type JarvisRuntimeFinalDecision =
  | 'ALLOW'
  | 'DRY_RUN_ONLY'
  | 'APPROVAL_REQUIRED'
  | 'BLOCK';

export type JarvisRuntimeNextStep =
  | 'respond_only'
  | 'dry_run_tool_plan'
  | 'request_founder_approval'
  | 'execute_allowed_tool'
  | 'blocked';

export interface JarvisLaunchEvidenceReportRef {
  readonly path: string;
  readonly status: string;
  readonly passed: boolean;
  readonly reviewed: boolean;
  readonly redacted: boolean;
}

export interface JarvisLaunchEvidenceState {
  readonly publicLaunchStatus: 'open' | 'blocked' | 'unknown';
  readonly finalAssemblyStatus?: string;
  readonly finalAssemblyCanOpen?: boolean;
  readonly productionReady?: boolean;
  readonly publicLaunchAllowed?: boolean;
  readonly blockers?: readonly {
    readonly code: string;
    readonly title: string;
  }[];
  readonly warnings?: readonly {
    readonly code: string;
    readonly title: string;
  }[];
  readonly reports?: readonly JarvisLaunchEvidenceReportRef[];
}

export interface JarvisRuntimeEvidenceWriter {
  readonly writeEvent: (event: JarvisEvidenceEvent) => void | Promise<void>;
}

export interface JarvisRuntimeControllerInput {
  readonly command: JarvisCommandEnvelope;
  readonly toolRef?: string;
  readonly launchEvidence?: JarvisLaunchEvidenceState;
  readonly evidenceWriter?: JarvisRuntimeEvidenceWriter;
}

export interface JarvisRuntimeControllerResult {
  readonly command: JarvisCommandEnvelope;
  readonly tool?: JarvisToolCapabilityCard;
  readonly policyDecision: JarvisPolicyDecision;
  readonly finalDecision: JarvisRuntimeFinalDecision;
  readonly risk: JarvisActionRisk;
  readonly reasonCode: string;
  readonly safeReason: string;
  readonly approvalRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly executable: boolean;
  readonly nextStep: JarvisRuntimeNextStep;
  readonly launchGateChecked: boolean;
  readonly launchGateOpen: boolean;
  readonly founderApprovalRef?: string;
  readonly blockedBy: readonly string[];
  readonly ledger: JarvisEvidenceLedger;
}

const LIVE_ACTION_TERMS = [
  'production',
  'prod',
  'release',
  'live',
  'enable live',
  'candidate submission',
  'send candidate',
  'payment',
  'payfast',
  'refund',
  'branch protection',
  'provider staging',
  'public launch'
];

function textIncludesAny(text: string, terms: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function commandLooksLive(command: JarvisCommandEnvelope, tool?: JarvisToolCapabilityCard): boolean {
  const text = `${command.commandTextSafe} ${command.intendedAction}`;
  return (
    command.mode === 'production_approval_mode' ||
    command.requestedAuthorityLevel === 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED' ||
    tool?.productionWriteCapable === true ||
    textIncludesAny(text, LIVE_ACTION_TERMS)
  );
}

function launchGateOpen(state?: JarvisLaunchEvidenceState): boolean {
  if (!state) return false;
  if (state.publicLaunchStatus !== 'open') return false;
  if (state.publicLaunchAllowed !== true) return false;
  if (state.productionReady !== true) return false;
  if (state.blockers && state.blockers.length > 0) return false;
  return true;
}

function summarizeLaunchBlockers(state?: JarvisLaunchEvidenceState): readonly string[] {
  if (!state) return ['launch_evidence_missing'];

  const blockers = new Set<string>();
  if (state.publicLaunchStatus !== 'open') blockers.add(`publicLaunchStatus:${state.publicLaunchStatus}`);
  if (state.publicLaunchAllowed !== true) blockers.add('publicLaunchAllowed:false');
  if (state.productionReady !== true) blockers.add('productionReady:false');
  for (const blocker of state.blockers ?? []) blockers.add(blocker.code);
  for (const report of state.reports ?? []) {
    if (!(report.passed && report.reviewed && report.redacted)) {
      blockers.add(`${report.path}:${report.status}`);
    }
  }
  return [...blockers];
}

function nextStepForDecision(finalDecision: JarvisRuntimeFinalDecision, tool?: JarvisToolCapabilityCard): JarvisRuntimeNextStep {
  if (finalDecision === 'BLOCK') return 'blocked';
  if (finalDecision === 'APPROVAL_REQUIRED') return 'request_founder_approval';
  if (finalDecision === 'DRY_RUN_ONLY') return 'dry_run_tool_plan';
  return tool ? 'execute_allowed_tool' : 'respond_only';
}

function evidenceSummary(finalDecision: JarvisRuntimeFinalDecision, reasonCode: string): string {
  return `Jarvis runtime final decision ${finalDecision}: ${reasonCode}.`;
}

export function jarvisControlCommand(input: JarvisRuntimeControllerInput): JarvisRuntimeControllerResult {
  const tool = input.toolRef ? jarvisGetTool(input.toolRef) : undefined;
  let ledger = jarvisStartEvidenceLedger(input.command);

  if (tool) ledger = jarvisAppendToolPlan(ledger, input.command, tool);

  const policyDecision = jarvisEvaluatePolicy(input.command, tool);
  ledger = jarvisAppendPolicyDecision(ledger, input.command, policyDecision);

  const isLiveAction = commandLooksLive(input.command, tool);
  const checkedLaunchGate = isLiveAction || policyDecision.risk === 'HIGH_PRODUCTION_RISK' || policyDecision.risk === 'HIGH_CONNECTOR_WRITE';
  const gateOpen = checkedLaunchGate ? launchGateOpen(input.launchEvidence) : true;
  const blockedBy = checkedLaunchGate && !gateOpen ? summarizeLaunchBlockers(input.launchEvidence) : [];

  let finalDecision: JarvisRuntimeFinalDecision = policyDecision.decision;
  let reasonCode = policyDecision.reasonCode;
  let safeReason = policyDecision.safeReason;
  let approvalRequired = policyDecision.approvalRequired;
  let evidenceRequired = policyDecision.evidenceRequired;

  if (policyDecision.decision === 'BLOCK') {
    finalDecision = 'BLOCK';
  } else if (checkedLaunchGate && !gateOpen) {
    finalDecision = 'BLOCK';
    reasonCode = 'JARVIS_LAUNCH_EVIDENCE_GATE_BLOCKED';
    safeReason = `Jarvis blocked the live action because launch evidence is incomplete: ${blockedBy.join(', ')}.`;
    approvalRequired = false;
    evidenceRequired = true;
  } else if (policyDecision.decision === 'APPROVAL_REQUIRED') {
    finalDecision = input.command.founderApprovalRef ? 'ALLOW' : 'APPROVAL_REQUIRED';
    reasonCode = input.command.founderApprovalRef ? 'JARVIS_APPROVAL_PRESENT_RUNTIME_ALLOWED' : policyDecision.reasonCode;
    safeReason = input.command.founderApprovalRef
      ? 'Founder approval reference is present and launch/evidence gates allow this action.'
      : policyDecision.safeReason;
    approvalRequired = !input.command.founderApprovalRef;
  }

  ledger = jarvisAppendValidatorResult(ledger, input.command, {
    validatorRef: 'jarvis.runtime_controller',
    passed: finalDecision !== 'BLOCK' && finalDecision !== 'APPROVAL_REQUIRED',
    safeSummary: evidenceSummary(finalDecision, reasonCode)
  });

  if (finalDecision === 'BLOCK') {
    ledger = {
      events: [
        ...ledger.events,
        jarvisCreateEvidenceEvent({
          command: input.command,
          eventType: 'blocked',
          safeSummary: safeReason,
          sequence: ledger.events.length + 1
        })
      ]
    };
  }

  jarvisAssertEvidenceLedgerSafe(ledger);

  const result: JarvisRuntimeControllerResult = {
    command: input.command,
    tool,
    policyDecision,
    finalDecision,
    risk: policyDecision.risk,
    reasonCode,
    safeReason,
    approvalRequired,
    evidenceRequired,
    executable: finalDecision === 'ALLOW' || finalDecision === 'DRY_RUN_ONLY',
    nextStep: nextStepForDecision(finalDecision, tool),
    launchGateChecked: checkedLaunchGate,
    launchGateOpen: gateOpen,
    founderApprovalRef: input.command.founderApprovalRef,
    blockedBy,
    ledger
  };

  return result;
}

export async function jarvisControlCommandAndWriteEvidence(
  input: JarvisRuntimeControllerInput
): Promise<JarvisRuntimeControllerResult> {
  const result = jarvisControlCommand(input);
  if (input.evidenceWriter) {
    for (const event of result.ledger.events) {
      await input.evidenceWriter.writeEvent(event);
    }
  }
  return result;
}

export function jarvisRuntimeDecisionToHttpStatus(result: JarvisRuntimeControllerResult): number {
  if (result.finalDecision === 'BLOCK') return 403;
  if (result.finalDecision === 'APPROVAL_REQUIRED') return 423;
  if (result.finalDecision === 'DRY_RUN_ONLY') return 202;
  return 200;
}
