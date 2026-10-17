import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail-closed shutdown of the legacy PJ24 tracker API.
 *
 * The former implementation read and wrote a repository-local shared JSON
 * file and had no authenticated candidate ownership boundary. Do not restore
 * that implementation or enable writes until server-side identity, per-record
 * ownership, durable storage, audit logging, and A/B negative tests are in
 * place. This route intentionally performs no filesystem access or sync work.
 */
function unavailable() {
  return NextResponse.json(
    {
      status: "BLOCKED",
      code: "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED",
      error: "Application tracker access is temporarily unavailable until authenticated candidate ownership is implemented."
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
