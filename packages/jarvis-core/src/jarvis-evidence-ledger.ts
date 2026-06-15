import type {
  JarvisCommandEnvelope,
  JarvisEvidenceEvent,
  JarvisPolicyDecision,
  JarvisToolCapabilityCard
} from '../../contracts/src/jarvis';
import { jarvisMakeRef } from '../../contracts/src/jarvis';

export interface JarvisEvidenceLedger {
  readonly events: readonly JarvisEvidenceEvent[];
}

export function jarvisCreateEvidenceEvent(input: {
  readonly command: JarvisCommandEnvelope;
  readonly eventType: JarvisEvidenceEvent['eventType'];
  readonly safeSummary: string;
  readonly sequence: number;
  readonly createdAtIso?: string;
}): JarvisEvidenceEvent {
  return {
    eventRef: jarvisMakeRef('jarvis_ev', `${input.command.commandRef}_${input.sequence}`),
    commandRef: input.command.commandRef,
    correlationId: input.command.correlationId,
    eventType: input.eventType,
    safeSummary: input.safeSummary,
    createdAtIso: input.createdAtIso ?? new Date().toISOString()
  };
}

export function jarvisStartEvidenceLedger(command: JarvisCommandEnvelope): JarvisEvidenceLedger {
  return {
    events: [
      jarvisCreateEvidenceEvent({
        command,
        eventType: 'command_received',
        safeSummary: `Jarvis command received on ${command.channel} in ${command.mode}.`,
        sequence: 1
      })
    ]
  };
}

export function jarvisAppendPolicyDecision(
  ledger: JarvisEvidenceLedger,
  command: JarvisCommandEnvelope,
  decision: JarvisPolicyDecision
): JarvisEvidenceLedger {
  return {
    events: [
      ...ledger.events,
      jarvisCreateEvidenceEvent({
        command,
        eventType: decision.decision === 'BLOCK' ? 'blocked' : 'policy_decision',
        safeSummary: `${decision.reasonCode}: ${decision.safeReason}`,
        sequence: ledger.events.length + 1
      })
    ]
  };
}

export function jarvisAppendToolPlan(
  ledger: JarvisEvidenceLedger,
  command: JarvisCommandEnvelope,
  tool: JarvisToolCapabilityCard
): JarvisEvidenceLedger {
  return {
    events: [
      ...ledger.events,
      jarvisCreateEvidenceEvent({
        command,
        eventType: 'tool_invocation_planned',
        safeSummary: `Tool planned: ${tool.toolRef} (${tool.displayName}).`,
        sequence: ledger.events.length + 1
      })
    ]
  };
}

export function jarvisAssertEvidenceLedgerSafe(ledger: JarvisEvidenceLedger): void {
  if (ledger.events.length === 0) {
    throw new Error('JARVIS_EVIDENCE_LEDGER_EMPTY');
  }

  const refs = new Set<string>();
  for (const event of ledger.events) {
    if (!event.eventRef || refs.has(event.eventRef)) {
      throw new Error('JARVIS_EVIDENCE_EVENT_REF_INVALID');
    }
    refs.add(event.eventRef);

    if (!event.safeSummary.trim()) {
      throw new Error('JARVIS_EVIDENCE_SAFE_SUMMARY_REQUIRED');
    }

    const lower = event.safeSummary.toLowerCase();
    if (
      lower.includes('api_key') ||
      lower.includes('password=') ||
      lower.includes('database_url') ||
      lower.includes('private key')
    ) {
      throw new Error('JARVIS_EVIDENCE_SUMMARY_CONTAINS_SECRET_PATTERN');
    }
  }
}
