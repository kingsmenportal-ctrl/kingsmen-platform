import { NextRequest, NextResponse } from 'next/server';
import { buildJarvisPublicGatewayEvidenceSummary } from '@/lib/jarvis/public-integrations/JarvisPublicGatewayEvidenceSummary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function originFromRequest(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('host') ?? '127.0.0.1:3000';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeoutParam = Number(searchParams.get('timeoutMs') ?? '2500');
  const timeoutMs = Number.isFinite(timeoutParam) ? Math.min(Math.max(timeoutParam, 500), 6000) : 2500;

  const summary = await buildJarvisPublicGatewayEvidenceSummary({
    origin: originFromRequest(request),
    timeoutMs
  });

  return NextResponse.json(summary);
}
