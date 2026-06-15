export type LangfuseTraceRisk = 'safe_metadata' | 'redacted_sensitive' | 'blocked_raw_sensitive';

export type LangfuseTraceSource =
  | 'jarvis_kernel'
  | 'jarvis_voice_gateway'
  | 'playwright_scout'
  | 'document_extraction'
  | 'public_repo_adapter'
  | 'manual_operator_note';

export interface LangfuseTraceGatewayRequest {
  source: LangfuseTraceSource;
  actor: 'commander' | 'founder_operator' | 'system';
  eventName: string;
  evidenceId?: string;
  candidateId?: string;
  commandId?: string;
  intentId?: string;
  adapterId?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  allowTraceExport?: boolean;
}

export interface LangfuseTraceGatewayResult {
  ok: boolean;
  adapterId: 'LangfuseTraceGateway';
  repository: 'langfuse/langfuse';
  traceId: string;
  evidenceId: string;
  risk: LangfuseTraceRisk;
  redacted: true;
  exportedToLangfuse: false;
  postgresEvidenceAuthority: true;
  warnings: string[];
  safeTrace: Record<string, unknown>;
}

export const LangfuseTraceGatewayContract = {
  adapterId: 'LangfuseTraceGateway',
  repository: 'langfuse/langfuse',
  status: 'contract_ready',
  runtimeMode: 'sidecar_service',
  productionTraceExportAllowed: false,
  postgresEvidenceAuthority: true,
  blockedTraceInputs: [
    'raw sensitive documents',
    'raw candidate identity values',
    'raw payment values',
    'login/session material',
    'private system credentials',
    'raw audio recordings',
    'unredacted candidate bundles'
  ],
  allowedTraceInputs: [
    'event_name',
    'source',
    'adapter_id',
    'intent_id',
    'command_id',
    'redacted_input_summary',
    'redacted_output_summary',
    'evidence_id',
    'risk_level',
    'source_confidence_band',
    'duration_ms',
    'safe_metadata'
  ],
  mandatoryBoundaries: [
    'No secret values in traces.',
    'No raw sensitive documents in traces.',
    'No raw candidate identity or payment values in traces.',
    'No raw audio recordings in traces.',
    'PostgreSQL evidence remains Kingsmen authority.',
    'Langfuse is observability metadata only until production approval.'
  ]
} as const;

export function assertLangfuseTraceRequestSafe(request: LangfuseTraceGatewayRequest): string[] {
  const warnings: string[] = [];
  if (!request.source) warnings.push('source is required.');
  if (!request.actor) warnings.push('actor is required.');
  if (!request.eventName?.trim()) warnings.push('eventName is required.');
  if (request.allowTraceExport) warnings.push('Trace export was requested, but export is disabled until production approval.');
  return warnings;
}
