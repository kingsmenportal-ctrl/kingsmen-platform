"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getKingsmenSupabaseAccessToken,
  getKingsmenSupabaseBrowserConfig
} from "../../../../lib/kingsmen/supabase-session";

type Authority = {
  authority_ref: string;
  authority_name: string;
  authority_type: string;
  base_url: string;
  active: boolean;
  confidence_band: string;
  sector_scope: string[];
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

type ReviewRecord = {
  review_ref: string;
  target_type: string;
  target_ref: string;
  review_status: string;
  review_reason: string;
  decision_notes: string | null;
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
  recent_reviews?: ReviewRecord[];
  recent_runs?: IngestionRun[];
  safety?: Record<string, boolean | number>;
  reason?: string;
  message?: string;
};

function displayDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

export default function N15SourceReviewQueuePage() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const config = getKingsmenSupabaseBrowserConfig();
      const token = await getKingsmenSupabaseAccessToken();
      if (!config) throw new Error("Kingsmen source review is not configured for this deployment.");
      if (!token) throw new Error("Sign in with an authorised Kingsmen reviewer account first.");
      const response = await fetch(config.url + "/functions/v1/n15-source-review-queue", {
        method: "GET",
        headers: { apikey: config.anonKey, Authorization: "Bearer " + token },
        cache: "no-store"
      });
      const body = await response.json().catch(() => null) as QueueResponse | null;
      if (!response.ok || !body || body.status !== "OK") {
        throw new Error(body?.message || body?.reason || body?.status || "The source review queue could not be loaded (" + response.status + ").");
      }
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The source review queue could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">KINGSMEN · N15 SOURCE REVIEW</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Official source observations</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Review source-discovery evidence before any programme can be considered for the verified catalogue. This page is read-only: it cannot approve or reject a source, create programme records, confirm deadlines, or publish an opportunity.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/operator/opportunities/ingestion" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Source ingestion</a>
          <button type="button" onClick={() => { setRefreshing(true); void loadQueue(); }} disabled={loading || refreshing}
            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
            {loading || refreshing ? "Refreshing…" : "Refresh review queue"}
          </button>
        </div>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">{error}</section>}
      {loading && <section role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Checking reviewer authorisation and loading source observations…</section>}
      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Observations awaiting review</p><p className="mt-2 text-2xl font-black text-slate-950">{data.count ?? 0}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Recent scan runs</p><p className="mt-2 text-2xl font-black text-slate-950">{data.recent_runs?.length ?? 0}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Recent source reviews</p><p className="mt-2 text-2xl font-black text-slate-950">{data.recent_reviews?.length ?? 0}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Publishing from this page</p><p className="mt-2 text-lg font-black text-slate-950">Disabled</p></article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-slate-950">Observation queue</h2>
            <p className="mt-1 text-sm text-slate-600">A source observation means the scanner found an on-domain link. It does not establish that a programme is open.</p>
            {!(data.observations?.length) ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">There are no NEEDS_REVIEW or STALE observations yet. An authorised reviewer must run N15 ingestion before discovered links appear here.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.observations.map(item => {
                  const officialHref = /^https:\/\//i.test(item.source_url) ? item.source_url : null;
                  return (
                    <article key={item.observation_ref} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.sector.replaceAll("_", " ")} · {item.observation_status.replaceAll("_", " ")}</p>
                          <h3 className="mt-1 text-lg font-bold text-slate-950">{item.source_title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.authority?.authority_name ?? item.authority_ref ?? "Unknown authority"}</p>
                        </div>
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950">Human review required</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{item.observed_claim}</p>
                      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <div><dt className="inline font-semibold text-slate-800">Observed: </dt><dd className="inline">{displayDate(item.observed_at)}</dd></div>
                        <div><dt className="inline font-semibold text-slate-800">Last checked: </dt><dd className="inline">{displayDate(item.last_checked_at)}</dd></div>
                        <div><dt className="inline font-semibold text-slate-800">Stale after: </dt><dd className="inline">{displayDate(item.stale_after)}</dd></div>
                        <div><dt className="inline font-semibold text-slate-800">Confidence: </dt><dd className="inline">{item.source_confidence}</dd></div>
                      </dl>
                      <p className="mt-3 break-all text-xs text-slate-500">Observation ref: {item.observation_ref}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {officialHref && <a href={officialHref} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50">Open official source</a>}
                        {item.evidence_refs.map(reference => /^https:\/\//i.test(reference) ? <a key={reference} href={reference} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View evidence page</a> : null)}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-slate-950">Recent scan runs</h2>
            <div className="mt-3 space-y-3">
              {(data.recent_runs ?? []).map(run => (
                <article key={run.run_ref} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                  <div><p className="font-semibold text-slate-950">{run.run_ref}</p><p className="mt-1 text-xs text-slate-600">{displayDate(run.started_at)} · {run.sources_succeeded}/{run.sources_checked} sources succeeded</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{run.status}</span>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-slate-300">
            <h2 className="font-bold text-white">Release boundary</h2>
            <p className="mt-2">A source link must be manually reviewed before it can become an official evidence anchor. A separate decision must then confirm programme opening status, precise deadline, eligibility and submission requirements. The application engine will reject stale sources, missing evidence or unconfirmed deadlines.</p>
            <p className="mt-2">This queue makes no changes. It does not mark observations VERIFIED, create providers/programmes/deadlines, or publish candidate-facing opportunities.</p>
          </aside>
        </>
      )}
    </main>
  );
}
