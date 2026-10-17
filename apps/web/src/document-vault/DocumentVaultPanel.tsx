"use client";

import React, { useState } from "react";

export type DocumentVaultItemStatus = "UPLOADED" | "PROCESSING" | "READY" | "REJECTED" | "ARCHIVED" | "DELETED";
export type DocumentVaultVerificationStatus = "PENDING" | "VERIFIED" | "REVIEW_REQUIRED" | "REJECTED" | "EXPIRED";

export interface DocumentVaultItem {
  documentRef: string;
  documentType: string;
  displayName: string;
  documentStatus: DocumentVaultItemStatus;
  verificationStatus: DocumentVaultVerificationStatus;
  uploadedAt: string;
}

export interface DocumentVaultPanelProps {
  candidateName: string;
  documents: DocumentVaultItem[];
  /** Supabase access token from the verified candidate session; never a service-role key. */
  accessToken?: string;
}

const DOCUMENT_TYPES = [
  ["CV", "CV / résumé"], ["ID_DOCUMENT", "Identity document"],
  ["MATRIC_CERTIFICATE", "Matric certificate"], ["ACADEMIC_RECORD", "Academic record"],
  ["PROOF_OF_ADDRESS", "Proof of address"], ["BANK_LETTER", "Bank letter"],
  ["PARENT_GUARDIAN_ID", "Parent / guardian ID"], ["PAYSLIP", "Payslip"],
  ["AFFIDAVIT", "Affidavit"], ["APPLICATION_PROOF", "Application proof"],
  ["NSFAS_DOCUMENT", "NSFAS document"], ["OTHER", "Other"]
] as const;

export function DocumentVaultPanel(props: DocumentVaultPanelProps) {
  const [documents, setDocuments] = useState(props.documents);
  const [documentTypeCode, setDocumentTypeCode] = useState("CV");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshDocuments() {
    if (!props.accessToken) return;
    const response = await fetch("/api/candidate/documents/status", {
      headers: { authorization: "Bearer " + props.accessToken },
      cache: "no-store"
    });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.documents)) {
      setDocuments(data.documents.map((d: any) => ({
        documentRef: d.document_ref,
        documentType: d.document_type,
        displayName: d.display_name,
        documentStatus: d.document_status,
        verificationStatus: d.verification_status,
        uploadedAt: d.uploaded_at
      })));
    }
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.accessToken) {
      setMessage("Sign in again to upload. A verified candidate session is required.");
      return;
    }
    if (!file) {
      setMessage("Choose a PDF, JPEG, PNG, or WebP file first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const headers = { authorization: "Bearer " + props.accessToken, "content-type": "application/json" };
      const intentResponse = await fetch("/api/candidate/documents/upload-url", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentTypeCode, filename: file.name, mimeType: file.type, sizeBytes: file.size })
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok || !intent.ok || !intent.uploadUrl || !intent.documentRef) {
        throw new Error(intent.error || "A private upload could not be prepared.");
      }

      const transfer = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, ...(intent.uploadToken ? { "x-upsert": "false" } : {}) },
        body: file,
        cache: "no-store"
      });
      if (!transfer.ok) throw new Error("Storage did not confirm the file transfer. Retry or contact support; do not create another application yet.");

      const finalizeResponse = await fetch("/api/candidate/documents/finalize", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentRef: intent.documentRef })
      });
      const finalized = await finalizeResponse.json();
      if (!finalizeResponse.ok || !finalized.ok) throw new Error(finalized.error || "Upload finalization is pending. The file is not yet ready for application use.");
      setMessage("Upload received. It is private and pending content-safety and document review; it is not yet cleared for applications.");
      setFile(null);
      const input = document.getElementById("kingsmen-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await refreshDocuments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed safely. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Kingsmen document vault" className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Document Vault</p>
      <h2 className="mt-2 text-xl font-semibold">{props.candidateName} documents</h2>
      <p className="mt-2 text-sm text-slate-300">
        Documents are private, evidence-backed, and reviewed before they are used for applications.
      </p>

      <form onSubmit={uploadDocument} className="mt-5 space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="font-semibold">Upload a document</h3>
        <label className="block text-sm text-slate-300">
          Document type
          <select value={documentTypeCode} onChange={e => setDocumentTypeCode(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white">
            {DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          File (PDF, JPEG, PNG, WebP; maximum 10 MiB)
          <input id="kingsmen-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm" />
        </label>
        <button type="submit" disabled={busy || !props.accessToken || !file} className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Uploading…" : "Upload privately"}
        </button>
        {!props.accessToken && <p className="text-xs text-amber-300">Verified candidate session required before upload is enabled.</p>}
        {message && <p role="status" aria-live="polite" className="text-sm text-slate-200">{message}</p>}
      </form>

      <div className="mt-5 space-y-3">
        {documents.map((document) => (
          <article key={document.documentRef} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{document.displayName}</h3>
                <p className="mt-1 text-xs text-slate-400">{document.documentType}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full border border-slate-700 px-3 py-1">{document.documentStatus}</span>
                <span className="rounded-full border border-slate-700 px-3 py-1">{document.verificationStatus}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Uploaded: {document.uploadedAt}</p>
          </article>
        ))}
        {documents.length === 0 && <p className="text-sm text-slate-400">No documents uploaded yet.</p>}
      </div>
    </section>
  );
}
