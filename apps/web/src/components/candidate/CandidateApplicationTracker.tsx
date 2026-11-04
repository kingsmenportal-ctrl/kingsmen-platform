"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Session = { url: string; anonKey: string; token: string };
type ParentApplication = {
  id: string;
  application_ref?: string | null;
  pathway_type: string;
  status: string;
  readiness_status?: string | null;
  readiness_snapshot?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};
type ApplicationEvent = {
  application_id: string;
  event_type: string;
  from_status?: string | null;
  to_status?: string | null;
  reason_code?: string | null;
  evidence_ref?: string | null;
  created_at: string;
};
type SavedOpportunity = {
  title?: string;
  organisation?: string;
  official_url?: string;
  pathway?: string;
  closing_date?: string | null;
};
type PreparationTracker = {
  id: string;
  status: string;
  candidate_note?: string | null;
  evidence_reference?: string | null;
  created_at?: string;
  updated_at?: string;
  candidate_workspace_saved_opportunities?: SavedOpportunity | SavedOpportunity[] | null;
};
type PreparationItem = {
  id: string;
  tracker_id: string;
  item_type: string;
  title: string;
  status: string;
  candidate_note?: string | null;
  due_date?: string | null;
};
type LoadResult = {
  ready?: boolean;
  error?: string;
  message?: string;
  parentApplications?: ParentApplication[];
  applicationEvents?: ApplicationEvent[];
  trackers?: PreparationTracker[];
  items?: PreparationItem[];
};

function readSession(): Session {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Candidate application services are not configured for this deployment.");

  let raw: string | null = null;
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
  } catch {
    throw new Error("The signed-in browser session could not be read. Sign in again.");
  }
  if (!raw) throw new Error("Sign in to view your Kingsmen application tracker.");

  let session: { access_token?: string; expires_at?: number };
  try {
    session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
  } catch {
    throw new Error("Your browser session could not be read. Sign in again.");
  }
  if (!session.access_token) throw new Error("Sign in to view your Kingsmen application tracker.");
  if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) {
    throw new Error("Your session has expired. Sign in again.");
  }
  return { url, anonKey, token: session.access_token };
}

async function loadCandidateApplications(): Promise<LoadResult> {
  const session = readSession();
  const response = await fetch(session.url + "/functions/v1/candidate-application-preparation", {
    method: "POST",
    headers: {
      apikey: session.anonKey,
      Authorization: "Bearer " + session.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "load" }),
    cache: "no-store"
  });

  let body: LoadResult = {};
  try {
    body = await response.json() as LoadResult;
  } catch {
    throw new Error("The application service returned an unreadable response.");
  }
  if (!response.ok || body.ready === false) {
    const message = body.error || body.message || (response.status === 403
      ? "Your candidate identity must be verified by an authorised reviewer before application records can be shown."
      : "Your application records could not be loaded.");
    throw new Error(message);
  }
  return body;
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

function label(value?: string | null): string {
  return value ? value.replaceAll("_", " ") : "Not recorded";
}

