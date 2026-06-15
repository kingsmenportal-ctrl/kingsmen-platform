import { NextResponse } from 'next/server';
import { runJarvisKernelSmokeSuite } from '@/lib/jarvis/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = new Date();
  const suite = runJarvisKernelSmokeSuite(startedAt.toISOString());
  const finishedAt = new Date();

  return NextResponse.json({
    ok: suite.passed,
    name: 'PJ50 Jarvis Kernel Smoke Suite',
    suite,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  }, { status: suite.passed ? 200 : 409 });
}
