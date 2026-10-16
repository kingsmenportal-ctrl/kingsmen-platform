import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail closed: request-body IDs and proof strings do not establish founder
 * authority, candidate ownership, or a durable audit record.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      status: "BLOCKED",
      code: "FOUNDER_AUTHORIZATION_NOT_CONFIGURED",
      error: "Document review is unavailable until server-side founder authorization, candidate/document ownership checks, and durable audit evidence are configured."
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
