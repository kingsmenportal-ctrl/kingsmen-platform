import { NextResponse } from "next/server";
import { getJarvisRealBuildLock } from "@/lib/jarvis/real-build-lock";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    lock: getJarvisRealBuildLock()
  });
}
