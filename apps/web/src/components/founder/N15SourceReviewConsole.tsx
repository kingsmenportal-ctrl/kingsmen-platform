"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCandidateAccessToken, getCandidateSupabaseConfig } from "@/lib/candidate-session";

type Authority = {
  authority_ref: string;
  authority_name: string;
  authority_type: string;
  base_url: string;
  sector_scope?: string[];
  active: boolean;
  confidence_band: string;
};
type Observation = {
  observation_ref: string;
  authority_ref: string | null;
  source_url: string;
  source_title: string;
  sector: string;
  observed_claim: string;
  source_confidence: string;
  observation_status: string;
  observed_at: string;
  last_checked_at: string | null;
  stale_after: string | null;
  evidence_refs: string[];
  review_reason: string | null;
  authority: Authority | null;
};
type Review = {
  review_ref: string;
  target_type: string;
  target_ref: string;
  review_status: string;
  source_confidence_before: string;
  source_confidence_after: string | null;
  review_reason: string;
  decision_notes: string | null;
  evidence_refs: string[];
  created_at: string;
  reviewed_at: string | null;
};
type IngestionRun = {
  run_ref: string;
  status: string;
  sources_checked: number;
  sources_succeeded: number;
  observations_created: number;
  observations_updated: number;
  observations_skipped: number;
  started_at: string;
  finished_at: string | null;
};
type QueueResponse = {
  status?: string;
  mode?: string;
  count?: number;
  observations?: Observation[];
  recent_reviews?: Review[];
  recent_runs?: IngestionRun[];
  message?: string;
  reason?: string;
  code?: string;
};
type ReviewDecision = "APPROVE_OFFICIAL_SOURCE" | "REJECT_SOURCE" | "MARK_SOURCE_STALE";
type FormValue = {
  reviewReason: string;
  decisionNotes: string;
  evidenceText: string;
  attestedOfficial: boolean;
};
type DecisionResponse = {
  status?: string;
  ok?: boolean;
  observation_ref?: string;
  review_ref?: string;
  message?: string;
  code?: string;
  reason?: string;
};

function session() {
  const config = getCandidateSupabaseConfig();
  const token = getCandidateAccessToken();
  if (!config || !token) throw new Error("Sign in with an active Kingsmen account before opening the source review queue.");
  return { ...config, token };
}

