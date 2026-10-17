import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocumentMetadata = {
  documentRef: string;
  documentType: string;
  displayName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentStatus: string;
  verificationStatus: string;
  extractionStatus: string;
  uploadedAt: string;
};

const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

/**
 * Returns metadata only for the candidate mapped to the server-verified Supabase
 * user. Storage paths, buckets, hashes and signed URLs are never sent to clients.
 * Upload/download/review operations remain separate, fail-closed capabilities.
 */
export async function GET() {
  if (!authConfigured()) {
    return NextResponse.json(
      { ok: false, status: "BLOCKED", code: "IDENTITY_PROVIDER_NOT_CONFIGURED",
        error: "Document status is unavailable until authentication is configured." },
      { status: 503, headers }
    );
  }

  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, status: "SIGNED_OUT", code: "CANDIDATE_AUTH_REQUIRED",
          error: "Sign in to view your document checklist." },
        { status: 401, headers }
      );
    }

    const apiBase = process.env.KINGSMEN_API_BASE_URL;
    const internalKey = process.env.KINGSMEN_WEB_INTERNAL_API_KEY;
    if (!apiBase || !internalKey) {
      return NextResponse.json(
        { ok: false, status: "BLOCKED", code: "DOCUMENT_SERVICE_NOT_CONFIGURED",
          error: "Secure document metadata is not available right now." },
        { status: 503, headers }
      );
    }

    let apiUrl: URL;
    try {
      apiUrl = new URL("/api/internal/candidate/documents", apiBase);
      if (apiUrl.protocol !== "https:" && apiUrl.hostname !== "localhost" && apiUrl.hostname !== "127.0.0.1") {
        throw new Error("INTERNAL_API_URL_MUST_USE_HTTPS");
      }
    } catch {
      return NextResponse.json(
        { ok: false, status: "BLOCKED", code: "DOCUMENT_SERVICE_URL_INVALID",
          error: "Secure document metadata is not available right now." },
        { status: 503, headers }
      );
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kingsmen-Internal-Key": internalKey },
      body: JSON.stringify({ supabaseUserId: user.id }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const payload = await response.json().catch(() => ({})) as {
      ok?: boolean; code?: string; documents?: unknown[];
    };

    if (response.status === 403 && payload.code === "CANDIDATE_PROFILE_LINK_REQUIRED") {
      return NextResponse.json(
        { ok: false, status: "BLOCKED", code: "CANDIDATE_PROFILE_LINK_REQUIRED",
          error: "Your account is not linked to an active candidate profile. Contact support to complete account linking." },
        { status: 403, headers }
      );
    }
    if (!response.ok || payload.ok !== true || !Array.isArray(payload.documents)) {
      return NextResponse.json(
        { ok: false, status: "BLOCKED", code: "DOCUMENT_SERVICE_UNAVAILABLE",
          error: "Secure document metadata is not available right now." },
        { status: 503, headers }
      );
    }

    const documents: DocumentMetadata[] = payload.documents.filter((item): item is DocumentMetadata => {
      if (!item || typeof item !== "object") return false;
      const doc = item as Partial<DocumentMetadata>;
      return typeof doc.documentRef === "string" &&
        typeof doc.documentType === "string" &&
        typeof doc.displayName === "string" &&
        typeof doc.mimeType === "string" &&
        typeof doc.fileSizeBytes === "number" && Number.isFinite(doc.fileSizeBytes) &&
        typeof doc.documentStatus === "string" &&
        typeof doc.verificationStatus === "string" &&
        typeof doc.extractionStatus === "string" &&
        typeof doc.uploadedAt === "string";
    }).slice(0, 200);

    return NextResponse.json({ ok: true, status: "READY", documents }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { ok: false, status: "BLOCKED", code: "DOCUMENT_ACCESS_CHECK_FAILED",
        error: "Secure document metadata could not be loaded. Please try again." },
      { status: 503, headers }
    );
  }
}
