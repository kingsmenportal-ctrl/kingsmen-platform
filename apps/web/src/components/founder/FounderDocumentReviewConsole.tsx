"use client";

import { useCallback, useEffect, useState } from "react";
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
type DeletionRequest = {
  id: string;
  request_ref: string;
  document_id: string;
  candidate_id: string;
  reason: string;
  request_status: string;
  requested_at: string;
  reviewer_note: string | null;
};
type ApiResult = {
  ok?: boolean;
  error?: string;
  documents?: ReviewDocument[];
  requests?: DeletionRequest[];
  signed_download_url?: string;
  request_status?: string;
};

export default function FounderDocumentReviewConsole() {
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [approvalRefs, setApprovalRefs] = useState<Record<string, string>>({});
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const call = useCallback(async (payload: Record<string, unknown>): Promise<ApiResult> => {
    const session = getCandidateSessionState();
    if (session.status !== "ready") throw new Error("Sign in with an authorised reviewer account.");
    const response = await fetch(session.url + "/functions/v1/candidate-private-documents", {
      method: "POST",
      headers: { apikey: session.anonKey, Authorization: "Bearer " + session.token, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    const result = await response.json().catch(() => ({})) as ApiResult;
    if (!response.ok || result.ok === false) throw new Error(response.status === 403 ? "Your account lacks the required reviewer role." : "The document service rejected this action or is temporarily unavailable.");
    return result;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queue = await call({ action: "list_review_queue" });
      setDocuments(Array.isArray(queue.documents) ? queue.documents : []);
      try {
        const deletion = await call({ action: "list_deletion_requests" });
        setDeletionRequests(Array.isArray(deletion.requests) ? deletion.requests : []);
      } catch {
        setDeletionRequests([]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reviewer queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { void reload(); }, [reload]);

  async function runReview(document: ReviewDocument, decision: "START_REVIEW" | "VERIFIED" | "CORRECTION_REQUIRED" | "REJECTED") {
    const note = (notes[document.id] ?? "").trim();
    const evidenceReference = (evidence[document.id] ?? "").trim();
    if (decision !== "START_REVIEW" && (note.length < 3 || evidenceReference.length < 3)) {
      setError("Final document decisions require a reviewer note and evidence reference.");
      return;
    }
    setBusy(document.id);
    setError("");
    setNotice("");
    try {
      await call({ action: "review_document", document_id: document.id, decision,
        reviewer_note: note, evidence_reference: evidenceReference });
      setNotice("Document review decision and audit event were recorded.");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review decision failed.");
    } finally {
      setBusy(null);
    }
  }

  async function requestDownload(document: ReviewDocument) {
    setBusy(document.id);
    setError("");
    try {
      const result = await call({ action: "create_reviewer_download_url", document_id: document.id });
      if (!result.signed_download_url) throw new Error("No audited short-lived download link was returned.");
      setDownloadLinks(previous => ({ ...previous, [document.id]: result.signed_download_url! }));
      setNotice("A private download link was issued and audited. It expires in 60 seconds; do not share it.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create a private download link.");
    } finally {
      setBusy(null);
    }
  }

  async function reviewDeletion(request: DeletionRequest, decision: "APPROVE" | "REJECT") {
    const note = (notes["delete:" + request.id] ?? "").trim();
    const approvalRef = (approvalRefs[request.id] ?? "").trim();
    if (note.length < 3 || (decision === "APPROVE" && approvalRef.length < 3)) {
      setError("Deletion decisions require a reviewer note and approval reference for approval.");
      return;
    }
    setBusy(request.id);
    setError("");
    setNotice("");
    try {
      const result = await call({ action: "review_deletion_request", request_id: request.id,
        decision, reviewer_note: note, approval_ref: approvalRef || null });
      setNotice(decision === "APPROVE"
        ? (result.request_status === "COMPLETED" ? "Approved file deletion completed and audit state recorded." : "Deletion request approved.")
        : "Deletion request rejected. The file was retained.");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Deletion review failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-950 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Founder operations</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Private document review</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Reviewer actions require active platform roles. Candidate-reported uploads are not verified automatically. Download links are short-lived and audited.</p>
        </div>
        <button type="button" onClick={() => void reload()} disabled={loading} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50">{loading ? "Refreshing…" : "Refresh queues"}</button>
      </header>
      {error ? <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p> : null}
      {notice ? <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}

      <section className="mt-8">
        <h2 className="text-xl font-bold">Document verification queue</h2>
        {loading ? <p className="mt-3 text-sm text-slate-600">Loading queue…</p> : null}
        {!loading && documents.length === 0 ? <p className="mt-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">No documents are awaiting review.</p> : null}
        <div className="mt-4 space-y-4">{documents.map(document => (
          <article key={document.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-bold">{document.original_filename}</h3><p className="mt-1 text-xs text-slate-600">Candidate {document.candidate_id} · {document.mime_type} · {Math.round(document.size_bytes / 1024)} KB</p><p className="mt-1 text-xs text-slate-600">Status: {document.status.replaceAll("_", " ")}</p></div>
              <button type="button" onClick={() => void requestDownload(document)} disabled={busy === document.id} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-50">Issue 60-second download</button>
            </div>
            {downloadLinks[document.id] ? <p className="mt-3 text-sm"><a className="font-bold underline" href={downloadLinks[document.id]} target="_blank" rel="noopener noreferrer">Open audited private file</a> <span className="text-xs text-slate-500">Do not share; short-lived.</span></p> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold">Reviewer note
                <textarea rows={2} value={notes[document.id] ?? ""} onChange={event => setNotes(previous => ({ ...previous, [document.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" maxLength={1200} />
              </label>
              <label className="text-xs font-bold">Evidence reference (required for final decisions)
                <input value={evidence[document.id] ?? ""} onChange={event => setEvidence(previous => ({ ...previous, [document.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" maxLength={500} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy === document.id} onClick={() => void runReview(document,"START_REVIEW")} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-50">Start review</button>
              <button type="button" disabled={busy === document.id} onClick={() => void runReview(document,"VERIFIED")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Verify</button>
              <button type="button" disabled={busy === document.id} onClick={() => void runReview(document,"CORRECTION_REQUIRED")} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Request correction</button>
              <button type="button" disabled={busy === document.id} onClick={() => void runReview(document,"REJECTED")} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reject</button>
            </div>
          </article>
        ))}</div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Retention and deletion requests</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Only a platform administrator may approve deletion. The file is removed from private storage before its database record is marked deleted; a failed storage deletion remains retryable.</p>
        <div className="mt-4 space-y-4">{deletionRequests.map(request => (
          <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{request.request_ref}</h3><span className="text-xs font-semibold">{request.request_status.replaceAll("_", " ")}</span></div>
            <p className="mt-2 text-sm text-slate-700">{request.reason}</p><p className="mt-1 break-all text-xs text-slate-500">Candidate {request.candidate_id} · Document {request.document_id}</p>
            <label className="mt-3 block text-xs font-bold">Reviewer note
              <textarea rows={2} value={notes["delete:" + request.id] ?? ""} onChange={event => setNotes(previous => ({ ...previous, ["delete:" + request.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" maxLength={1200} />
            </label>
            <label className="mt-3 block text-xs font-bold">Approval reference (required to approve)
              <input value={approvalRefs[request.id] ?? ""} onChange={event => setApprovalRefs(previous => ({ ...previous, [request.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" maxLength={200} />
            </label>
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busy === request.id} onClick={() => void reviewDeletion(request,"APPROVE")} className="rounded-lg bg-red-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve and delete</button>
              <button type="button" disabled={busy === request.id} onClick={() => void reviewDeletion(request,"REJECT")} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-50">Reject and retain</button>
            </div>
          </article>
        ))}</div>
      </section>
    </main>
  );
}