function formFor(observation: Observation): FormValue {
  const refs = [...new Set([observation.source_url, ...(observation.evidence_refs ?? [])].filter(Boolean))];
  return {
    reviewReason: "",
    decisionNotes: "",
    evidenceText: refs.join("\n"),
    attestedOfficial: false
  };
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not recorded" : parsed.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export default function N15SourceReviewConsole() {
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [forms, setForms] = useState<Record<string, FormValue>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<ReviewDecision | null>(null);
  const observations = queue?.observations ?? [];
  const reviews = queue?.recent_reviews ?? [];
  const runs = queue?.recent_runs ?? [];

  const loadQueue = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setLoadError("");
    try {
      const auth = session();
      const response = await fetch(`${auth.url}/functions/v1/n15-source-review-queue`, {
        method: "GET",
        headers: { apikey: auth.anonKey, Authorization: `Bearer ${auth.token}` },
        cache: "no-store"
      });
      let body: QueueResponse = {};
      try { body = await response.json() as QueueResponse; } catch {}
      if (!response.ok || body.status !== "OK") {
        const detail = body.message || body.reason || body.code || (response.status === 403
          ? "An active, authorised platform reviewer role is required."
          : `Source review queue could not be loaded (${response.status}).`);
        throw new Error(detail);
      }
      const nextObservations = body.observations ?? [];
      setQueue(body);
      setForms(current => {
        const next: Record<string, FormValue> = {};
        for (const item of nextObservations) next[item.observation_ref] = current[item.observation_ref] ?? formFor(item);
        return next;
      });
    } catch (error) {
      // Fail closed: never leave cached review controls visible after a failed or revoked authorization check.
      setQueue(null);
      setForms({});
      setLoadError(error instanceof Error ? error.message : "Source review queue could not be loaded.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadQueue(true); }, [loadQueue]);

  const reviewReady = useMemo(() => observations.filter(item =>
    item.observation_status === "NEEDS_REVIEW" || item.observation_status === "STALE"
  ).length, [observations]);

  function updateForm(ref: string, patch: Partial<FormValue>) {
    setForms(current => ({
      ...current,
      [ref]: { ...(current[ref] ?? { reviewReason: "", decisionNotes: "", evidenceText: "", attestedOfficial: false }), ...patch }
    }));
  }

  async function decide(observation: Observation, decision: ReviewDecision) {
    const form = forms[observation.observation_ref] ?? formFor(observation);
    const evidenceRefs = [...new Set(form.evidenceText.split(/\r?\n/).map(value => value.trim()).filter(Boolean))];
    if (form.reviewReason.trim().length < 5) {
      setLoadError("Enter a review reason of at least five characters before recording a decision.");
      return;
    }
    if (evidenceRefs.length < 1 || evidenceRefs.length > 12) {
      setLoadError("Provide between one and twelve HTTPS evidence URLs, one per line.");
      return;
    }
    if (decision === "APPROVE_OFFICIAL_SOURCE" && !form.attestedOfficial) {
      setLoadError("Confirm that you inspected the official source before approving its authenticity.");
      return;
    }
    setLoadError("");
    setNotice("");
    setBusyRef(observation.observation_ref);
    setBusyAction(decision);
    try {
      const auth = session();
      const response = await fetch(`${auth.url}/functions/v1/n15-source-review-decision`, {
        method: "POST",
        headers: {
          apikey: auth.anonKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          observation_ref: observation.observation_ref,
          decision,
          review_reason: form.reviewReason.trim(),
          decision_notes: form.decisionNotes.trim(),
          evidence_refs: evidenceRefs,
          reviewed_official_source: decision === "APPROVE_OFFICIAL_SOURCE" && form.attestedOfficial
        }),
        cache: "no-store"
      });
      let body: DecisionResponse = {};
      try { body = await response.json() as DecisionResponse; } catch {}
      if (!response.ok || body.status !== "OK") {
        throw new Error(body.message || body.code || body.reason || `Decision was not recorded (${response.status}).`);
      }
      setNotice(body.message || "Source review decision recorded. Programme publication remains a separate gate.");
      await loadQueue(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Source review decision was not confirmed.");
    } finally {
      setBusyRef(null);
      setBusyAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">FOUNDER CONTROL PLANE</span></span>
          </a>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-200" aria-label="Founder navigation">
            <a href="/founder/control-plane/" className="hover:text-amber-200">Control plane</a>
            <a href="/founder/analytics/" className="hover:text-amber-200">Analytics</a>
            <a href="/candidate/dashboard/" className="hover:text-amber-200">Candidate portal</a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700">N15 · Source verification</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Opportunity source review</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Inspect discovered official-source links, record a human decision and retain evidence. Approving source authenticity does not open an opportunity, verify a closing date, approve eligibility or publish a candidate match.
          </p>
        </header>

        {loadError ? <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{loadError}</p> : null}
        {notice ? <p role="status" aria-live="polite" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{notice}</p> : null}

        {loading ? <section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-600">Checking reviewer permission and loading source observations…</p></section> : null}

        {!loading && queue ? (
          <>
            <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Source review counts">
              <div className="rounded-xl border border-slate-200 bg-white p-4"><strong className="block text-2xl">{queue.count ?? observations.length}</strong><span className="text-xs text-slate-600">Waiting / stale sources</span></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><strong className="block text-2xl">{reviews.length}</strong><span className="text-xs text-slate-600">Recent review decisions</span></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><strong className="block text-2xl">{runs.length}</strong><span className="text-xs text-slate-600">Recent ingestion runs</span></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><strong className="block text-sm">Human review only</strong><span className="mt-1 block text-xs leading-5 text-slate-700">No listing is auto-published by this page.</span></div>
            </section>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">Review queue <span className="text-sm font-semibold text-slate-500">({reviewReady})</span></h2>
              <button type="button" onClick={() => void loadQueue(false)} disabled={busyRef !== null} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold hover:border-slate-500 disabled:opacity-50">Refresh queue</button>
            </div>

            {observations.length === 0 ? (
              <section className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8">
                <h3 className="text-lg font-bold">No observations awaiting review</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This means the review queue returned no NEEDS_REVIEW or STALE observations. It does not mean there are no available opportunities. The ingestion job may be empty or unable to reach some sources.</p>
              </section>
            ) : (
              <section className="mb-9 space-y-5" aria-label="Source observations to review">
                {observations.map(item => {
                  const form = forms[item.observation_ref] ?? formFor(item);
                  const approvalAvailable = Boolean(item.authority?.active && ["HIGH", "OFFICIAL_VERIFIED"].includes(item.authority.confidence_band));
                  const disabled = busyRef !== null;
                  return (
                    <article key={item.observation_ref} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">{item.sector} · {item.observation_status.replaceAll("_", " ")}</p>
                          <h3 className="mt-2 break-words text-lg font-bold">{item.source_title}</h3>
                          <p className="mt-1 text-xs text-slate-500">Observation {item.observation_ref} · Confidence {item.source_confidence}</p>
                        </div>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">Observed {dateLabel(item.observed_at)}</span>
                      </div>

                      <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.observed_claim}</p>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold">Discovered source</h4>
                          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-sm font-semibold text-blue-800 underline">{item.source_url}</a>
                          <p className="mt-2 text-xs leading-5 text-slate-500">Last checked {dateLabel(item.last_checked_at)} · Stale after {dateLabel(item.stale_after)}</p>
                        </div>
                        <div className="min-w-0 rounded-xl border border-slate-200 p-4">
                          <h4 className="text-sm font-bold">Authority record</h4>
                          {item.authority ? (
                            <>
                              <p className="mt-1 text-sm">{item.authority.authority_name}</p>
                              <p className="mt-1 break-all text-xs text-slate-600">{item.authority.base_url}</p>
                              <p className="mt-2 text-xs text-slate-600">Type {item.authority.authority_type} · {item.authority.confidence_band} · {item.authority.active ? "active" : "inactive"}</p>
                              {item.authority.sector_scope?.length ? <p className="mt-1 text-xs text-slate-500">Scope: {item.authority.sector_scope.join(", ")}</p> : null}
                            </>
                          ) : <p className="mt-1 text-sm leading-6 text-amber-800">No matching source-authority record was returned. Approving this source is blocked until the authority record is corrected.</p>}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-semibold">
                          Review reason
                          <textarea value={form.reviewReason} onChange={event => updateForm(item.observation_ref, { reviewReason: event.target.value })} minLength={5} maxLength={1200} rows={3} placeholder="State what you verified, rejected or marked stale." className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                        </label>
                        <label className="block text-sm font-semibold">
                          Decision notes (optional)
                          <textarea value={form.decisionNotes} onChange={event => updateForm(item.observation_ref, { decisionNotes: event.target.value })} maxLength={2000} rows={3} placeholder="Add concise notes for the audit trail." className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                        </label>
                      </div>

                      <label className="mt-4 block text-sm font-semibold">
                        Evidence URLs (HTTPS; one per line; maximum 12)
                        <textarea value={form.evidenceText} onChange={event => updateForm(item.observation_ref, { evidenceText: event.target.value })} rows={3} maxLength={12000} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-mono text-xs font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                      </label>

                      {approvalAvailable ? (
                        <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6">
                          <input type="checkbox" checked={form.attestedOfficial} onChange={event => updateForm(item.observation_ref, { attestedOfficial: event.target.checked })} className="mt-1 h-4 w-4 accent-amber-600" />
                          <span>I inspected this page and confirm its source authenticity only. I am not confirming that the opportunity is open, that its deadline is verified, that eligibility is satisfied, or that a provider has received an application.</span>
                        </label>
                      ) : null}

                      {!approvalAvailable ? <p className="mt-3 text-sm leading-6 text-amber-800">Official-source approval is disabled because the authority is missing, inactive or below HIGH confidence.</p> : null}

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void decide(item, "APPROVE_OFFICIAL_SOURCE")} disabled={disabled || !approvalAvailable || !form.attestedOfficial} className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{busyRef === item.observation_ref && busyAction === "APPROVE_OFFICIAL_SOURCE" ? "Recording…" : "Approve official source"}</button>
                        <button type="button" onClick={() => void decide(item, "REJECT_SOURCE")} disabled={disabled} className="inline-flex min-h-10 items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-800 disabled:cursor-not-allowed disabled:opacity-45">{busyRef === item.observation_ref && busyAction === "REJECT_SOURCE" ? "Recording…" : "Reject source"}</button>
                        <button type="button" onClick={() => void decide(item, "MARK_SOURCE_STALE")} disabled={disabled} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-45">{busyRef === item.observation_ref && busyAction === "MARK_SOURCE_STALE" ? "Recording…" : "Mark source stale"}</button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}

            <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">Recent ingestion runs</h2>
              {runs.length === 0 ? <p className="mt-2 text-sm text-slate-600">No ingestion runs are recorded yet.</p> : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-2">Run</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Sources</th><th className="px-3 py-2">New / updated</th><th className="px-3 py-2">Started</th></tr></thead>
                    <tbody>{runs.map(run => <tr key={run.run_ref} className="border-b border-slate-100"><td className="px-3 py-2 font-mono text-xs">{run.run_ref}</td><td className="px-3 py-2">{run.status}</td><td className="px-3 py-2">{run.sources_succeeded}/{run.sources_checked}</td><td className="px-3 py-2">{run.observations_created}/{run.observations_updated}</td><td className="px-3 py-2">{dateLabel(run.started_at)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">Recent source review decisions</h2>
              {reviews.length === 0 ? <p className="mt-2 text-sm text-slate-600">No source decisions are recorded yet.</p> : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-2">Decision</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Confidence</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Reviewed</th></tr></thead>
                    <tbody>{reviews.map(review => <tr key={review.review_ref} className="border-b border-slate-100 align-top"><td className="px-3 py-2 font-bold">{review.review_status}</td><td className="px-3 py-2 font-mono text-xs">{review.target_ref}</td><td className="px-3 py-2">{review.source_confidence_before} → {review.source_confidence_after || "—"}</td><td className="max-w-sm px-3 py-2 text-xs leading-5">{review.review_reason}</td><td className="px-3 py-2 text-xs">{dateLabel(review.reviewed_at)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="mt-7 rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm leading-6 text-slate-700">
              Source authenticity is one gate. Programme opening status, confirmed deadline, evidenced eligibility, verified fees, provider safety, candidate matching and publication are separate records and separate approvals. This console never submits an application to a provider.
            </aside>
          </>
        ) : null}
      </div>
    </main>
  );
}
