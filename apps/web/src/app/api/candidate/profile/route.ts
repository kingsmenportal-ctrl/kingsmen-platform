import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Candidate profile reads/writes are blocked until an audited, unique
 * Supabase-user-to-candidate mapping exists. Never accept candidate IDs or
 * profile fields from the browser as proof of ownership.
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
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "CANDIDATE_PROFILE_LINK_REQUIRED" },
      { status: 503, headers }
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "PROFILE_ACCESS_CHECK_FAILED" },
      { status: 503, headers }
    );
  }
}

export async function PATCH() {
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
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "CANDIDATE_PROFILE_LINK_REQUIRED" },
      { status: 503, headers }
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "PROFILE_ACCESS_CHECK_FAILED" },
      { status: 503, headers }
    );
  }
}
