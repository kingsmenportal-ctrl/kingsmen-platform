"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { candidateWorkspaceRequest } from "@/lib/candidate-workspace-client";

type VaultDocument = {
  id: string; preparation_item_id: string | null; original_filename: string;
  mime_type: string; size_bytes: number; status: string; uploaded_at: string | null; created_at: string;
};
type VaultResponse = { ok: boolean; documents: VaultDocument[]; events: Array<Record<string, unknown>>; error?: string };
type UploadResponse = { ok: boolean; document: VaultDocument; signedUploadUrl: string; uploadHeaders: { "Content-Type": string }; error?: string };
type ReadResponse = { ok: boolean; signedReadUrl: string; error?: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = new Set(["application/pdf", "image/jpeg", "image/png"]);
const sizeLabel = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function CandidateDocumentsPage() {
  const input = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await candidateWorkspaceRequest<VaultResponse>("GET", undefined, "/api/candidate/documents/status");
      setDocuments(result.documents || []);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load your document vault."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) { setError("Choose a PDF, JPEG, or PNG file first."); return; }
    if (!ACCEPTED.has(file.type) || file.size < 1 || file.size > MAX_BYTES) {
      setError("For safety, upload a PDF, JPEG, or PNG no larger than 10 MiB."); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const prepared = await candidateWorkspaceRequest<UploadResponse>("POST", {
        filename: file.name, mimeType: file.type, sizeBytes: file.size
      }, "/api/candidate/documents/upload-url");
      const stored = await fetch(prepared.signedUploadUrl, {
        method: "PUT", headers: prepared.uploadHeaders, body: file, cache: "no-store"
      });
      if (!stored.ok) throw new Error("Private storage did not accept the upload. The pending record has not been marked uploaded.");
      await candidateWorkspaceRequest("POST", { documentId: prepared.document.id }, "/api/candidate/documents/complete");
      setMessage("Upload stored privately. It is marked candidate-reported and has not been independently verified.");
      if (input.current) input.current.value = "";
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed safely."); }
    finally { setBusy(false); }
  }

  async function openDocument(documentId: string) {
    setError("");
    try {
      const result = await candidateWorkspaceRequest<ReadResponse>("POST", { documentId }, "/api/candidate/documents/read-url");
      window.open(result.signedReadUrl, "_blank", "noopener,noreferrer");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not open the document."); }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide">Candidate workspace · Truth Vault</p>
        <h1 className="text-3xl font-bold">Private document vault</h1>
        <p>Upload and view your own documents. Files are stored in a private bucket; short-lived signed links are issued only after candidate ownership is checked.</p>
      </header>

      <section aria-labelledby="upload-heading" className="space-y-3 rounded-xl border p-5">
        <h2 id="upload-heading" className="text-xl font-semibold">Add a document</h2>
        <p className="text-sm">Accepted: PDF, JPEG, PNG · Maximum 10 MiB. Do not upload documents you are not authorised to share.</p>
        <input ref={input} aria-label="Choose document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={busy} />
        <div><button type="button" onClick={() => void upload()} disabled={busy} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50">{busy ? "Uploading securely…" : "Upload privately"}</button></div>
      </section>

      {message && <p role="status" className="rounded-lg border p-3">{message}</p>}
      {error && <p role="alert" className="rounded-lg border p-3">{error}</p>}

      <section aria-labelledby="documents-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="documents-heading" className="text-xl font-semibold">Your documents</h2>
          <button type="button" onClick={() => void refresh()} disabled={loading || busy} className="rounded-lg border px-3 py-2">Refresh</button>
        </div>
        {loading ? <p>Loading your private document list…</p> : documents.length === 0 ? <p>No documents have been uploaded to your vault yet.</p> :
          <ul className="space-y-3">{documents.map((doc) => (
            <li key={doc.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-semibold">{doc.original_filename}</p>
                <p className="text-sm">{sizeLabel(Number(doc.size_bytes))} · {doc.mime_type}</p>
                <p className="text-sm">Status: <strong>{doc.status.replaceAll("_", " ")}</strong></p>
                {doc.status === "UPLOADED_CANDIDATE_REPORTED" && <p className="text-sm">Stored successfully; authenticity and qualification have not been independently verified.</p>}
                {doc.status === "UPLOAD_PENDING" && <p className="text-sm">Upload confirmation is still pending.</p>}
              </div>
              <button type="button" onClick={() => void openDocument(doc.id)} disabled={!["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(doc.status)} className="shrink-0 rounded-lg border px-3 py-2 disabled:opacity-40">Open securely</button>
            </li>
          ))}</ul>}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Review and verification boundary</h2>
        <p>Uploading confirms only that a private object exists and its reported size and media type match. It does not prove authenticity, qualification, or institutional acceptance. This candidate interface cannot verify, reject, or delete documents; those actions require a separately authorised reviewer workflow.</p>
      </section>
    </main>
  );
}
