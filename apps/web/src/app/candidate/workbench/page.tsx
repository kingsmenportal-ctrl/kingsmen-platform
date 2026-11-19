"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getKingsmenSupabaseAccessToken,
  getKingsmenSupabaseBrowserConfig
} from "../../../lib/kingsmen/supabase-session";

const PATHWAYS = [
  ["HIGHER_EDUCATION", "Higher Education"],
  ["TVET", "TVET"],
  ["SETA_LEARNERSHIP", "SETA Programmes & Learnerships"],
  ["INTERNSHIP", "Internships"],
  ["APPRENTICESHIP", "Apprenticeships"],
  ["EMPLOYMENT", "Employment"]
] as const;

const FEED_TO_APPLICATION_PATHWAY: Record<string, string> = {
  HIGHER_EDUCATION: "HIGHER_EDUCATION",
  TVET: "TVET",
  SETA_LEARNERSHIPS: "SETA_LEARNERSHIP",
  INTERNSHIPS: "INTERNSHIP",
  APPRENTICESHIPS: "APPRENTICESHIP",
  EMPLOYMENT: "EMPLOYMENT"
};

type ProfileResponse = {
  ok?: boolean;
  profile?: Record<string, unknown>;
  identityStatus?: string;
  persistence?: string;
  consent?: { status?: string };
  message?: string;
  code?: string;
  error?: string;
};

type Opportunity = {
  match_ref: string;
  title: string;
  provider: string;
  sector: string;
  pathways: string[];
  location?: string | null;
  source_checked_at: string;
  deadline: { closes_at?: string | null; message?: string; status?: string };
  eligibility: { status?: string; rules?: string };
  recommendation_summary: string;
};

type FeedResponse = {
  status?: string;
  count?: number;
  opportunities?: Opportunity[];
  message?: string;
  empty_reason?: string;
};

type Target = {
  id: string;
  target_key: string;
  pathway_type: string;
  provider_name: string;
  programme_or_role: string;
  planning_status: string;
  source_confidence: string;
  application_id: string | null;
  created_at: string;
  updated_at: string;
};

type ApplicationEvent = {
  id: string;
  event_type: "PROFILE_SAVED" | "TARGETS_PLANNED";
  details: Record<string, unknown>;
  created_at: string;
};

type PlanResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  status?: string;
  count?: number;
  targets?: Target[];
  events?: ApplicationEvent[];
  target?: Target;
  created?: boolean;
  provider_submission_sent?: boolean;
};

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const config = getKingsmenSupabaseBrowserConfig();
  const token = await getKingsmenSupabaseAccessToken();
  if (!config) throw new Error("Kingsmen services are not configured for this deployment.");
  if (!token) throw new Error("Sign in to Kingsmen first. No session for the configured Supabase project was found.");
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });
  const data = await response.json().catch(() => null) as T | null;
  if (!response.ok || !data || (typeof data === "object" && "ok" in data && (data as { ok?: boolean }).ok === false)) {
    const errorBody = data as { error?: string; code?: string } | null;
    throw new Error(errorBody?.error || errorBody?.code || `Kingsmen request failed (${response.status}).`);
  }
  return data;
}

async function callProfile(): Promise<ProfileResponse> {
  return requestJson<ProfileResponse>("/functions/v1/candidate-master-profile", {
    method: "POST",
    body: JSON.stringify({ action: "load" })
  });
}

