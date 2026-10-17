import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail closed until route/gate decisions are derived from trusted candidate
 * identity and authoritative records rather than client-supplied identifiers.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      productionReady: false,
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Choice optimization is unavailable until authenticated candidate ownership and authoritative pathway records are connected.",
      safeToProceed: false,
      noGuaranteeLanguageRequired: true,
      candidateCanVerifySource: false,
      serviceRoleVisibleToBrowser: false
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
