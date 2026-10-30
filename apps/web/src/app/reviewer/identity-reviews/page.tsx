"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCandidateAccessToken } from "../../../lib/candidate-session";

type Evidence = {
  id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  sha256_hex: string;
  review_status: string;
  reviewed_at?: string | null;
  reviewer_note?: string | null;
};
type ReviewRequest = {
  id: string;
  candidate_reference: string;
  claimant_name: string;
  claimant_message: string;
  request_status: string;
  created_at: string;
  candidate_response?: string | null;
  evidence?: Evidence[];
};
type QueueResponse = {
  requests?: ReviewRequest[];
  evidence_boundary?: string;
  error?: string;
};
function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}
async function reviewerApi(token: string, payload?: Record<string, unknown>) {
  const response = await fetch("/api/reviewer/identity-review", {
    method: payload ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      ...(payload ? { "Content-Type": "application/json" } : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store",
    redirect: "error"
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const error = typeof body.error === "string" ? body.error : "Reviewer operation failed (HTTP " + response.status + ").";
    throw new Error(error);
  }
  return body;
}

export default function IdentityReviewQueuePage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [evidenceBoundary, setEvidenceBoundary] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [candidateReferences, setCandidateReferences] = useState<Record<string, string>>({});
  const [evidenceNotes, setEvidenceNotes] = useState<Record<string, string>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = getCandidateAccessToken();
    if (!token) {
      setRequests([]);
      setError("Sign in with the authorised identity-review account before opening this queue.");
      setLoading(false);
      return;
    }
    try {
      const body = await reviewerApi(token) as QueueResponse;
      setRequests(Array.isArray(body.requests) ? body.requests : []);
      setEvidenceBoundary(typeof body.evidence_boundary === "string" ? body.evidence_boundary : "");
    } catch (reason) {
      setRequests([]);
      setError(reason instanceof Error ? reason.message : "The reviewer queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  async function openEvidence(evidence: Evidence) {
    const token = getCandidateAccessToken();
    if (!token) { setError("Your reviewer session is missing or expired."); return; }
    setError("");
    try {
      const body = await reviewerApi(token, { action: "evidence_read", evidence_id: evidence.id });
      if (typeof body.signed_url !== "string" || !body.signed_url) throw new Error("A private evidence link was not returned.");
      setEvidenceLinks(old => ({ ...old, [evidence.id]: body.signed_url as string }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create a short-lived private evidence link.");
    }
  }

  async function decideEvidence(evidence: Evidence, decision: "ACCEPTED" | "REJECTED") {
    const token = getCandidateAccessToken();
    const note = (evidenceNotes[evidence.id] ?? "").trim();
    if (!token) { setError("Your reviewer session is missing or expired."); return; }
    if (note.length < 3) { setError("Record what you inspected and why this evidence is accepted or rejected."); return; }
    setError("");
    setNotice("");
    setBusy("evidence:" + evidence.id);
    try {
      const body = await reviewerApi(token, { action: "evidence_decision", evidence_id: evidence.id, decision, note });
      setNotice("Evidence review recorded as " + String(body.review_status ?? decision) + ". Refreshing the queue.");
      await loadQueue();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Evidence review could not be confirmed.");
    } finally {
      setBusy("");
    }
  }

  async function decide(request: ReviewRequest, decision: "APPROVED" | "REJECTED" | "NEEDS_INFORMATION") {
    const token = getCandidateAccessToken();
    const note = (notes[request.id] ?? "").trim();
    const candidateReference = (candidateReferences[request.id] ?? request.candidate_reference).trim();
    if (!token) { setError("Your reviewer session is missing or expired."); return; }
    if (note.length < 3) { setError("Enter a meaningful review note before recording a decision."); return; }
    if (decision === "APPROVED" && !candidateReference) { setError("Confirm the exact candidate reference before approval."); return; }
    setError("");
    setNotice("");
    setBusy("request:" + request.id);
    try {
      const body = await reviewerApi(token, {
        action: "decision",
        request_id: request.id,
        decision,
        candidate_reference: candidateReference,
        note
      });
      setNotice("Identity-review request recorded as " + String(body.status ?? decision) + ".");
      await loadQueue();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The identity decision could not be confirmed.");
    } finally {
      setBusy("");
    }
  }

  const anyBusy = Boolean(busy);
  return (
    <main className="km-reviewer-page">
      <div className="km-reviewer-wrap">
        <header className="km-reviewer-hero">
          <p className="km-reviewer-eyebrow">Kingsmen · Restricted reviewer workspace</p>
          <h1>Candidate identity-review queue</h1>
          <p>Access is checked by the backend against the active IDENTITY_REVIEWER permission. Inspect the exact candidate reference and claimant statement, record a reasoned note, and use “Needs more information” when evidence is insufficient.</p>
          <div className="km-reviewer-actions">
            <button type="button" onClick={() => void loadQueue()} disabled={loading || anyBusy}>{loading ? "Loading queue…" : "Refresh queue"}</button>
            <Link href="/candidate/login?next=%2Freviewer%2Fidentity-reviews">Reviewer sign in</Link>
          </div>
        </header>

        {evidenceBoundary ? (
          <section className="km-reviewer-boundary" aria-label="Evidence inspection requirement">
            <h2>Evidence inspection required</h2>
            <p>{evidenceBoundary}</p>
            <p>Do not approve a claim based only on the candidate's description. Open each attached file through its short-lived private link and record an evidence decision with a rationale. The backend requires accepted evidence before identity approval.</p>
          </section>
        ) : null}

        {error ? <p role="alert" className="km-reviewer-message km-reviewer-message--error">{error}</p> : null}
        {notice ? <p role="status" className="km-reviewer-message km-reviewer-message--success">{notice}</p> : null}

        <section className="km-reviewer-list" aria-label="Pending identity review requests">
          {loading ? <div className="km-reviewer-empty" role="status">Loading the restricted identity-review queue…</div> : null}
          {!loading && requests.length === 0 && !error ? <div className="km-reviewer-empty">No pending identity-review requests were returned by the backend.</div> : null}
          {requests.map(request => (
            <article key={request.id} className="km-reviewer-request">
              <div className="km-reviewer-request__top">
                <div>
                  <h2>{request.claimant_name}</h2>
                  <p>Request reference: <code>{request.id}</code></p>
                  <p>Received {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <span className="km-reviewer-status">{formatStatus(request.request_status)}</span>
              </div>
              <dl className="km-reviewer-details">
                <div><dt>Claimed candidate reference</dt><dd>{request.candidate_reference}</dd></div>
                <div><dt>Candidate statement</dt><dd>{request.claimant_message}</dd></div>
                {request.candidate_response ? <div><dt>Candidate follow-up</dt><dd>{request.candidate_response}</dd></div> : null}
              </dl>

              <section className="km-reviewer-evidence" aria-label="Private supporting evidence">
                <h3>Supporting evidence ({request.evidence?.length ?? 0})</h3>
                {(request.evidence ?? []).length === 0 ? (
                  <p className="km-reviewer-warning">No private evidence is attached. Do not approve this identity claim.</p>
                ) : (request.evidence ?? []).map(evidence => (
                  <div className="km-reviewer-evidence__item" key={evidence.id}>
                    <strong>{evidence.original_filename}</strong>
                    <p>{evidence.mime_type} · {Math.ceil(evidence.size_bytes / 1024)} KB · SHA-256 {evidence.sha256_hex}</p>
                    <p>Evidence review: <strong>{formatStatus(evidence.review_status)}</strong>{evidence.reviewer_note ? " — " + evidence.reviewer_note : ""}</p>
                    <button type="button" onClick={() => void openEvidence(evidence)} disabled={anyBusy}>Create private 60-second view link</button>
                    {evidenceLinks[evidence.id] ? <p><a href={evidenceLinks[evidence.id]} target="_blank" rel="noopener noreferrer">Open evidence file (short-lived link)</a></p> : null}
                    {evidence.review_status === "PENDING" ? (
                      <div className="km-reviewer-evidence__decision">
                        <label htmlFor={"evidence-note-" + evidence.id}>Evidence inspection note</label>
                        <textarea id={"evidence-note-" + evidence.id} rows={3} maxLength={1200} value={evidenceNotes[evidence.id] ?? ""} onChange={event => setEvidenceNotes(old => ({ ...old, [evidence.id]: event.target.value }))} placeholder="Record that you opened and inspected the file, its relevance, and any concerns." />
                        <div className="km-reviewer-actions">
                          <button type="button" onClick={() => void decideEvidence(evidence, "ACCEPTED")} disabled={anyBusy}>Accept evidence</button>
                          <button type="button" className="km-reviewer-button--danger" onClick={() => void decideEvidence(evidence, "REJECTED")} disabled={anyBusy}>Reject evidence</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </section>

              <div className="km-reviewer-fields">
                <label htmlFor={"candidate-ref-" + request.id}>Exact candidate reference for the decision</label>
                <input id={"candidate-ref-" + request.id} value={candidateReferences[request.id] ?? request.candidate_reference} onChange={event => setCandidateReferences(old => ({ ...old, [request.id]: event.target.value }))} maxLength={120} />
                <label htmlFor={"review-note-" + request.id}>Reviewer rationale / information needed</label>
                <textarea id={"review-note-" + request.id} minLength={3} maxLength={1200} rows={3} value={notes[request.id] ?? ""} onChange={event => setNotes(old => ({ ...old, [request.id]: event.target.value }))} placeholder="Record what you checked, any conflicts, and why more evidence or rejection is appropriate." />
              </div>
              <div className="km-reviewer-actions km-reviewer-actions--decisions">
                <button type="button" className="km-reviewer-button--warning" onClick={() => void decide(request, "NEEDS_INFORMATION")} disabled={anyBusy}>Request more information</button>
                <button type="button" className="km-reviewer-button--danger" onClick={() => void decide(request, "REJECTED")} disabled={anyBusy}>Reject claim</button>
                <button type="button" className="km-reviewer-button--approve" onClick={() => void decide(request, "APPROVED")} disabled={anyBusy || !(request.evidence ?? []).some(item => item.review_status === "ACCEPTED")} title="The backend requires at least one private evidence item accepted by an authorised identity reviewer.">Approve after evidence accepted</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
