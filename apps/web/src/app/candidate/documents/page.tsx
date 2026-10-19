"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

type DocumentRecord = {
  documentId: string;
  type?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
  status?: string;
  canonicalDocumentRef?: string;
  evidenceRef?: string;
  registryStatus?: "REGISTERED" | "LOCAL_ONLY";
  candidateReview?: { status?: string; reviewedAt?: string; reviewType?: string; notice?: string };
};
type WorkspaceResponse = { documents?: DocumentRecord[]; error?: string; status?: string };
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]);

function fileSize(bytes?: number) {
  if (typeof bytes !== "number" || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function dateLabel(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}
function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The selected file could not be encoded."));
    reader.readAsDataURL(file);
  });
}

export default function CandidateDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentType, setDocumentType] = useState("CV");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({})) as WorkspaceResponse;
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Please sign in to access your private documents." : (data.error || "Documents could not be loaded."));
      if (!Array.isArray(data.documents)) throw new Error("The document list returned an unexpected response.");
      setDocuments(data.documents);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Documents could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setMessage("");
    setError("");
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx", "txt"].includes(extension || "") || !ACCEPTED_TYPES.has(file.type)) {
      setError("Choose a PDF, DOCX or plain-text TXT file. The extension and file type must match.");
      setSelectedFile(null);
    } else if (file.size > MAX_UPLOAD_BYTES) {
      setError("This page accepts files up to 10 MB. Choose a smaller file.");
      setSelectedFile(null);
    } else if (file.size === 0) {
      setError("The selected file is empty.");
      setSelectedFile(null);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) { setError("Choose a supported document first."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const dataUrl = await readDataUrl(selectedFile);
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "uploadDocument", fileName: selectedFile.name, documentType, dataUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "DOCUMENT_UPLOADED") throw new Error(typeof data.error === "string" ? data.error : "The document could not be uploaded.");
      setDocuments(Array.isArray(data.store?.documents) ? data.store.documents : []);
      setSelectedFile(null);
      const input = document.getElementById("candidate-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage(data.document?.registryStatus === "REGISTERED"
        ? "Document uploaded and registered in the canonical vault. Verification is still pending."
        : "Document uploaded to your private workspace. Canonical registry registration is unavailable in this local development mode.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The document could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewDocument(document: DocumentRecord, reviewStatus: "CANDIDATE_CONFIRMED_CONTENT" | "NEEDS_CORRECTION" | "REPLACEMENT_NEEDED") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "recordDocumentReview", documentId: document.documentId, reviewStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "DOCUMENT_REVIEW_RECORDED") throw new Error(typeof data.error === "string" ? data.error : "The review could not be recorded.");
      setDocuments(Array.isArray(data.store?.documents) ? data.store.documents : []);
      setMessage("Your self-review was recorded. This is not an independent authenticity or employer-acceptance check.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The review could not be recorded.");
    } finally { setBusy(false); }
  }

  async function removeDocument(document: DocumentRecord) {
    if (!window.confirm(`Delete “${document.fileName || "this document"}” from your workspace?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "deleteDocument", documentId: document.documentId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "DOCUMENT_DELETED") throw new Error(typeof data.error === "string" ? data.error : "The document could not be deleted.");
      setDocuments(Array.isArray(data.store?.documents) ? data.store.documents : []);
      setMessage("Document deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The document could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  const panel = { border: "1px solid #dbe3ec", borderRadius: 16, padding: 20, background: "#fff" };
  const input = { boxSizing: "border-box" as const, width: "100%", padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#172033", font: "inherit" };
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
      <a href="/candidate/dashboard" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none", fontSize: 14 }}>← Candidate dashboard</a>
      <header style={{ margin: "22px 0 26px" }}>
        <p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.8, margin: "0 0 8px" }}>PRIVATE CANDIDATE FILES</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 10px" }}>Document vault</h1>
        <p style={{ color: "#53657a", lineHeight: 1.7, maxWidth: 730, margin: 0 }}>Upload your CV, identity document and certificates once, then reuse them when preparing applications. Uploading does not submit an application or verify a document.</p>
      </header>

      {error && <div role="alert" style={{ background: "#fff1f0", border: "1px solid #fecaca", color: "#8a1c13", borderRadius: 12, padding: 14, marginBottom: 16 }}>{error}</div>}
      {message && <div role="status" style={{ background: "#eaf8f0", border: "1px solid #b7e4ca", color: "#176345", borderRadius: 12, padding: 14, marginBottom: 16 }}>{message}</div>}

      <form onSubmit={upload} style={{ ...panel, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 21 }}>Add a document</h2>
        <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>PDF, DOCX or TXT · maximum 10 MB · private workspace only.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, alignItems: "end" }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 14 }}>Document type
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} style={{ ...input, display: "block", marginTop: 7 }}>
              <option value="CV">CV / résumé</option><option value="ID">Identity document</option><option value="CERTIFICATE">Certificate / qualification</option>
            </select>
          </label>
          <label style={{ display: "block", fontWeight: 700, fontSize: 14 }}>Choose file
            <input id="candidate-document-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={chooseFile} style={{ ...input, display: "block", marginTop: 7, padding: 9 }} />
          </label>
          <button type="submit" disabled={busy || !selectedFile} style={{ border: 0, borderRadius: 11, background: busy || !selectedFile ? "#94a3b8" : "#172f46", color: "#fff", padding: "13px 20px", fontWeight: 800, cursor: busy || !selectedFile ? "not-allowed" : "pointer" }}>{busy ? "Working…" : "Upload document"}</button>
        </div>
        {selectedFile && <p style={{ color: "#53657a", fontSize: 13, margin: "12px 0 0" }}>Selected: {selectedFile.name} ({fileSize(selectedFile.size)})</p>}
      </form>

      <section aria-label="Your documents" style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div><h2 style={{ margin: "0 0 5px", fontSize: 21 }}>Your documents</h2><p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{countLabel(documents.length)} in your workspace</p></div>
          <button type="button" onClick={() => void loadDocuments()} disabled={loading || busy} style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 12px", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Refresh list</button>
        </div>
        {loading ? <p role="status">Loading your private documents…</p> : documents.length === 0 ? <div style={{ borderRadius: 12, padding: 24, background: "#f5f8fb", textAlign: "center" }}><strong>No documents yet</strong><p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 14 }}>Upload your CV first, then add other supporting documents as needed.</p></div> : <div style={{ display: "grid", gap: 10 }}>
          {documents.map((document) => <article key={document.documentId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, border: "1px solid #e2e8f0", borderRadius: 12, padding: 15 }}>
            <div style={{ minWidth: 0, flex: "1 1 240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><strong style={{ overflowWrap: "anywhere" }}>{document.fileName || "Uploaded document"}</strong><span style={{ borderRadius: 6, padding: "3px 7px", background: "#eaf0f6", color: "#35536c", fontSize: 11, fontWeight: 800 }}>{document.type || "DOCUMENT"}</span></div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>{fileSize(document.sizeBytes)} · Added {dateLabel(document.createdAt)}</p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: document.registryStatus === "REGISTERED" ? "#176345" : "#64748b" }}>
                {document.registryStatus === "REGISTERED"
                  ? `Canonical vault: registered · Verification pending · Ref ${document.canonicalDocumentRef || "recorded"}`
                  : "Canonical vault registration not confirmed"}
              </p>
            </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#53657a" }}>Self-review: {document.candidateReview?.status || "NOT_REVIEWED"}{document.candidateReview?.reviewedAt ? ` · ${dateLabel(document.candidateReview.reviewedAt)}` : ""}. Independent verification: not performed.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" disabled={busy} onClick={() => void reviewDocument(document, "CANDIDATE_CONFIRMED_CONTENT")} style={{ border: "1px solid #b7e4ca", borderRadius: 9, padding: "8px 11px", background: "#fff", color: "#176345", fontSize: 12, fontWeight: 800 }}>Content looks correct</button>
              <button type="button" disabled={busy} onClick={() => void reviewDocument(document, "NEEDS_CORRECTION")} style={{ border: "1px solid #fed7aa", borderRadius: 9, padding: "8px 11px", background: "#fff", color: "#9a3412", fontSize: 12, fontWeight: 800 }}>Needs correction</button>
              <button type="button" disabled={busy} onClick={() => void reviewDocument(document, "REPLACEMENT_NEEDED")} style={{ border: "1px solid #fecaca", borderRadius: 9, padding: "8px 11px", background: "#fff", color: "#9f2d25", fontSize: 12, fontWeight: 800 }}>Replace document</button>
              <a href={`/api/personal-jobs/apply-now/documents/${encodeURIComponent(document.documentId)}`} target="_blank" rel="noreferrer" style={{ border: "1px solid #cbd5e1", borderRadius: 9, padding: "8px 11px", textDecoration: "none", color: "#1d5675", fontSize: 13, fontWeight: 800 }}>View / download</a>
              <button type="button" onClick={() => void removeDocument(document)} disabled={busy} style={{ border: "1px solid #fecaca", borderRadius: 9, padding: "8px 11px", background: "#fff", color: "#9f2d25", fontSize: 13, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer" }}>Delete</button>
            </div>
          </article>)}
        </div>}
      </section>
      <p style={{ marginTop: 20, padding: 15, borderRadius: 12, background: "#f1f5f9", color: "#53657a", fontSize: 13, lineHeight: 1.6 }}>Document extraction may help fill profile fields, but it is not a final verification decision. Never upload a file you do not have permission to store.</p>
    </main>
  );
}
function countLabel(count: number) { return `${count} document${count === 1 ? "" : "s"}`; }
