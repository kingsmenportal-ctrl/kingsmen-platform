"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Session = { url: string; anonKey: string; token: string };
type Target = {
  id: string;
  target_key: string;
  pathway_type: string;
  provider_name: string;
  programme_or_role: string;
  provider_application_url?: string | null;
  source_reference?: string | null;
  source_confidence?: string | null;
  planning_status?: string | null;
  application_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
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
type SavedRoute = {
  id?: string;
  title?: string;
  organisation?: string;
  official_url?: string;
  pathway?: string;
  closing_date?: string | null;
};
type Tracker = {
  id: string;
  saved_opportunity_id?: string;
  status: string;
  candidate_note?: string | null;
  evidence_reference?: string | null;
  created_at?: string;
  updated_at?: string;
  candidate_workspace_saved_opportunities?: SavedRoute | SavedRoute[] | null;
};
type PreparationItem = {
  id: string;
  tracker_id: string;
  item_type: "DOCUMENT" | "TASK" | string;
  title: string;
  candidate_note?: string | null;
  evidence_reference?: string | null;
  status: string;
  required_by_candidate?: boolean;
  due_date?: string | null;
};
type ApiResult = {
  ready?: boolean;
  code?: string;
  error?: string;
  message?: string;
  masterTargets?: Target[];
  parentApplications?: ParentApplication[];
  trackers?: Tracker[];
  items?: PreparationItem[];
};

const PATHWAY_LABELS: Record<string, string> = {
  HIGHER_EDUCATION: "Higher Education",
  TVET: "TVET",
  SETA_LEARNERSHIP: "SETA programmes & learnerships",
  INTERNSHIP: "Internships",
  APPRENTICESHIP: "Apprenticeships",
  EMPLOYMENT: "Employment",
  higher_education: "Higher Education",
  tvet: "TVET",
  seta_learnership: "SETA programmes & learnerships",
  internship: "Internships",
  apprenticeship: "Apprenticeships",
  employment: "Employment"
};

function readSession(): Session {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Candidate application services are not configured for this deployment.");
  const ref = new URL(url).hostname.split(".")[0];
  const storageKey = "sb-" + ref + "-auth-token";
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(storageKey); } catch {}
  if (!raw) throw new Error("Sign in to load your saved application records.");
  let session: { access_token?: string; expires_at?: number };
  try { session = JSON.parse(raw) as { access_token?: string; expires_at?: number }; }
  catch { throw new Error("Your browser session could not be read. Sign in again."); }
  if (!session.access_token) throw new Error("Sign in to load your saved application records.");
  if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) {
    throw new Error("Your session has expired. Sign in again.");
  }
  return { url, anonKey, token: session.access_token };
}

