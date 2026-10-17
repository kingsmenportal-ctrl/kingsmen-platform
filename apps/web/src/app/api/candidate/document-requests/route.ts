import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type CandidateDocumentRequest = {
  requestRef: string;
  documentType: string;
  reason: string;
  priority: string;
  dueAt: string | null;
  createdAt: string;
};

const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

/** Returns only open requests for the candidate bound to the verified server-side Auth identity. */
export async function GET() {
  if (!authConfigured()) {
    return NextResponse.json({ ok: false, status: "BLOCKED", code: "IDENTITY_PROVIDER_NOT_CONFIGURED", error: "Document requests are unavailable until authentication is configured." }, { status: 503, headers });
  }
  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, status: "SIGNED_OUT", code: "CANDIDATE_AUTH_REQUIRED", error: "Sign in to view requested documents." }, { status: 401, headers });
    }
    const apiBase = process.env.KINGSMEN_API_BASE_URL;
    const internalKey = process.env.KINGSMEN_WEB_INTERNAL_API_KEY;
    if (!apiBase || !internalKey) {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: "DOCUMENT_REQUEST_SERVICE_NOT_CONFIGURED", error: "Document requests are not available right now." }, { status: 503, headers });
    }
    let apiUrl: URL;
    try {
      apiUrl = new URL("/api/internal/candidate/document-requests", apiBase);
      if (apiUrl.protocol !== "https:" && apiUrl.hostname !== "localhost" && apiUrl.hostname !== "127.0.0.1") throw new Error("INTERNAL_API_URL_MUST_USE_HTTPS");
    } catch {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: "DOCUMENT_REQUEST_SERVICE_URL_INVALID", error: "Document requests are not available right now." }, { status: 503, headers });
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kingsmen-Internal-Key": internalKey },
      body: JSON.stringify({ supabaseUserId: user.id }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const payload = await response.json().catch(() => ({})) as { ok?: boolean; code?: string; requests?: unknown[] };
    if (response.status === 403 && payload.code === "CANDIDATE_PROFILE_LINK_REQUIRED") {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: payload.code, error: "Your account is not linked to an active candidate profile. Contact support to complete account linking." }, { status: 403, headers });
    }
    if (!response.ok || payload.ok !== true || !Array.isArray(payload.requests)) {
      return NextResponse.json({ ok: false, status: "BLOCKED", code: "DOCUMENT_REQUEST_SERVICE_UNAVAILABLE", error: "Document requests are not available right now." }, { status: 503, headers });
    }
    const requests: CandidateDocumentRequest[] = payload.requests.filter((item): item is CandidateDocumentRequest => {
      if (!item || typeof item !== "object") return false;
      const row = item as Partial<CandidateDocumentRequest>;
      return typeof row.requestRef === "string" && typeof row.documentType === "string" &&
        typeof row.reason === "string" && typeof row.priority === "string" &&
        (row.dueAt === null || typeof row.dueAt === "string") && typeof row.createdAt === "string";
    }).slice(0, 100);
    return NextResponse.json({ ok: true, status: "READY", requests }, { status: 200, headers });
  } catch {
    return NextResponse.json({ ok: false, status: "BLOCKED", code: "DOCUMENT_REQUEST_ACCESS_CHECK_FAILED", error: "Document requests could not be loaded. Please try again." }, { status: 503, headers });
  }
}