function savedOpportunity(tracker: PreparationTracker): SavedOpportunity | null {
  const value = tracker.candidate_workspace_saved_opportunities;
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default function CandidateApplicationTracker() {
  const [data, setData] = useState<LoadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const result = await loadCandidateApplications();
      setData(result);
    } catch (caught) {
      setData(null);
      setError(caught instanceof Error ? caught.message : "Application records could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const applications = data?.parentApplications ?? [];
  const trackers = data?.trackers ?? [];
  const itemsByTracker = useMemo(() => {
    const grouped = new Map<string, PreparationItem[]>();
    for (const item of data?.items ?? []) {
      grouped.set(item.tracker_id, [...(grouped.get(item.tracker_id) ?? []), item]);
    }
    return grouped;
  }, [data?.items]);
  const eventsByApplication = useMemo(() => {
    const grouped = new Map<string, ApplicationEvent[]>();
    for (const event of data?.applicationEvents ?? []) {
      grouped.set(event.application_id, [...(grouped.get(event.application_id) ?? []), event]);
    }
    return grouped;
  }, [data?.applicationEvents]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/candidate/dashboard" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">APPLICATION TRACKER</span></span>
          </Link>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <Link className="hover:text-amber-200" href="/candidate/dashboard">Dashboard</Link>
            <Link className="hover:text-amber-200" href="/candidate/workbench">Workbench</Link>
            <Link className="hover:text-amber-200" href="/candidate/documents">Documents</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Authenticated candidate records</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Application tracker</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">A read-only view of your Kingsmen parent applications, saved-route preparation records and recorded status events. These records are loaded through the verified candidate identity boundary.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/candidate/workbench" className="inline-flex min-h-10 items-center rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-100">Open application workbench</Link>
            <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60">{refreshing ? "Refreshing…" : "Refresh records"}</button>
          </div>
        </section>

        {error ? (
          <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5" role="status">
            <h2 className="font-bold text-amber-950">Application records unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/candidate/login" className="font-semibold text-slate-950 underline">Sign in</Link>
              <button type="button" onClick={() => void load()} className="font-semibold text-slate-950 underline">Try again</button>
            </div>
          </section>
        ) : null}

        {loading && !data ? <p className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading application records from the candidate service…</p> : null}

        {!loading && !error && applications.length === 0 && trackers.length === 0 ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold">No application records yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">When you save a verified opportunity or prepare a parent application, its Kingsmen record will appear here. No provider submission is implied by saving or preparing a draft.</p>
            <Link href="/candidate/opportunity-matches" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Discover opportunities</Link>
          </section>
        ) : null}

        {applications.length > 0 ? (
          <section className="mt-8" aria-labelledby="parent-applications-heading">
            <div className="mb-4"><h2 id="parent-applications-heading" className="text-xl font-bold">Kingsmen parent applications</h2><p className="mt-1 text-sm text-slate-600">Each card represents one Kingsmen parent application. CAO programme choices remain child records under their parent.</p></div>
            <div className="grid gap-4">
              {applications.map((application) => {
                const events = eventsByApplication.get(application.id) ?? [];
                return (
                  <article key={application.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">{label(application.pathway_type)}</p><h3 className="mt-2 text-lg font-bold">{application.application_ref || "Kingsmen application"}</h3></div>
                      <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold">{label(application.status)}</span>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div><dt className="text-xs uppercase tracking-wide text-slate-500">Readiness</dt><dd className="mt-1 font-semibold">{label(application.readiness_status)}</dd></div>
                      <div><dt className="text-xs uppercase tracking-wide text-slate-500">Created</dt><dd className="mt-1">{formatDate(application.created_at)}</dd></div>
                      <div><dt className="text-xs uppercase tracking-wide text-slate-500">Updated</dt><dd className="mt-1">{formatDate(application.updated_at)}</dd></div>
                    </dl>
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <h4 className="text-sm font-bold">Recorded application events</h4>
                      {events.length ? (
                        <ol className="mt-3 space-y-3">
                          {events.map((event, index) => (
                            <li key={event.event_type + event.created_at + index} className="border-l-2 border-amber-300 pl-3">
                              <p className="text-sm font-semibold">{label(event.event_type)}</p>
                              <p className="mt-1 text-xs text-slate-600">{event.from_status ? label(event.from_status) + " → " : ""}{label(event.to_status)}{event.reason_code ? " · " + label(event.reason_code) : ""}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatDate(event.created_at)}</p>
                              {event.evidence_ref ? <p className="mt-1 break-all text-xs text-slate-500">Evidence reference: {event.evidence_ref}</p> : null}
                            </li>
                          ))}
                        </ol>
                      ) : <p className="mt-2 text-sm text-slate-600">No application event has been recorded yet.</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {trackers.length > 0 ? (
          <section className="mt-8" aria-labelledby="preparation-trackers-heading">
            <div className="mb-4"><h2 id="preparation-trackers-heading" className="text-xl font-bold">Saved-route preparation</h2><p className="mt-1 text-sm text-slate-600">These are candidate preparation records, not provider-confirmed submissions.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              {trackers.map((tracker) => {
                const opportunity = savedOpportunity(tracker);
                const items = itemsByTracker.get(tracker.id) ?? [];
                return (
                  <article key={tracker.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-bold">{opportunity?.title || "Saved opportunity preparation"}</h3><span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold">{label(tracker.status)}</span></div>
                    <p className="mt-1 text-sm text-slate-600">{opportunity?.organisation || "Provider not recorded"}</p>
                    {tracker.candidate_note ? <p className="mt-3 text-sm leading-6 text-slate-700">{tracker.candidate_note}</p> : null}
                    {tracker.evidence_reference ? <p className="mt-2 break-all text-xs text-slate-500">Reference: {tracker.evidence_reference}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">Last updated: {formatDate(tracker.updated_at)}</p>
                    {items.length ? <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">{items.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 text-sm"><span>{item.title}</span><span className="shrink-0 text-xs font-semibold text-slate-600">{label(item.status)}</span></li>)}</ul> : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <aside className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="evidence-boundary-heading">
          <h2 id="evidence-boundary-heading" className="font-bold">Evidence and status boundaries</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">A saved opportunity, preparation tracker or DRAFT is not a provider submission. Candidate-reported progress is separate from a provider-confirmed receipt. The Kingsmen backend only records SUBMITTED_CONFIRMED after the authorised review path verifies provider-origin receipt evidence. Provider decisions and final outcomes require their own evidence and reviewer controls. No admission, funding, placement, employment or success is guaranteed.</p>
        </aside>
      </div>
    </main>
  );
}