async function callPreparation(payload: Record<string, unknown>): Promise<ApiResult> {
  const session = readSession();
  const response = await fetch(session.url + "/functions/v1/candidate-application-preparation", {
    method: "POST",
    headers: {
      apikey: session.anonKey,
      Authorization: "Bearer " + session.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  let body: ApiResult = {};
  try { body = await response.json() as ApiResult; } catch {}
  if (!response.ok || body.ready === false) {
    const failure = new Error(body.error || body.message || body.code || "The application service did not confirm the request.") as Error & { code?: string };
    failure.code = body.code;
    throw failure;
  }
  return body;
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

function savedRoute(tracker: Tracker): SavedRoute | null {
  const route = tracker.candidate_workspace_saved_opportunities;
  return Array.isArray(route) ? route[0] ?? null : route ?? null;
}

export function CandidateApplicationWorkbench() {
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [notice, setNotice] = useState("");
  const [preparingTarget, setPreparingTarget] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    setErrorCode("");
    try {
      const result = await callPreparation({ action: "load" });
      setData(result);
      setNotice(result.message || "Saved application records loaded from the candidate service.");
    } catch (caught) {
      const failure = caught as Error & { code?: string };
      setError(failure.message || "Application records could not be loaded.");
      setErrorCode(failure.code || "");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const targets = data?.masterTargets ?? [];
  const applications = data?.parentApplications ?? [];
  const trackers = data?.trackers ?? [];
  const items = data?.items ?? [];
  const applicationById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications]
  );
  const itemsByTracker = useMemo(() => {
    const grouped = new Map<string, PreparationItem[]>();
    for (const item of items) grouped.set(item.tracker_id, [...(grouped.get(item.tracker_id) ?? []), item]);
    return grouped;
  }, [items]);

  async function prepareParentApplication(target: Target) {
    setPreparingTarget(target.target_key);
    setError("");
    setNotice("");
    try {
      const result = await callPreparation({
        action: "prepare_master_application",
        target_key: target.target_key
      });
      setNotice(result.message || "Parent application preparation was confirmed by the backend. No provider submission occurred.");
      await load(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The parent application could not be prepared.");
    } finally {
      setPreparingTarget(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="application-records-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Authenticated application service</p>
          <h2 id="application-records-heading" className="mt-2 text-xl font-bold text-slate-950">Saved routes and parent applications</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This panel reads application targets, preparation trackers and parent-application records from the authenticated Kingsmen service. Preparing a parent record does not submit anything to a university, college, employer or provider.</p>
        </div>
        <button type="button" onClick={() => void load(true)} disabled={loading || refreshing}
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-500 disabled:opacity-50">
          {loading || refreshing ? "Refreshing…" : "Refresh records"}
        </button>
      </div>

      {error ? (
        <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong className="block">{errorCode === "IDENTITY_NOT_VERIFIED" ? "Identity review required" : error.startsWith("Sign in") || error.startsWith("Your session") ? "Sign-in required" : "Application service needs attention"}</strong>
          <p className="mt-1">{error}</p>
          {errorCode === "IDENTITY_NOT_VERIFIED" ? <a href="/candidate/profile/" className="mt-3 inline-flex font-bold underline">Open candidate profile</a> : null}
          {error.startsWith("Sign in") || error.startsWith("Your session") ? <a href="/candidate/login/" className="mt-3 inline-flex font-bold underline">Sign in to Kingsmen</a> : null}
        </div>
      ) : null}
      {notice && !error && !loading ? <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">{notice}</p> : null}

      {loading ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Checking your candidate identity and loading saved records…</p> : null}

      {!loading && !error && data ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><strong className="block text-2xl text-slate-950">{targets.length}</strong><span className="text-xs text-slate-600">Saved application targets</span></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><strong className="block text-2xl text-slate-950">{applications.length}</strong><span className="text-xs text-slate-600">Parent application records</span></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><strong className="block text-2xl text-slate-950">{trackers.length}</strong><span className="text-xs text-slate-600">Preparation trackers</span></div>
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h3 className="text-lg font-bold text-slate-950">Your saved application targets</h3><p className="mt-1 text-xs leading-5 text-slate-500">Only records returned for your verified candidate identity are displayed.</p></div>
              <a href="/candidate/opportunity-matches/" className="text-sm font-bold text-amber-800 underline">Find verified opportunities</a>
            </div>
            {targets.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <h4 className="font-bold text-slate-900">No saved targets yet</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">Load your verified opportunity matches and save a route. Kingsmen will recheck current official-source evidence before accepting a save.</p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {targets.map((target) => {
                  const parent = target.application_id ? applicationById.get(target.application_id) : undefined;
                  const isPreparing = preparingTarget === target.target_key;
                  return (
                    <article key={target.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">{PATHWAY_LABELS[target.pathway_type] || target.pathway_type.replaceAll("_", " ")}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{target.planning_status || "SAVED"}</span>
                      </div>
                      <h4 className="mt-3 text-base font-bold text-slate-950">{target.programme_or_role}</h4>
                      <p className="mt-1 text-sm text-slate-600">{target.provider_name}</p>
                      <dl className="mt-3 grid gap-1 text-xs leading-5 text-slate-600">
                        <div><dt className="inline font-semibold text-slate-800">Source status: </dt><dd className="inline">{target.source_confidence || "Not recorded"}</dd></div>
                        <div><dt className="inline font-semibold text-slate-800">Last updated: </dt><dd className="inline">{formatDate(target.updated_at || target.created_at)}</dd></div>
                        {target.source_reference ? <div><dt className="inline font-semibold text-slate-800">Reference: </dt><dd className="inline break-all">{target.source_reference}</dd></div> : null}
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {target.provider_application_url && /^https:\/\//i.test(target.provider_application_url) ? <a href={target.provider_application_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800">Open official destination ↗</a> : null}
                        {parent ? (
                          <span className="inline-flex min-h-10 items-center rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">Parent record: {parent.application_ref || parent.status}</span>
                        ) : (
                          <button type="button" onClick={() => void prepareParentApplication(target)} disabled={!!preparingTarget}
                            className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">
                            {isPreparing ? "Preparing…" : "Prepare parent application"}
                          </button>
                        )}
                      </div>
                      {parent ? <p className="mt-2 text-xs leading-5 text-slate-500">Application state: {parent.status} · Readiness: {parent.readiness_status || "Not assessed"}. This is a Kingsmen preparation record, not provider receipt.</p> : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {trackers.length > 0 ? (
            <div className="mt-7">
              <h3 className="text-lg font-bold text-slate-950">Preparation trackers</h3>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {trackers.map((tracker) => {
                  const route = savedRoute(tracker);
                  const checklist = itemsByTracker.get(tracker.id) ?? [];
                  return (
                    <article key={tracker.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold text-slate-950">{route?.title || "Application preparation"}</h4><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-700">{tracker.status}</span></div>
                      <p className="mt-1 text-xs text-slate-600">{route?.organisation || "Provider not recorded"}</p>
                      <p className="mt-2 text-xs text-slate-500">Last updated: {formatDate(tracker.updated_at)}</p>
                      {checklist.length ? <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">{checklist.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 text-xs"><span className="min-w-0 text-slate-700">{item.title}</span><span className="shrink-0 font-bold text-slate-600">{item.status.replaceAll("_", " ")}</span></li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No preparation checklist items are recorded for this tracker yet.</p>}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Candidate-reported preparation and submission states are not provider-confirmed receipt or outcomes. One Kingsmen parent application may have multiple provider programme choices; each child choice does not count as a separate Kingsmen parent application.</p>
    </section>
  );
}
