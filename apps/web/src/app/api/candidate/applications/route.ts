import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Application records require a trusted Supabase-user-to-candidate mapping
 * and candidate-scoped query. Never infer ownership from email or localStorage.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

  if (!authConfigured()) {
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "IDENTITY_PROVIDER_NOT_CONFIGURED" },
      { status: 503, headers }
    );
  }

  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, status: "SIGNED_OUT", code: "CANDIDATE_AUTH_REQUIRED" },
        { status: 401, headers }
      );
    }

    // Authentication alone is not candidate authorization. Do not return an
    // empty list because that could falsely imply the candidate has no records.
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "CANDIDATE_PROFILE_LINK_REQUIRED" },
      { status: 503, headers }
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "APPLICATION_ACCESS_CHECK_FAILED" },
      { status: 503, headers }
    );
  }
}
