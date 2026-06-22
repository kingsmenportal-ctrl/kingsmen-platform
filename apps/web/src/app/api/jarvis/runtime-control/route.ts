import { NextRequest, NextResponse } from "next/server";

import { kingsmenBackendJson } from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeProxyResponse = {
  ok?: boolean;
  finalDecision?: string;
  reasonCode?: string;
  safeReason?: string;
  correlationId?: string;
};

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));

  const backend = await kingsmenBackendJson<RuntimeProxyResponse>("/api/jarvis/runtime-control", {
    method: "POST",
    headers: {
      "x-correlation-id": request.headers.get("x-correlation-id") ?? `jarvis_web_${Date.now()}`
    },
    body: JSON.stringify(body)
  });

  const finishedAt = new Date();

  if (!backend.ok || !backend.data) {
    return NextResponse.json(
      {
        ok: false,
        finalDecision: "BLOCK",
        reasonCode: "JARVIS_BACKEND_RUNTIME_AUTHORITY_UNAVAILABLE",
        safeReason: backend.error ?? "Jarvis backend runtime authority is not available.",
        backendStatus: backend.status,
        backendBoundary: backend.boundary,
        webProxy: true,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime()
      },
      { status: backend.status > 0 ? backend.status : 503 }
    );
  }

  return NextResponse.json(
    {
      ...backend.data,
      backendStatus: backend.status,
      backendBoundary: backend.boundary,
      webProxy: true,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime()
    },
    { status: backend.status }
  );
}
