import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail closed: a document ID supplied by a caller is not proof of ownership.
 * No signed URL may be issued until identity and record ownership are verified.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Document access is unavailable until authenticated ownership and private-storage signing are configured."
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
