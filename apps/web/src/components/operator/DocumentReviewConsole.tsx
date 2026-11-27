"use client";

import { useState } from "react";
import { getCandidateSessionState } from "@/lib/candidate-session";

type ReviewDocument = {
  id: string;
  candidate_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};
type ReviewDecision = "START_REVIEW" | "VERIFIED" | "CORRECTION_REQUIRED" | "REJECTED";

function readableError(body: Record<string, unknown>, fallback: string) {
  return typeof body.error === "string" ? body.error : typeof body.code === "string" ? body.code : fallback;
}

export default function DocumentReviewConsole() {
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [decision, setDecision] = useState<ReviewDecision>("START_REVIEW");
  const [note, setNote] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function api(path: string, method: "GET" | "POST", body?: Record<string, unknown>) {
    const session = getCandidateSessionState();
    if (session.status !== "ready") throw new Error("Sign in with an authorized reviewer account to use the document review queue.");
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: "Bearer " + session.token,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(readableError(payload, "The document review request failed."));
    return payload;
  }

  async function loadQueue() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = await api("/api/founder/documents/review", "GET");
      setDocuments(Array.isArray(payload.documents) ? payload.documents as ReviewDocument[] : []);
      setMessage("Queue refreshed. Document contents remain private until an authorized reviewer requests a short-lived audited link.");
    } catch (caught) {
      setDocuments([]);
      setError(caught instanceof Error ? caught.message : "The review queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function openReviewerDownload(documentId: string) {
    setError("");
    try {
      const payload = await api("/api/founder/documents/review/download-url", "POST", {
        document_id: documentId
      });
      const url = typeof payload.signed_download_url === "string" ? payload.signed_download_url : "";
      if (!url || new URL(url).protocol !== "https:") throw new Error("The review service did not return a valid temporary HTTPS link.");
      window.open(url, "_blank", "noopener,noreferrer");
      setMessage("A temporary reviewer download link was issued and audited.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be opened.");
    }
  }

  async function submitDecision(documentId: string) {
    setError("");
    setMessage("");
    setActiveDocument(documentId);
    try {
      await api("/api/founder/documents/review", "POST", {
        document_id: documentId,
        decision,
        reviewer_note: note,
        evidence_reference: evidenceReference
      });
      setMessage("Review decision recorded. The queue is being refreshed from the authoritative service.");
      setNote("");
      setEvidenceReference("");
      await loadQueue();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The review decision could not be recorded.");
    } finally {
      setActiveDocument(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">N05 · Private document vault</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Document review queue</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Only active evidence verifiers and platform administrators can inspect the queue or record decisions. Every final decision requires a reviewer note and evidence reference; the service persists the decision and audit history transactionally.</p>
          </div>
          <button type="button" onClick={() => void loadQueue()} disabled={loading} className="min-h-11 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Refreshing…" : "Refresh queue"}</button>
        </header>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">A candidate upload is not proof of authenticity. Provider receipts remain candidate-reported until independently reviewed. Temporary download links expire quickly and are not public URLs.</div>
        {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : null}
        {message ? <p role="status" className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</p> : null}
        <section aria-label="Pending private documents" className="mt-6 space-y-4">
          {!documents.length && !loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Queue not loaded or no documents are waiting. Select Refresh queue to check reviewer authorization and current queue state.</div> : null}
          {documents.map((doc) => (
            <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold">{doc.original_filename}</h2>
                  <p className="mt-1 text-xs text-slate-500">{doc.mime_type} · {Math.ceil(doc.size_bytes / 1024)} KB · {doc.status}</p>
                  <p className="mt-2 break-all text-xs text-slate-500">Candidate reference: {doc.candidate_id}</p>
                  <p className="mt-1 text-xs text-slate-500">Uploaded: {new Date(doc.created_at).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => void openReviewerDownload(doc.id)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Open audited temporary link</button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">Review decision
                  <select value={decision} onChange={(event) => setDecision(event.target.value as ReviewDecision)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">
                    <option value="START_REVIEW">Start review</option>
                    <option value="VERIFIED">Verify document</option>
                    <option value="CORRECTION_REQUIRED">Request correction</option>
                    <option value="REJECTED">Reject document</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">Reviewer note {decision !== "START_REVIEW" ? "(required)" : "(optional)"}
                  <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={1200} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Explain the decision or required correction" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">Evidence reference {decision !== "START_REVIEW" ? "(required)" : "(optional)"}
                  <input value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} maxLength={500} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Reference the review evidence; do not paste sensitive document contents" />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" disabled={activeDocument === doc.id || (decision !== "START_REVIEW" && (note.trim().length < 3 || evidenceReference.trim().length < 3))} onClick={() => void submitDecision(doc.id)} className="min-h-10 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{activeDocument === doc.id ? "Saving decision…" : "Record review decision"}</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
