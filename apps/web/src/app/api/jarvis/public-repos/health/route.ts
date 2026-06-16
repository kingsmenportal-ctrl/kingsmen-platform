import { NextRequest, NextResponse } from 'next/server';
import { buildJarvisPublicGatewayHealthProbe } from '@/lib/jarvis/public-integrations/JarvisPublicGatewayHealthProbe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const timeoutParam = request.nextUrl.searchParams.get('timeoutMs');
  const timeoutMs = timeoutParam ? Number(timeoutParam) : 2500;

  const payload = await buildJarvisPublicGatewayHealthProbe({
    origin,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 2500
  });

  return NextResponse.json(payload);
}
