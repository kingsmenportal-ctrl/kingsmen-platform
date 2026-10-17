import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail-closed shutdown of the legacy Smart Apply API.
 *
 * The prior implementation stored candidate profile fields (including
 * potentially sensitive identity data), documents, and application records in
 * a shared repository-local JSON file. Re-enable only after authenticated
 * candidate ownership, private durable storage, access controls, audit events,
 * and cross-candidate negative tests are implemented.
 */
function unavailable() {
  return NextResponse.json(
    {
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Smart Apply is temporarily unavailable until private candidate-owned storage and authorization are implemented."
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache"
      }
    }
  );
}

export async function GET() {
  return unavailable();
}

export async function POST() {
  return unavailable();
}
