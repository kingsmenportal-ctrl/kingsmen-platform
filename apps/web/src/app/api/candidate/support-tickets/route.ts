import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type CandidateSupportTicket = {
  ticketRef: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

/** Reads ticket status metadata only, bound to the server-verified Supabase Auth identity. */
export async function GET() {
  if (!authConfigured()) {
    return NextResponse.json({ ok: false, status: "BLOCKED", code: "IDENTITY_PROVIDER_NOT_CONFIGURED", error: "Support ticket status is unavailable until authentication is configured." }, { status: 503, headers });
  }
  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, status: "SIGNED_OUT", code: "CANDIDATE_AUTH_REQUIRED", error: "Sign in to view your support tickets." }, { status: 401, headers });
    }
    const apiBase = process.env.KINGSMEN_API_BASE_URL;
    const internalKey = process.env.KINGSMEN_WEB_INTERNAL_API_KEY;
    if (!apiBase || !internalKey) {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: "SUPPORT_TICKET_SERVICE_NOT_CONFIGURED", error: "Support ticket status is not available right now." }, { status: 503, headers });
    }
    let apiUrl: URL;
    try {
      apiUrl = new URL("/api/internal/candidate/support-tickets", apiBase);
      if (apiUrl.protocol !== "https:" && apiUrl.hostname !== "localhost" && apiUrl.hostname !== "127.0.0.1") throw new Error("INTERNAL_API_URL_MUST_USE_HTTPS");
    } catch {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: "SUPPORT_TICKET_SERVICE_URL_INVALID", error: "Support ticket status is not available right now." }, { status: 503, headers });
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kingsmen-Internal-Key": internalKey },
      body: JSON.stringify({ supabaseUserId: user.id }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const payload = await response.json().catch(() => ({})) as { ok?: boolean; code?: string; tickets?: unknown[] };
    if (response.status === 403 && payload.code === "CANDIDATE_PROFILE_LINK_REQUIRED") {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: payload.code, error: "Your account is not linked to an active candidate profile. Contact support to complete account linking." }, { status: 403, headers });
    }
    if (!response.ok || payload.ok !== true || !Array.isArray(payload.tickets)) {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: "SUPPORT_TICKET_SERVICE_UNAVAILABLE", error: "Support tickets could not be loaded right now." }, { status: 503, headers });
    }
    const tickets: CandidateSupportTicket[] = payload.tickets.filter((item): item is CandidateSupportTicket => {
      if (!item || typeof item !== "object") return false;
      const row = item as Partial<CandidateSupportTicket>;
      return typeof row.ticketRef === "string" && typeof row.category === "string" &&
        typeof row.priority === "string" && typeof row.status === "string" &&
        typeof row.title === "string" && typeof row.createdAt === "string" &&
        typeof row.updatedAt === "string" && (row.closedAt === null || typeof row.closedAt === "string");
    }).slice(0, 100);
    return NextResponse.json({ ok: true, status: "READY", tickets }, { status: 200, headers });
  } catch {
    return NextResponse.json({ ok: false, status: "BLOCKED", code: "SUPPORT_TICKET_ACCESS_CHECK_FAILED", error: "Support tickets could not be loaded. Please try again." }, { status: 503, headers });
  }
}
