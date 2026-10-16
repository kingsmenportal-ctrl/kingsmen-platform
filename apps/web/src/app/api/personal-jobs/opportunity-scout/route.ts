import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fail-closed shutdown of the legacy opportunity scout API.
 *
 * The former route executed a local child process and read/wrote repository-
 * local shared JSON state. It must not run in a public web runtime until the
 * scout is moved behind the backend boundary and durable storage is scoped to
 * the authenticated owner. Public opportunity search can be restored as a
 * read-only backend API without enabling local file writes or shell execution.
 */
function unavailable() {
  return NextResponse.json(
    {
      status: "BLOCKED",
      code: "BACKEND_BOUNDARY_NOT_CONFIGURED",
      error: "Opportunity scouting is temporarily unavailable until the backend API boundary is configured."
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
