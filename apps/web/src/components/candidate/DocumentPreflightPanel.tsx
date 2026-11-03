"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png"
};
const DOCUMENT_TYPES = [
  ["ID_DOCUMENT", "Identity document"],
  ["CV", "CV / résumé"],
  ["MATRIC_CERTIFICATE", "Matric certificate"],
  ["ACADEMIC_RECORD", "Academic record / qualification"],
  ["PROOF_OF_ADDRESS", "Proof of address"],
  ["BANK_LETTER", "Bank letter"],
  ["PARENT_GUARDIAN_ID", "Parent / guardian ID"],
  ["PAYSLIP", "Payslip"],
  ["AFFIDAVIT", "Affidavit"],
  ["APPLICATION_PROOF", "Application proof"],
  ["NSFAS_DOCUMENT", "NSFAS document"],
  ["OTHER", "Other supporting document"]
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number][0];
type Preflight = { name: string; size: number; mime: string; sha256: string };
type ServerDocument = {
  id: string;
  documentType?: string;
  document_type?: string;
  filename?: string;
  original_filename?: string;
  sizeBytes?: number;
  size_bytes?: number;
  status: string;
  sha256_hex?: string | null;
  uploadedAt?: string | null;
  uploaded_at?: string | null;
  latestReview?: { decision?: string } | null;
};
type ApiResponse = {
  ok?: boolean;
  status?: string;
  detail?: string;
  error?: string;
  message?: string;
  document?: { id?: string; status?: string; sha256_hex?: string | null };
  documentId?: string;
  document_id?: string;
  signedUploadUrl?: string;
  signedUploadToken?: string;
  uploadPath?: string;
  documents?: ServerDocument[];
  signedReadUrl?: string;
  expiresInSeconds?: number;
  sha256Hex?: string;
};
type SessionConfig = { url: string; anonKey: string; token: string };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}
function statusText(status: string) {
  switch (status) {
    case "UPLOAD_PENDING": return "Upload pending finalisation";
    case "UPLOADED_CANDIDATE_REPORTED": return "Uploaded · awaiting authorised review";
    case "UNDER_REVIEW": return "Under review";
    case "VERIFIED": return "Verified by an authorised reviewer";
    case "REJECTED": return "Review requires correction";
    case "UPLOAD_FAILED": return "Upload failed";
    default: return status.replaceAll("_", " ").toLowerCase();
  }
}
function readSession(): SessionConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Private document access is not configured for this deployment.");
  let projectRef = "euhubhhnumtibbyufghm";
  try { projectRef = new URL(url).hostname.split(".")[0] || projectRef; } catch {}
  const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
  if (!raw) throw new Error("Sign in before accessing your private Document Vault.");
  let session: { access_token?: string; expires_at?: number };
  try { session = JSON.parse(raw) as { access_token?: string; expires_at?: number }; }
  catch { throw new Error("Your browser session could not be read. Sign in again."); }
  if (!session.access_token) throw new Error("Sign in before accessing your private Document Vault.");
  if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }
  return { url, anonKey, token: session.access_token };
}
function serverError(status: number, body: ApiResponse) {
  const code = body.status || body.error || body.detail || body.message || `Request failed (HTTP ${status}).`;
  if (status === 401 || code === "AUTHENTICATION_REQUIRED") return "Sign in to access your private documents.";
  if (status === 403 || code === "IDENTITY_REVIEW_REQUIRED") return "An authorised Kingsmen reviewer must verify your candidate identity before private document upload or download can be enabled.";
  if (code === "DOCUMENT_STORAGE_NOT_CONFIGURED" || code === "NOT_CONFIGURED") return "Private document storage is not correctly configured. No document was marked as received.";
  if (code === "UPLOAD_NOT_AVAILABLE") return "Private storage did not return the uploaded object. The document has not been finalised as received.";
  return `${code}. The server did not confirm this document operation.`;
}
async function documentApi(session: SessionConfig, action?: Record<string, unknown>, method: "GET" | "POST" = "POST"): Promise<ApiResponse> {
  const response = await fetch(`${session.url}/functions/v1/candidate-private-documents`, {
    method,
    headers: {
      apikey: session.anonKey,
      Authorization: `Bearer ${session.token}`,
      ...(action ? { "Content-Type": "application/json" } : {})
    },
    ...(action ? { body: JSON.stringify(action) } : {}),
    cache: "no-store"
  });
  let body: ApiResponse = {};
  try { body = await response.json() as ApiResponse; } catch {}
  if (!response.ok || body.ok === false) throw new Error(serverError(response.status, body));
  return body;
}

