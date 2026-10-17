import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail closed: the previous route echoed caller-supplied candidate IDs and
 * returned a placeholder string as if it were an upload URL. No signer,
 * authenticated identity, or ownership check is wired here.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Document upload is unavailable until server-side candidate identity, owner-scoped metadata, and a real private-storage signer are configured."
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
