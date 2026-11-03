"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET_FUNCTION = "candidate-private-documents";
const MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg, .jpeg",
  "image/png": ".png"
};
const DOCUMENT_TYPES = [
  ["CV", "CV / résumé"],
  ["ID_DOCUMENT", "Identity document"],
  ["MATRIC_CERTIFICATE", "Matric certificate"],
  ["ACADEMIC_RECORD", "Academic record / qualification"],
  ["PROOF_OF_ADDRESS", "Proof of address"],
  ["BANK_LETTER", "Bank letter"],
  ["PARENT_GUARDIAN_ID", "Parent / guardian identity document"],
  ["PAYSLIP", "Payslip"],
  ["AFFIDAVIT", "Affidavit"],
  ["APPLICATION_PROOF", "Application proof"],
  ["NSFAS_DOCUMENT", "NSFAS document"],
  ["OTHER", "Other supporting document"]
] as const;

type AuthContext = { url: string; anonKey: string; token: string };
type VaultDocument = {
  id: string;
  documentType?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  status: string;
  sha256_hex?: string | null;
  uploadedAt?: string | null;
  createdAt?: string;
  latestReview?: { decision?: string; reviewer_note?: string; created_at?: string } | null;
};

function authContext(): AuthContext | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const projectRef = new URL(url).hostname.split(".")[0];
    const storageKey = projectRef ? "sb-" + projectRef + "-auth-token" : "sb-euhubhhnumtibbyufghm-auth-token";
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (typeof session.access_token !== "string") return null;
    if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) return null;
    return { url, anonKey, token: session.access_token };
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    UPLOAD_PENDING: "Awaiting upload",
    UPLOADED_CANDIDATE_REPORTED: "Uploaded · awaiting review",
    UNDER_REVIEW: "Under human review",
    VERIFIED: "Verified by reviewer",
    CORRECTION_REQUIRED: "Correction requested",
    REJECTED: "Rejected by reviewer"
  };
  return labels[status] || status.replaceAll("_", " ").toLowerCase();
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function DocumentPreflightPanel() {
  const [auth, setAuth] = useState<AuthContext | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [documentType, setDocumentType] = useState("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const apiUrl = useCallback((context: AuthContext) => context.url + "/functions/v1/" + BUCKET_FUNCTION, []);

  const loadDocuments = useCallback(async (context: AuthContext) => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl(context), {
        method: "GET",
        headers: {
          apikey: context.anonKey,
          Authorization: "Bearer " + context.token
        },
        cache: "no-store"
      });
      const body = await responseJson(response);
      if (!response.ok || body.ok !== true || !Array.isArray(body.documents)) {
        throw new Error(String(body.detail || body.status || body.error || "The private document list is not available for this account."));
      }
      setDocuments(body.documents as VaultDocument[]);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The private document list could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const current = authContext();
    setAuth(current);
    if (current) void loadDocuments(current);
  }, [loadDocuments]);

  function onChooseFile(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setNotice("");
    const selected = event.currentTarget.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size <= 0) {
      setFile(null);
      setError("This file is empty. Choose a non-empty PDF, JPEG or PNG file.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setError("This file exceeds the 10 MiB per-file limit.");
      return;
    }
    const extension = selected.name.includes(".") ? "." + selected.name.split(".").pop()!.toLowerCase() : "";
    const allowedExtension = [".pdf", ".jpg", ".jpeg", ".png"].includes(extension);
    const allowedMime = Object.prototype.hasOwnProperty.call(MIME_TYPES, selected.type);
    if (!allowedExtension || (selected.type && !allowedMime)) {
      setFile(null);
      setError("Only PDF, JPEG and PNG files are supported. The server will validate the file signature again.");
      return;
    }
    setFile(selected);
  }

  async function uploadDocument() {
    const context = auth ?? authContext();
    if (!context) {
      setError("Sign in to your Kingsmen account before uploading a document.");
      return;
    }
    if (!file) {
      setError("Select a PDF, JPEG or PNG file first.");
      return;
    }
    const extension = file.name.includes(".") ? "." + file.name.split(".").pop()!.toLowerCase() : "";
    const mimeType = file.type || (extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : "image/jpeg");
    if (!Object.prototype.hasOwnProperty.call(MIME_TYPES, mimeType)) {
      setError("The selected file type is not supported.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const localSha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

      const uploadRequest = await fetch(apiUrl(context), {
        method: "POST",
        headers: {
          apikey: context.anonKey,
          Authorization: "Bearer " + context.token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "upload-url",
          documentTypeCode: documentType,
          filename: file.name,
          mimeType,
          sizeBytes: file.size,
          evidencePurpose: "CANDIDATE_DOCUMENT"
        }),
        cache: "no-store"
      });
      const uploadBody = await responseJson(uploadRequest);
      const document = uploadBody.document as { id?: string } | undefined;
      const signedUploadUrl = typeof uploadBody.signedUploadUrl === "string" ? uploadBody.signedUploadUrl : "";
      if (!uploadRequest.ok || uploadBody.ok !== true || !document?.id || !signedUploadUrl) {
        throw new Error(String(uploadBody.detail || uploadBody.status || uploadBody.error || "The secure upload request could not be created."));
      }

      // Match Supabase Storage's signed-upload protocol: PUT the multipart body to the
      // one-time signed URL. The URL itself carries the short-lived upload capability.
      const multipart = new FormData();
      multipart.append("cacheControl", "3600");
      multipart.append("", file, file.name);
      const storageResponse = await fetch(signedUploadUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: multipart,
        cache: "no-store"
      });
      if (!storageResponse.ok) {
        const storageBody = await responseJson(storageResponse);
        throw new Error(String(storageBody.message || storageBody.error || "The private file upload failed. The pending document record has not been marked as uploaded."));
      }

      const finalizeResponse = await fetch(apiUrl(context), {
        method: "POST",
        headers: {
          apikey: context.anonKey,
          Authorization: "Bearer " + context.token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "finalize-upload", documentId: document.id }),
        cache: "no-store"
      });
      const finalizeBody = await responseJson(finalizeResponse);
      const finalized = finalizeBody.document as { status?: string; sha256_hex?: string } | undefined;
      if (!finalizeResponse.ok || finalizeBody.ok !== true || !finalized) {
        throw new Error(String(finalizeBody.detail || finalizeBody.status || finalizeBody.error || "The file reached storage but server-side finalisation could not be confirmed. Contact support before retrying."));
      }

      const serverHash = finalized.sha256_hex || "";
      setNotice(
        "Upload recorded as " + statusLabel(finalized.status || "UPLOADED_CANDIDATE_REPORTED") +
        ". Server-side file checks completed. The file is not marked verified; an authorised human reviewer must make that decision." +
        (serverHash && serverHash !== localSha256 ? " The server checksum differs from the local preflight checksum; contact support." : "")
      );
      setFile(null);
      const input = document.getElementById("kingsmen-private-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadDocuments(context);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The private document upload could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(documentId: string) {
    const context = auth ?? authContext();
    if (!context) {
      setError("Sign in again before opening a private document.");
      return;
    }
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setError("Allow pop-ups for Kingsmen to open a private, expiring document link.");
      return;
    }
    popup.opener = null;
    setOpeningId(documentId);
    setError("");
    try {
      const response = await fetch(apiUrl(context), {
        method: "POST",
        headers: {
          apikey: context.anonKey,
          Authorization: "Bearer " + context.token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "read-url", documentId }),
        cache: "no-store"
      });
      const body = await responseJson(response);
      const signedReadUrl = typeof body.signedReadUrl === "string" ? body.signedReadUrl : "";
      if (!response.ok || body.ok !== true || !signedReadUrl) {
        popup.close();
        throw new Error(String(body.detail || body.status || body.error || "A private document link could not be issued."));
      }
      popup.location.href = signedReadUrl;
    } catch (caught) {
      popup.close();
      setError(caught instanceof Error ? caught.message : "The private document could not be opened.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="document-preflight-title">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Private document vault</p>
      <h2 id="document-preflight-title" className="mt-2 text-xl font-bold text-slate-950">Upload a document securely.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">PDF, JPEG or PNG up to 10 MiB. Kingsmen creates a candidate-owned private record, uploads to private storage, then validates the file signature, type, size and SHA-256 on the server. Upload is not reviewer verification.</p>

      {!auth ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Sign in to access your private document vault. An authorised reviewer must verify your candidate identity before secure upload and download are available.
          <a href="/candidate/login/" className="ml-1 font-bold underline">Sign in</a>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Document type
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2">
            {DOCUMENT_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">
          Select file
          <input id="kingsmen-private-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onChooseFile} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:font-bold file:text-white" />
        </label>
      </div>

      {file ? <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800"><strong>{file.name}</strong><span className="ml-2 text-slate-500">{formatBytes(file.size)}</span></div> : null}
      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{error}</p> : null}
      {notice ? <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{notice}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => void uploadDocument()} disabled={!file || busy || !auth} className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Uploading and validating…" : "Upload to private vault"}
        </button>
        <button type="button" onClick={() => auth && void loadDocuments(auth)} disabled={!auth || loading || busy} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh vault"}
        </button>
      </div>

      <div className="mt-7 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-950">Your private documents</h3>
          <span className="text-xs text-slate-500">{documents.length} record(s)</span>
        </div>
        {documents.length === 0 ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{loading ? "Loading your private document records…" : "No private document records were returned for this verified candidate identity."}</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {documents.map((doc) => (
              <article key={doc.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words text-sm font-bold text-slate-950">{doc.filename || "Candidate document"}</h4>
                    <p className="mt-1 text-xs text-slate-500">{doc.documentType || "OTHER"} · {formatBytes(Number(doc.sizeBytes || 0))}</p>
                  </div>
                  <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabel(doc.status)}</span>
                </div>
                {doc.sha256_hex ? <p className="mt-2 break-all font-mono text-[10px] text-slate-500">SHA-256: {doc.sha256_hex}</p> : null}
                {doc.latestReview?.reviewer_note ? <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">Reviewer note: {doc.latestReview.reviewer_note}</p> : null}
                {["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(doc.status) ? (
                  <button type="button" onClick={() => void openDocument(doc.id)} disabled={openingId === doc.id} className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 disabled:opacity-50">
                    {openingId === doc.id ? "Creating private link…" : "Open private document"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-slate-500">Private links expire after 60 seconds and are issued only through an authenticated, audited endpoint. Candidates cannot approve, reject or delete document records from this screen.</p>
      </div>
    </section>
  );
}
