"use client";

import { useCallback, useEffect, useState } from "react";

const PROJECT_REF = "euhubhhnumtibbyufghm";
const FUNCTION_BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;

type ReviewRequest = {
  id: string;
  candidate_reference: string;
  claimant_name: string;
  claimant_message: string;
  request_status: string;
  created_at: string;
  candidate_response?: string | null;
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

  async function decide(request: ReviewRequest, decision: "REJECTED" | "NEEDS_INFORMATION") {
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
            <h2 className="font-bold text-amber-200">Evidence limitation — approval remains blocked</h2>
            <p className="mt-2 text-sm leading-6 text-amber-100">{evidenceBoundary}</p>
            <p className="mt-2 text-sm leading-6 text-amber-100">
              Do not approve a claim based only on a candidate's description. The private evidence attachment, reviewer read-access, and evidence-review audit path must be completed before approval can be safely enabled.
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
                <button type="button" disabled title="Approval is intentionally unavailable until private evidence attachments and audited evidence review are implemented." className="cursor-not-allowed rounded-xl bg-slate-700 px-4 py-3 font-semibold text-slate-300">Approve — blocked pending evidence workflow</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