async function callPlan(payload: Record<string, unknown>): Promise<PlanResponse> {
  return requestJson<PlanResponse>("/functions/v1/candidate-master-applications", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function callVerifiedMatches(): Promise<FeedResponse> {
  return requestJson<FeedResponse>("/functions/v1/n15-candidate-opportunities", {
    method: "GET"
  });
}

function pathwayLabel(value: string): string {
  return PATHWAYS.find(([pathway]) => pathway === value)?.[1] ?? value;
}

function applicationPathways(item: Opportunity): string[] {
  return Array.from(new Set(item.pathways
    .map(pathway => FEED_TO_APPLICATION_PATHWAY[pathway])
    .filter((pathway): pathway is string => typeof pathway === "string")));
}

function displayDate(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

export default function CandidateWorkbenchPage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const ready = profile?.identityStatus === "VERIFIED" && profile?.consent?.status === "ACTIVE";

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await callProfile();
      setProfile(result);
      if (result.identityStatus === "VERIFIED" && result.consent?.status === "ACTIVE") {
        const [plan, timeline] = await Promise.all([
          callPlan({ action: "list_targets" }),
          callPlan({ action: "list_events" })
        ]);
        setTargets(plan.targets ?? []);
        setEvents(timeline.events ?? []);
      } else {
        setTargets([]);
        setEvents([]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The application plan could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkbench();
  }, [loadWorkbench]);

  async function loadMatches() {
    setLoadingMatches(true);
    setError("");
    setMessage("");
    setFeed(null);
    try {
      if (!ready) throw new Error("Complete your profile, keep consent active and finish identity verification before loading application matches.");
      const nextFeed = await callVerifiedMatches();
      if (nextFeed.status === "IDENTITY_REVIEW_REQUIRED") {
        throw new Error(nextFeed.message || "Identity review is required before matches can be loaded.");
      }
      setFeed(nextFeed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Verified matches could not be loaded.");
    } finally {
      setLoadingMatches(false);
    }
  }

  async function addToPlan(item: Opportunity, pathwayType: string) {
    const key = `${item.match_ref}:${pathwayType}`;
    setBusyKey(key);
    setError("");
    setMessage("");
    try {
      const result = await callPlan({ action: "create_draft", matchRef: item.match_ref, pathwayType });
      await loadWorkbench();
      setMessage(result.created
        ? "Saved to your Kingsmen application plan. No application was sent to the provider."
        : "This verified match is already in your Kingsmen application plan.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This match could not be saved to your plan.");
    } finally {
      setBusyKey("");
    }
  }

  const compatiblePathways = (item: Opportunity) => applicationPathways(item);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">KINGSMEN PORTAL · UNIFIED APPLICATION ENGINE</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">One plan for all six pathways</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Add current, evidence-backed Kingsmen matches to your application plan. Your saved targets remain inside Kingsmen. This step creates a planning record only; it does not submit an application or claim a provider outcome.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/candidate/profile" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Candidate profile</a>
          <a href="/candidate/dashboard" className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-200">Candidate dashboard</a>
          <button type="button" onClick={() => void loadWorkbench()} disabled={loading}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {loading ? "Refreshing…" : "Refresh my plan"}
          </button>
        </div>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</section>}
      {message && <section role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</section>}
      {loading && <section role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading your saved Kingsmen profile and application plan…</section>}

      {!loading && profile && (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Application readiness gates">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Identity</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{(profile.identityStatus ?? "UNKNOWN").replaceAll("_", " ")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Profile consent</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{(profile.consent?.status ?? "NOT_RECORDED").replaceAll("_", " ")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Saved targets</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{targets.length}</p>
          </article>
        </section>
      )}

      {!loading && !ready && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-950">Applications remain locked until verification</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            {profile?.identityStatus === "NOT_PROVISIONED"
              ? "Save your profile and consent first. If Kingsmen requires identity review, an authorised reviewer must complete it before the application engine unlocks."
              : "Your saved profile may remain available while identity is reviewed, but application planning requires a verified candidate identity and active profile-processing consent."}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">My application plan</h2>
            <p className="mt-1 text-sm text-slate-600">Saved targets are internal planning records, not submitted applications.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{targets.length} target(s)</span>
        </div>
        {targets.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            {ready ? "No application targets are saved yet. Load your verified matches below to add an opportunity." : "Your saved targets will appear here after identity verification and active consent."}
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Pathway</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Programme / role</th><th className="px-3 py-3">Kingsmen state</th>
              </tr></thead>
              <tbody>
                {targets.map(target => (
                  <tr key={target.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 font-semibold text-slate-800">{pathwayLabel(target.pathway_type)}</td>
                    <td className="px-3 py-3 text-slate-700">{target.provider_name}</td>
                    <td className="px-3 py-3 text-slate-700">{target.programme_or_role}</td>
                    <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{target.application_id ? "Application draft linked" : target.planning_status.replaceAll("_", " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Verified Kingsmen matches</h2>
            <p className="mt-1 text-sm text-slate-600">Only current official-source matches with a confirmed future deadline can enter the application plan.</p>
          </div>
          <button type="button" onClick={() => void loadMatches()} disabled={!ready || loadingMatches}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {loadingMatches ? "Loading verified matches…" : "Load verified matches"}
          </button>
        </div>
        {feed?.status === "OK" && (feed.opportunities?.length ?? 0) === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{feed.empty_reason || "No matches passed the current verification gates."} Kingsmen will not fill this list with stale or unreviewed listings.</p>
        )}
        {feed?.status === "OK" && (feed.opportunities?.length ?? 0) > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(feed.opportunities ?? []).map(item => (
              <article key={item.match_ref} className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.provider}{item.location ? " · " + item.location : ""}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.recommendation_summary}</p>
                <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div><dt className="inline font-semibold text-slate-800">Source checked: </dt><dd className="inline">{displayDate(item.source_checked_at)}</dd></div>
                  <div><dt className="inline font-semibold text-slate-800">Deadline: </dt><dd className="inline">{item.deadline.closes_at ? displayDate(item.deadline.closes_at) : "Not confirmed"}</dd></div>
                  <div><dt className="inline font-semibold text-slate-800">Eligibility: </dt><dd className="inline">Candidate-specific review required; not guaranteed.</dd></div>
                </dl>
                {compatiblePathways(item).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {compatiblePathways(item).map(pathway => {
                      const key = `${item.match_ref}:${pathway}`;
                      return (
                        <button key={pathway} type="button" onClick={() => void addToPlan(item, pathway)}
                          disabled={!ready || busyKey === key}
                          className="rounded-lg border border-amber-500 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 disabled:cursor-not-allowed disabled:opacity-40">
                          {busyKey === key ? "Saving…" : `Add ${pathwayLabel(pathway)} to plan`}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-500">Adding a match creates an internal planning record only. It does not submit an application to the provider.</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950">My Kingsmen activity</h2>
            <p className="mt-1 text-sm text-slate-600">A persisted timeline of internal planning events, loaded from your candidate-scoped records.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{events.length} event(s)</span>
        </div>
        {events.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No recorded application-planning events yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {events.map(event => (
              <li key={event.id} className="flex gap-3 rounded-xl border border-slate-100 p-4">
                <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{event.event_type === "TARGETS_PLANNED" ? "Opportunity added to application plan" : "Candidate profile saved"}</p>
                  <p className="mt-1 text-xs text-slate-500">{displayDate(event.created_at)}</p>
                  {typeof event.details.programme_or_role === "string" && (
                    <p className="mt-1 text-sm text-slate-700">{event.details.programme_or_role}{typeof event.details.provider_name === "string" ? " · " + event.details.provider_name : ""}</p>
                  )}
                  {typeof event.details.pathway_type === "string" && <p className="mt-1 text-xs text-slate-500">{pathwayLabel(event.details.pathway_type)}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-slate-300">
        <h2 className="font-bold text-white">Application integrity</h2>
        <p className="mt-2">Source verification is time-bound. An application target becomes a prepared draft only after the server-side readiness and pathway checks pass. Candidate-reported submission, provider-confirmed receipt and provider outcomes remain separate states.</p>
        <p className="mt-2">CAO stays one Kingsmen parent application; programme choices are managed as child choices. This planning slice does not count each choice as a separate Kingsmen application, and it sends no data to a provider.</p>
      </section>
    </main>
  );
}
