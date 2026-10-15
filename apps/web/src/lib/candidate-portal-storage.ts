import "server-only";

import { cookies } from "next/headers";
import { candidateAccessCookie, getCandidateAuthUser, supabaseAuthConfig } from "@/lib/supabase-auth";

export type PortalContext = {
  userId: string;
  accessToken: string;
  url: string;
  anonKey: string;
};

export type PortalContextResult =
  | { status: "ready"; context: PortalContext }
  | { status: "not_configured" }
  | { status: "unauthenticated" };

export async function getCandidatePortalContext(): Promise<PortalContextResult> {
  const config = supabaseAuthConfig();
  if (!config) return { status: "not_configured" };

  const jar = await cookies();
  const accessToken = jar.get(candidateAccessCookie)?.value || "";
  const session = await getCandidateAuthUser();
  if (!session.user?.id || !accessToken) return { status: "unauthenticated" };

  return {
    status: "ready",
    context: {
      userId: session.user.id,
      accessToken,
      url: config.url,
      anonKey: config.anonKey
    }
  };
}

async function portalFetch(context: PortalContext, endpoint: string, init: RequestInit = {}) {
  const response = await fetch(new URL(endpoint, context.url), {
    ...init,
    headers: {
      apikey: context.anonKey,
      Authorization: `Bearer ${context.accessToken}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {})
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });
  return response;
}

export async function loadCandidatePortalState(context: PortalContext): Promise<Record<string, unknown> | null> {
  const query = new URLSearchParams({
    select: "state",
    auth_user_id: `eq.${context.userId}`,
    limit: "1"
  });
  const response = await portalFetch(context, `/rest/v1/candidate_portal_state?${query.toString()}`);
  if (!response.ok) throw new Error("Candidate storage could not be read.");
  const rows = await response.json() as Array<{ state?: Record<string, unknown> }>;
  return rows[0]?.state || null;
}

export async function saveCandidatePortalState(context: PortalContext, state: Record<string, unknown>): Promise<void> {
  const response = await portalFetch(context, "/rest/v1/candidate_portal_state?on_conflict=auth_user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ auth_user_id: context.userId, state })
  });
  if (!response.ok) throw new Error("Candidate storage could not be saved.");
}

export async function uploadCandidatePortalDocument(
  context: PortalContext,
  objectKey: string,
  mimeType: string,
  bytes: Buffer
): Promise<string> {
  if (!/^[a-zA-Z0-9._-]{1,180}$/.test(objectKey) || objectKey === "." || objectKey === "..") {
    throw new Error("Invalid document storage key.");
  }
  const extension = objectKey.toLowerCase().slice(objectKey.lastIndexOf("."));
  const allowedMime = extension === ".pdf" ? "application/pdf" : extension === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : extension === ".txt" ? "text/plain" : "";
  if (!allowedMime || (mimeType !== allowedMime && mimeType !== "application/octet-stream" && mimeType !== "text/txt")) {
    throw new Error("Document type does not match an allowed private-storage type.");
  }
  const storagePath = `${context.userId}/${objectKey}`;
  const response = await fetch(
    new URL(`/storage/v1/object/candidate-documents/${storagePath.split("/").map(encodeURIComponent).join("/")}`, context.url),
    {
      method: "POST",
      headers: {
        apikey: context.anonKey,
        Authorization: `Bearer ${context.accessToken}`,
        "Content-Type": allowedMime,
        "Cache-Control": "no-store",
        "x-upsert": "false"
      },
      body: new Uint8Array(bytes),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000)
    }
  );
  if (!response.ok) throw new Error("Private document storage rejected the upload.");
  return storagePath;
}
