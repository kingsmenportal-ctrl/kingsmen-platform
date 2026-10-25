"use client";

import { useCallback, useEffect, useState } from "react";

const PROJECT_REF = "euhubhhnumtibbyufghm";
const FUNCTION_BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;

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
  count?: number;
  evidence_boundary?: string;
  error?: string;
};
type ActionResponse = {
  request_id?: string;
  status?: string;
  message?: string;
  error?: string;
};

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = [
    `sb-${PROJECT_REF}-auth-token`,
    ...Object.keys(window.localStorage).filter(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    )
  ];
  for (const key of [...new Set(keys)]) {
    try {
      const stored = window.localStorage.getItem(key);
      if (!stored) continue;
      const parsed = JSON.parse(stored) as {
        access_token?: unknown;
        currentSession?: { access_token?: unknown };
        session?: { access_token?: unknown };
      };
      const token = parsed.access_token ?? parsed.currentSession?.access_token ?? parsed.session?.access_token;
      if (typeof token === "string" && token.length > 20) return token;
    } catch {
      // Ignore invalid or unrelated storage values.
    }
  }
  return null;
}

export default function IdentityReviewQueuePage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [evidenceBoundary, setEvidenceBoundary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [candidateReferences, setCandidateReferences] = useState<Record<string, string>>({});
  const [evidenceNotes, setEvidenceNotes] = useState<Record<string, string>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});

  const loadQueue = useCallback(async () => {
    setBusy(true);
    setError("");
    const token = readAccessToken();
    if (!token) {
      setError("Sign in with the authorised identity-review account first.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`${FUNCTION_BASE}/candidate-identity-review-queue`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const body = (await response.json().catch(() => ({}))) as QueueResponse;
      if (!response.ok) {
        setError(body.error ?? `Review queue could not be loaded (HTTP ${response.status}).`);
        return;
      }
      setRequests(body.requests ?? []);
      setEvidenceBoundary(body.evidence_boundary ?? "");
    } catch {
      setError("The identity-review service could not be reached.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  async function openEvidence(evidence: Evidence) {
    setError("");
    const token = readAccessToken();
    if (!token) { setError("Your reviewer session is missing or expired."); return; }
    try {
      const response = await fetch(`${FUNCTION_BASE}/candidate-identity-review-evidence-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ evidence_id: evidence.id })
      });
      const body = await response.json().catch(() => ({})) as { signed_url?: string; error?: string };
      if (!response.ok || !body.signed_url) {
        setError(body.error ?? "A private evidence link could not be created.");
        return;
      }
      setEvidenceLinks((old) => ({ ...old, [evidence.id]: body.signed_url! }));
    } catch {
      setError("Could not create a short-lived private evidence link.");
    }
  }

  async function decideEvidence(evidence: Evidence, decision: "ACCEPTED" | "REJECTED") {
    setError("");
    setNotice("");
    const token = readAccessToken();
    const note = (evidenceNotes[evidence.id] ?? "").trim();
    if (!token) { setError("Your reviewer session is missing or expired."); return; }
    if (note.length < 3) { setError("Record what you inspected and why this evidence is accepted or rejected."); return; }
    setBusy(true);
    try {
      const response = await fetch(`${FUNCTION_BASE}/candidate-identity-review-evidence-decision`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ evidence_id: evidence.id, decision, note })
      });
      const body = await response.json().catch(() => ({})) as { error?: string; request_id?: string; review_status?: string };
      if (!response.ok) { setError(body.error ?? "Evidence review was not recorded."); return; }
      setNotice(`Evidence ${evidence.id} recorded as ${body.review_status}. Refreshing the queue.`);
      await loadQueue();
    } catch {
      setError("Evidence review could not be confirmed. Refresh the queue before retrying.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(request: ReviewRequest, decision: "APPROVED" | "REJECTED" | "NEEDS_INFORMATION") {
    setError("");
    setNotice("");
    const token = readAccessToken();
    const note = (notes[request.id] ?? "").trim();
    if (!token) { setError("Your reviewer session is missing or expired."); return; }
    if (note.length < 3) { setError("Enter a meaningful review note before recording a decision."); return; }
    setBusy(true);
    try {
      const response = await fetch(`${FUNCTION_BASE}/candidate-identity-review-decision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          request_id: request.id,
          decision,
          candidate_reference: candidateReferences[request.id] || request.candidate_reference,
          note
        })
      });
      const body = (await response.json().catch(() => ({}))) as ActionResponse;
      if (!response.ok) {
        setError(body.error ?? `Decision was not recorded (HTTP ${response.status}).`);
        return;
      }
      setNotice(`Request ${body.request_id ?? request.id} recorded as ${body.status ?? decision}.`);
      await loadQueue();
    } catch {
      setError("The decision could not be confirmed. Check the persisted queue before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Kingsmen · Restricted reviewer workspace</p>
          <h1 className="mt-3 text-3xl font-bold">Candidate identity-review queue</h1>
          <p className="mt-3 leading-7 text-slate-300">
            Queue access is checked by the backend against the active IDENTITY_REVIEWER permission.
            Inspect the exact candidate reference and claimant statement, record a reasoned note,
            and use “Needs more information” when evidence is insufficient.
          </p>
          <button type="button" onClick={() => void loadQueue()} disabled={busy} className="mt-5 rounded-xl border border-slate-700 px-4 py-2 font-semibold disabled:opacity-60">
            {busy ? "Loading…" : "Refresh queue"}
          </button>
        </header>

        {evidenceBoundary ? (
          <section className="mt-5 rounded-2xl border border-amber-700 bg-amber-950/40 p-5">
            <h2 className="font-bold text-amber-200">Evidence inspection required</h2>
            <p className="mt-2 text-sm leading-6 text-amber-100">{evidenceBoundary}</p>
            <p className="mt-2 text-sm leading-6 text-amber-100">
              Do not approve a claim based only on the candidate's description. Open each attached file through its short-lived private link and record an evidence decision with a rationale. The backend requires accepted evidence before identity approval.
            </p>
          </section>
        ) : null}

        {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-rose-200">{error}</p> : null}
        {notice ? <p role="status" className="mt-5 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-emerald-200">{notice}</p> : null}

        <section className="mt-6 space-y-5" aria-label="Pending identity review requests">
          {requests.length === 0 && !busy && !error ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">No pending identity-review requests were returned by the backend.</div>
          ) : null}
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{request.claimant_name}</h2>
                  <p className="mt-1 text-sm text-slate-400">Request {request.id}</p>
                  <p className="mt-1 text-sm text-slate-400">Submitted {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-amber-700 px-3 py-1 text-xs font-semibold text-amber-200">{request.request_status}</span>
              </div>
              <dl className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Claimed candidate reference</dt>
                  <dd className="mt-2 break-all font-mono">{request.candidate_reference}</dd>
                </div>
                <div className="rounded-xl border border-slate-800 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Candidate statement and evidence description</dt>
                  <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{request.claimant_message}</dd>
                </div>
              </dl>
              <section className="mt-5 rounded-xl border border-slate-800 p-4" aria-label="Private supporting evidence">
                <h3 className="font-semibold">Supporting evidence ({request.evidence?.length ?? 0})</h3>
                {(request.evidence ?? []).length === 0 ? (
                  <p className="mt-2 text-sm text-amber-200">No private evidence file is attached. Do not approve this identity claim.</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {(request.evidence ?? []).map((evidence) => (
                      <div key={evidence.id} className="rounded-lg border border-slate-700 p-3">
                        <p className="break-all font-semibold">{evidence.original_filename}</p>
                        <p className="mt-1 text-xs text-slate-400">{evidence.mime_type} · {Math.ceil(evidence.size_bytes / 1024)} KB · SHA-256 {evidence.sha256_hex}</p>
                        <p className="mt-1 text-sm">Evidence review: <strong>{evidence.review_status}</strong>{evidence.reviewer_note ? ` — ${evidence.reviewer_note}` : ""}</p>
                        <button type="button" disabled={busy} onClick={() => void openEvidence(evidence)} className="mt-3 rounded-lg border border-sky-700 px-3 py-2 text-sm font-semibold text-sky-200 disabled:opacity-50">Create private 60-second view link</button>
                        {evidenceLinks[evidence.id] ? <p className="mt-2"><a href={evidenceLinks[evidence.id]} target="_blank" rel="noreferrer" className="break-all text-sm text-sky-300 underline">Open evidence file (expires shortly)</a></p> : null}
                        {evidence.review_status === "PENDING" ? (
                          <>
                            <label htmlFor={`evidence-note-${evidence.id}`} className="mt-3 block text-sm font-semibold">Evidence inspection note</label>
                            <textarea id={`evidence-note-${evidence.id}`} rows={2} maxLength={1200} value={evidenceNotes[evidence.id] ?? ""} onChange={(event) => setEvidenceNotes((old) => ({ ...old, [evidence.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Record that you opened and inspected the file, its relevance, and any concerns." />
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button type="button" disabled={busy} onClick={() => void decideEvidence(evidence, "ACCEPTED")} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50">Accept evidence</button>
                              <button type="button" disabled={busy} onClick={() => void decideEvidence(evidence, "REJECTED")} className="rounded-lg border border-rose-800 px-3 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50">Reject evidence</button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <div className="mt-4">
                <label htmlFor={`ref-${request.id}`} className="mb-2 block text-sm font-semibold">Exact candidate reference for any decision</label>
                <input id={`ref-${request.id}`} value={candidateReferences[request.id] ?? request.candidate_reference} onChange={(event) => setCandidateReferences((old) => ({ ...old, [request.id]: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono" />
              </div>
              <div className="mt-4">
                <label htmlFor={`note-${request.id}`} className="mb-2 block text-sm font-semibold">Reviewer rationale / information needed</label>
                <textarea id={`note-${request.id}`} minLength={3} maxLength={1200} rows={3} value={notes[request.id] ?? ""} onChange={(event) => setNotes((old) => ({ ...old, [request.id]: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Record what you checked, any conflicts, and why more evidence or rejection is appropriate." />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={busy} onClick={() => void decide(request, "NEEDS_INFORMATION")} className="rounded-xl border border-amber-700 px-4 py-3 font-semibold text-amber-200 disabled:opacity-50">Request more information</button>
                <button type="button" disabled={busy} onClick={() => void decide(request, "REJECTED")} className="rounded-xl border border-rose-800 px-4 py-3 font-semibold text-rose-200 disabled:opacity-50">Reject claim</button>
                <button type="button" disabled={busy || !(request.evidence ?? []).some((evidence) => evidence.review_status === "ACCEPTED")} onClick={() => void decide(request, "APPROVED")} title="Approval requires at least one evidence item accepted by an authorized reviewer; the backend enforces this too." className="rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Approve after evidence accepted</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
