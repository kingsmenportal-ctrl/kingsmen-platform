import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCandidatePortalContext as getPortalContext, loadCandidatePortalState } from "@/lib/candidate-portal-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" }
  });
}

function safeFileName(value: unknown) {
  const cleaned = String(value || "document").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 150);
  return cleaned && cleaned !== "." && cleaned !== ".." ? cleaned : "document";
}

export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  if (!/^doc-[0-9]{10,}-[a-f0-9]+$/i.test(documentId)) return errorResponse("Document not found.", 404);

  const resolved = await getPortalContext();
  if (resolved.status !== "ready") {
    return errorResponse(resolved.status === "unauthenticated" ? "Sign in to access this document." : "Private document storage is not configured.", resolved.status === "unauthenticated" ? 401 : 503);
  }

  try {
    const store = await loadCandidatePortalState(resolved.context);
    const documents = Array.isArray(store?.documents) ? store.documents as Array<Record<string, unknown>> : [];
    const document = documents.find((item) => item.documentId === documentId);
    if (!document) return errorResponse("Document not found.", 404);

    const fileName = safeFileName(document.fileName);
    const mimeType = String(document.mimeType || "");
    const allowedMime = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/octet-stream",
      "text/txt"
    ]);
    if (!allowedMime.has(mimeType)) return errorResponse("Document metadata is invalid.", 500);

    let bytes: ArrayBuffer | Uint8Array;
    if (typeof document.storagePath === "string") {
      const prefix = `${resolved.context.userId}/`;
      const storagePath = document.storagePath;
      const objectName = storagePath.startsWith(prefix) ? storagePath.slice(prefix.length) : "";
      if (!objectName || objectName.includes("/") || !/^[a-zA-Z0-9._-]{1,180}$/.test(objectName)) {
        return errorResponse("Document storage reference is invalid.", 404);
      }
      const endpoint = new URL(
        `/storage/v1/object/authenticated/candidate-documents/${[resolved.context.userId, objectName].map(encodeURIComponent).join("/")}`,
        resolved.context.url
      );
      const response = await fetch(endpoint, {
        headers: {
          apikey: resolved.context.anonKey,
          Authorization: `Bearer ${resolved.context.accessToken}`
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) return errorResponse("Private document could not be retrieved.", response.status === 404 ? 404 : 503);
      bytes = await response.arrayBuffer();
    } else {
      if (process.env.NODE_ENV === "production") return errorResponse("Private document storage reference is missing.", 503);
      const root = process.cwd().replace(/\\/g, "/").endsWith("/apps/web") ? path.resolve(process.cwd(), "../..") : process.cwd();
      const storedName = safeFileName(document.storedName);
      const filePath = path.resolve(root, "data", "personal-job-desk", "uploads", storedName);
      const uploadRoot = path.resolve(root, "data", "personal-job-desk", "uploads") + path.sep;
      if (!filePath.startsWith(uploadRoot)) return errorResponse("Document not found.", 404);
      bytes = await fs.readFile(filePath);
    }

    return new NextResponse(bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType === "text/txt" || mimeType === "application/octet-stream" ? "application/octet-stream" : mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return errorResponse("Private document could not be retrieved.", 503);
  }
}
