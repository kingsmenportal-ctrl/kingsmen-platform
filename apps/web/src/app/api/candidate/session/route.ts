import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports only whether the server verified the Supabase Auth session.
 * This deliberately does not claim that a candidate profile or application
 * record is linked; that requires an explicit identity mapping.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store", Pragma: "no-cache" };

  if (!authConfigured()) {
    return NextResponse.json(
      { ok: false, authenticated: false, candidateRecordLinked: false, status: "UNAVAILABLE", code: "IDENTITY_PROVIDER_NOT_CONFIGURED" },
      { status: 503, headers }
    );
  }

  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: true, authenticated: false, candidateRecordLinked: false, status: "SIGNED_OUT" },
        { status: 401, headers }
      );
    }

    return NextResponse.json(
      { ok: true, authenticated: true, candidateRecordLinked: false, status: "AUTHENTICATED_PROFILE_NOT_LINKED" },
      { status: 200, headers }
    );
  } catch {
    return NextResponse.json(
      { ok: false, authenticated: false, candidateRecordLinked: false, status: "UNAVAILABLE", code: "SESSION_VERIFICATION_FAILED" },
      { status: 503, headers }
    );
  }
}
