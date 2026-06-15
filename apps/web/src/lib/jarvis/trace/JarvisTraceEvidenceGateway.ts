import type { LangfuseTraceGatewayRequest, LangfuseTraceGatewayResult, LangfuseTraceRisk } from '@/lib/public-repos/live/adapters/LangfuseTraceGateway.contract';
import { assertLangfuseTraceRequestSafe } from '@/lib/public-repos/live/adapters/LangfuseTraceGateway.contract';

const REDACTED = '[REDACTED]';

const sensitivePatterns: RegExp[] = [
  /\b\d{13}\b/g,
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:password|secret|credential|private|session|cookie|payment|card|cvv|otp|pin)\b\s*[:=]?\s*[^\s,;]+/gi,
];

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value ?? '');
  }
}

export function redactTraceValue(value: unknown): { value: unknown; hits: number } {
  const raw = safeStringify(value);
  let hits = 0;
  let redacted = raw;
  for (const pattern of sensitivePatterns) {
    redacted = redacted.replace(pattern, () => {
      hits += 1;
      return REDACTED;
    });
  }
  const limited = redacted.length > 1800 ? `${redacted.slice(0, 1800)}...` : redacted;
  return { value: limited, hits };
}

function classifyRisk(inputHits: number, outputHits: number, warnings: string[]): LangfuseTraceRisk {
  if (warnings.some((warning) => warning.includes('export is disabled'))) return 'redacted_sensitive';
  if (inputHits + outputHits > 0) return 'redacted_sensitive';
  return 'safe_metadata';
}

export function buildJarvisTraceEvidence(request: LangfuseTraceGatewayRequest): LangfuseTraceGatewayResult {
  const checkedAt = new Date().toISOString();
  const warnings = assertLangfuseTraceRequestSafe(request);
  const input = redactTraceValue(request.input);
  const output = redactTraceValue(request.output);
  const metadata = redactTraceValue(request.metadata ?? {});
  const risk = classifyRisk(input.hits, output.hits, warnings);
  const evidenceId = request.evidenceId || makeId('evidence');
  const traceId = makeId('trace');

  const safeTrace = {
    traceId,
    evidenceId,
    checkedAt,
    source: request.source,
    actor: request.actor,
    eventName: request.eventName,
    candidateRef: request.candidateId ? `candidate:${request.candidateId.slice(0, 8)}...` : undefined,
    commandId: request.commandId,
    intentId: request.intentId,
    adapterId: request.adapterId,
    inputSummary: input.value,
    outputSummary: output.value,
    metadataSummary: metadata.value,
    redactionHits: input.hits + output.hits + metadata.hits,
    boundary: 'Langfuse metadata draft only; PostgreSQL evidence remains authority.',
  };

  return {
    ok: warnings.length === 0,
    adapterId: 'LangfuseTraceGateway',
    repository: 'langfuse/langfuse',
    traceId,
    evidenceId,
    risk,
    redacted: true,
    exportedToLangfuse: false,
    postgresEvidenceAuthority: true,
    warnings,
    safeTrace,
  };
}
