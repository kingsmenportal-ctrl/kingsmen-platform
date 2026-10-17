import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail closed until parent-application ownership is verified from a trusted
 * session and authoritative application records. Never echo client identity.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      productionReady: false,
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "The CAO parent/child optimizer is unavailable until authenticated ownership and authoritative application records are connected.",
      countsAsOneKingsmenApplication: true,
      childChoiceCountsAsSeparateKingsmenApplication: false,
      noGuaranteeLanguageRequired: true,
      serviceRoleVisibleToBrowser: false
    },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
