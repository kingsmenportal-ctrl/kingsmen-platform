import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail closed until this route derives the candidate identity from a verified
 * server-side session and reads readiness from authoritative records.
 * Client-supplied candidate IDs are untrusted input, never authorization.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      productionReady: false,
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Readiness is unavailable until authenticated candidate ownership and authoritative readiness records are connected.",
      candidateCanVerifySource: false,
      candidateCanMarkPaid: false,
      candidateCanMarkSubmitted: false,
      candidateCanVerifyOutcome: false,
      serviceRoleVisibleToBrowser: false
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