export function DocumentPreflightPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("OTHER");
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [listError, setListError] = useState("");
  const [documents, setDocuments] = useState<ServerDocument[]>([]);
  const [inputVersion, setInputVersion] = useState(0);
  const [download, setDownload] = useState<{ id: string; url: string; expiresAt: number } | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    setListError("");
    try {
      const session = readSession();
      const result = await documentApi(session, undefined, "GET");
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch (caught) {
      setDocuments([]);
      setListError(caught instanceof Error ? caught.message : "Could not load private document status.");
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  async function onChooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setSelectedFile(file);
    setError("");
    setNotice("");
    setPreflight(null);
    setDownload(null);
    if (!file) return;

    if (file.size < 1 || file.size > MAX_BYTES) {
      setSelectedFile(null);
      setError(file.size < 1 ? "This file is empty." : "This file exceeds the 10 MiB per-file limit.");
      event.currentTarget.value = "";
      return;
    }

    const extension = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase()}` : "";
    const expectedMime = MIME_BY_EXTENSION[extension];
    if (!expectedMime || (file.type && file.type.toLowerCase() !== expectedMime)) {
      setSelectedFile(null);
      setError("Choose a PDF, JPEG or PNG whose extension matches its browser-reported file type. The server independently checks content bytes.");
      event.currentTarget.value = "";
      return;
    }

    setPreparing(true);
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      setPreflight({ name: file.name, size: file.size, mime: expectedMime, sha256 });
    } catch {
      setSelectedFile(null);
      setError("The file was not uploaded. This browser could not compute a local SHA-256 preflight digest.");
      event.currentTarget.value = "";
    } finally {
      setPreparing(false);
    }
  }

  async function uploadDocument() {
    setError("");
    setNotice("");
    setDownload(null);
    if (!selectedFile || !preflight) {
      setError("Select a valid file and complete the local preflight first.");
      return;
    }

    setUploading(true);
    let documentId = "";
    try {
      const session = readSession();
      setNotice("Requesting a short-lived, candidate-scoped private upload capability…");
      const uploadRequest = await documentApi(session, {
        action: "create_upload",
        documentTypeCode: documentType,
        filename: selectedFile.name,
        mimeType: preflight.mime,
        sizeBytes: selectedFile.size,
        evidencePurpose: "CANDIDATE_DOCUMENT"
      });
      documentId = uploadRequest.document?.id || uploadRequest.documentId || uploadRequest.document_id || "";
      const signedUrl = uploadRequest.signedUploadUrl;
      const signedToken = uploadRequest.signedUploadToken;
      if (!documentId || !signedUrl || !signedToken) {
        throw new Error("The private-document service did not return a complete signed-upload capability. No upload was attempted.");
      }

      setNotice("Uploading to private storage. The signed upload capability is temporary and is not saved in the browser.");
      const target = new URL(signedUrl);
      target.searchParams.set("token", signedToken);
      const storageResponse = await fetch(target.toString(), {
        method: "PUT",
        headers: { apikey: session.anonKey, "Content-Type": preflight.mime, "x-upsert": "false" },
        body: selectedFile,
        cache: "no-store"
      });
      if (!storageResponse.ok) {
        throw new Error(`Private storage rejected the file (HTTP ${storageResponse.status}). It has not been marked as received. Document reference: ${documentId}`);
      }

      setNotice("Private storage received the file bytes. The server is checking content signature, size, SHA-256 and the document record…");
      const finalised = await documentApi(session, { action: "finalize_upload", documentId });
      if (finalised.status === "UPLOAD_FAILED" || finalised.document?.status === "UPLOAD_FAILED") {
        throw new Error(`The server rejected this file after integrity checks. Document reference: ${documentId}`);
      }
      const serverDigest = finalised.document?.sha256_hex || finalised.sha256Hex;
      const finalStatus = finalised.document?.status || finalised.status || "UPLOADED_CANDIDATE_REPORTED";
      setNotice(serverDigest && serverDigest.toLowerCase() !== preflight.sha256.toLowerCase()
        ? `The server recorded status ${statusText(finalStatus)}, but the local and server SHA-256 differ. Use the server digest and document reference ${documentId} for authorised review.`
        : `Upload finalised in private storage. Current status: ${statusText(finalStatus)}. The server-recorded digest is authoritative; this is not a verification decision.`);
      setSelectedFile(null);
      setPreflight(null);
      setInputVersion((value) => value + 1);
      await loadDocuments();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The private document operation could not be completed.");
      if (documentId) setNotice(`Document reference: ${documentId}. If storage received the file, do not retry blindly; refresh the list or ask an authorised reviewer to inspect the record.`);
    } finally {
      setUploading(false);
    }
  }

  async function requestDownload(documentId: string) {
    setError("");
    setNotice("");
    setDownload(null);
    try {
      const session = readSession();
      const result = await documentApi(session, { action: "create_download_url", documentId });
      if (!result.signedReadUrl) throw new Error("No temporary download link was returned.");
      const ttl = typeof result.expiresInSeconds === "number" && result.expiresInSeconds > 0 ? result.expiresInSeconds : 60;
      setDownload({ id: documentId, url: result.signedReadUrl, expiresAt: Date.now() + ttl * 1000 });
      setNotice(`A short-lived private download link was created. It expires in approximately ${ttl} seconds; do not share it.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create a private document download link.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="document-preflight-title">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Secure document workflow</p>
      <h2 id="document-preflight-title" className="mt-2 text-xl font-bold text-slate-950">Preflight, upload and track your documents.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">PDF, JPEG or PNG, up to 10 MiB per file. The browser computes an advisory SHA-256 digest; the private-document service independently validates file signatures and records the authoritative digest. Upload requires a live Supabase session and a reviewer-verified candidate identity.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-800">Document type
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
            {DOCUMENT_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <strong className="block text-slate-900">Security gate</strong>
          Private upload signing is restricted to the signed-in candidate and a reviewer-verified identity link. Candidates cannot mark their own documents as verified or rejected.
        </div>
      </div>

      <label className="mt-4 block rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-amber-400 hover:bg-amber-50">
        <span className="block text-sm font-bold text-slate-900">Select a document</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">PDF, JPG, JPEG or PNG · maximum 10 MiB</span>
        <input key={inputVersion} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onChooseFile} className="mt-4 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </label>

      {preparing ? <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-600">Checking file and computing SHA-256 locally…</p> : null}
      {preflight ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-slate-950">Local preflight passed</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">File</dt><dd className="mt-1 break-words font-medium text-slate-900">{preflight.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size / type</dt><dd className="mt-1 font-medium text-slate-900">{formatBytes(preflight.size)} · {preflight.mime}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Browser SHA-256 (preflight only)</dt><dd className="mt-1 break-all font-mono text-xs text-slate-800">{preflight.sha256}</dd></div>
          </dl>
          <button type="button" onClick={uploadDocument} disabled={uploading || preparing} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
            {uploading ? "Uploading and finalising…" : "Upload securely and finalise"} <span aria-hidden="true" className="ml-2">→</span>
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-600">The selected file is sent only after you press the button. Server-side finalisation is required before a document is listed as received.</p>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{error}</p> : null}
      {notice ? <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">{notice}</p> : null}

      <section className="mt-7 border-t border-slate-200 pt-5" aria-labelledby="server-documents-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 id="server-documents-title" className="font-bold text-slate-950">Documents recorded by the private service</h3><p className="mt-1 text-xs leading-5 text-slate-500">Candidate-reported upload remains distinct from authorised verification.</p></div>
          <button type="button" onClick={() => void loadDocuments()} disabled={loadingDocuments || uploading} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50">{loadingDocuments ? "Refreshing…" : "Refresh list"}</button>
        </div>
        {listError ? <div role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-800">{listError} <a href="/candidate/login/" className="font-bold underline">Sign in</a> or ask an authorised reviewer about identity verification if access remains blocked.</div> : null}
        {!loadingDocuments && !listError && documents.length === 0 ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">No private-document records are available for this verified candidate identity.</p> : null}
        <div className="mt-3 space-y-3">
          {documents.map((doc) => (
            <article key={doc.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><h4 className="break-words font-semibold text-slate-950">{doc.filename || doc.original_filename || "Private document"}</h4><p className="mt-1 text-xs leading-5 text-slate-600">{doc.documentType || doc.document_type || "Document"} · {formatBytes(doc.sizeBytes || doc.size_bytes || 0)} · {formatDate(doc.uploadedAt || doc.uploaded_at)}</p></div>
                <span className="self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{statusText(doc.status)}</span>
              </div>
              {doc.sha256_hex ? <p className="mt-3 break-all font-mono text-[11px] leading-5 text-slate-500">Server SHA-256: {doc.sha256_hex}</p> : null}
              {doc.latestReview ? <p className="mt-2 text-xs leading-5 text-slate-600">Latest review: {String(doc.latestReview.decision ?? "pending")}.</p> : null}
              {["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(doc.status) ? <button type="button" onClick={() => void requestDownload(doc.id)} className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500">Request temporary private download</button> : null}
              {download?.id === doc.id ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><p className="text-slate-700">This link expires at {new Date(download.expiresAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}. Do not share it.</p><a href={download.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-bold underline">Open private file</a></div> : null}
            </article>
          ))}
        </div>
      </section>

      <p className="mt-5 text-xs leading-5 text-slate-500">Payment checkout and provider submission are not connected to this document screen. No public file URL is created, and a candidate cannot approve their own documents.</p>
    </section>
  );
}
