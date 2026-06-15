import { NextRequest, NextResponse } from 'next/server';
import { buildJarvisTraceEvidence } from '@/lib/jarvis/trace/JarvisTraceEvidenceGateway';
import type { LangfuseTraceGatewayRequest } from '@/lib/public-repos/live/adapters/LangfuseTraceGateway.contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<LangfuseTraceGatewayRequest>;

  if (!body.source || !body.actor || !body.eventName) {
    return NextResponse.json(
      {
        ok: false,
        error: 'TRACE_SOURCE_ACTOR_EVENT_REQUIRED',
        message: 'Trace evidence requires source, actor, and eventName.',
      },
      { status: 400 },
    );
  }

  const result = buildJarvisTraceEvidence(body as LangfuseTraceGatewayRequest);

  return NextResponse.json({
    ...result,
    doctrine: {
      traceBoundary: 'Metadata and redacted summaries only.',
      noRawSensitiveData: 'Do not send raw candidate documents, raw identity values, raw payment values, or raw audio.',
      exportBoundary: 'External Langfuse export remains disabled until production approval.',
      evidenceAuthority: 'PostgreSQL evidence ledger remains Kingsmen authority.',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Jarvis Trace Evidence Gateway',
    adapterId: 'LangfuseTraceGateway',
    repository: 'langfuse/langfuse',
    method: 'POST',
    required: ['source', 'actor', 'eventName'],
    optional: ['evidenceId', 'candidateId', 'commandId', 'intentId', 'adapterId', 'input', 'output', 'metadata'],
    safety: 'Redacted metadata only. External trace export disabled. PostgreSQL evidence remains authority.',
  });
}
