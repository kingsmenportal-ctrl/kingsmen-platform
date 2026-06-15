import { NextRequest, NextResponse } from 'next/server';
import { scoutRouteSource } from '@/lib/routes/scout/RouteScoutService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    routeId?: string;
    url?: string;
    mode?: 'metadata_fetch' | 'playwright_page_probe';
    allowedHosts?: string[];
    expectedKeywords?: string[];
    approvalToken?: string;
  };

  if (!body.routeId || !body.url) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ROUTE_ID_AND_URL_REQUIRED',
        message: 'Route scout requires routeId and url so evidence can be linked to the route/source record.',
      },
      { status: 400 },
    );
  }

  const result = await scoutRouteSource({
    routeId: body.routeId,
    url: body.url,
    mode: body.mode ?? 'metadata_fetch',
    allowedHosts: body.allowedHosts,
    expectedKeywords: body.expectedKeywords,
    approvalToken: body.approvalToken,
  });

  return NextResponse.json(
    {
      ...result,
      doctrine: {
        scoutBoundary: 'Safe read-only route/source scouting only.',
        noSubmit: 'This route cannot submit applications, make payments, bypass CAPTCHA, bypass OTP, or fill forms.',
        fallback: 'Blocked, risky, or uncertain portal state must go to MAP/manual review.',
      },
    },
    { status: result.decision === 'blocked' ? 403 : 200 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Kingsmen Route Scout API',
    adapterId: 'PlaywrightScoutGateway',
    modes: ['metadata_fetch', 'playwright_page_probe'],
    defaultMode: 'metadata_fetch',
    method: 'POST',
    required: ['routeId', 'url'],
    optional: ['mode', 'allowedHosts', 'expectedKeywords', 'approvalToken'],
    safety: 'Read-only. No submit, no OTP/CAPTCHA/payment bypass, no password/cookie handling.',
  });
}
