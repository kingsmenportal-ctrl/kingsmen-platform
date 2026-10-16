import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail-closed shutdown of the legacy shared-file follow-up inbox.
 *
 * The previous implementation invoked a local process and read/wrote a
 * repository-local JSON file without a verified authenticated candidate
 * ownership boundary. Re-enable only after durable owner-scoped storage,
 * authorization, audit evidence, and cross-candidate negative tests exist.
 */
function unavailable() {
  return NextResponse.json(
    {
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Follow-up inbox is unavailable until authenticated ownership and durable storage are implemented."
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
