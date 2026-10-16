import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** No candidate status may be returned before identity-scoped lookup exists. */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Document status is unavailable until authenticated candidate ownership is configured."
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
