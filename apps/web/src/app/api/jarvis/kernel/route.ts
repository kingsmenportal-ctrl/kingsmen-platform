import { NextRequest, NextResponse } from 'next/server';
import { runJarvisApiKernelBridge } from '@/lib/jarvis/api/api-runtime-bridge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanMessage(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function GET() {
  const startedAt = new Date();
  const bridge = runJarvisApiKernelBridge({
    message: 'Jarvis kernel status',
    actor: 'commander',
    nowIso: startedAt.toISOString(),
  });
  const finishedAt = new Date();

  return NextResponse.json({
    ok: bridge.ok,
    name: 'PJ45 Jarvis Kernel API',
    answer: bridge.answer,
    kernel: bridge.kernel,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  });
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));
  const message = cleanMessage(body.message) || cleanMessage(body.input) || 'Jarvis kernel request';

  const bridge = runJarvisApiKernelBridge({
    message,
    actor: 'commander',
    nowIso: startedAt.toISOString(),
  });
  const finishedAt = new Date();

  return NextResponse.json({
    ok: bridge.ok,
    reply: bridge.answer,
    answer: bridge.answer,
    kernel: bridge.kernel,
    message,
    selectedTool: bridge.kernel.command.commandId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  }, { status: bridge.ok ? 200 : 409 });
}
