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
    return NextResponse.json({ ok: false, error: 'ROUTE_ID_AND_URL_REQUIRED' }, { status: 400 });
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
      ok: result.ok,
      adapterId: 'PlaywrightScoutGateway',
      repository: 'microsoft/playwright',
      scout: result,
      doctrine: {
        adapterBoundary: 'Jarvis may inspect approved public route/source pages only.',
        noActionBoundary: 'Jarvis may not submit, pay, bypass CAPTCHA/OTP, or handle credentials.',
        manualFallbackBoundary: 'Risky or uncertain portal state returns manual-review/MAP guidance.',
      },
    },
    { status: result.decision === 'blocked' ? 403 : 200 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    adapterId: 'PlaywrightScoutGateway',
    repository: 'microsoft/playwright',
    mode: 'route_source_scout',
    method: 'POST',
    required: ['routeId', 'url'],
    optional: ['mode', 'allowedHosts', 'expectedKeywords', 'approvalToken'],
    safety: 'Read-only scouting. No form submission or bypass actions.',
  });
}
