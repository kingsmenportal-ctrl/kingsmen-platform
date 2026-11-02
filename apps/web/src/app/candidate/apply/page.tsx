"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidateAccessToken } from "../../../lib/candidate-session";

const PATHWAYS = [
  ["HIGHER_EDUCATION", "Higher education"],
  ["TVET", "TVET"],
  ["SETA_LEARNERSHIP", "SETA programmes & learnerships"],
  ["INTERNSHIP", "Internships"],
  ["APPRENTICESHIP", "Apprenticeships"],
  ["EMPLOYMENT", "Employment"]
] as const;

type MasterTarget = {
  id: string;
  target_key: string;
  pathway_type: string;
  provider_name: string;
  programme_or_role: string;
  planning_status: string;
  application_id: string | null;
  source_confidence: string;
  updated_at: string;
};

type ApiBody = {
  ready?: boolean;
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  masterTargets?: MasterTarget[];
  application?: Record<string, unknown>;
};

function explain(body: ApiBody): string {
  if (body.code && body.error) return body.code + ": " + body.error;
  return body.error || body.message || "The application request could not be completed.";
}

function pathwayLabel(value: string): string {
  return PATHWAYS.find(([key]) => key === value)?.[1] ?? value.replaceAll("_", " ");
}

async function requestJson(path: string, method: "GET" | "POST", payload?: Record<string, unknown>): Promise<ApiBody> {
  const token = getCandidateAccessToken();
  if (!token) throw new Error("AUTHENTICATION_REQUIRED: Sign in to open a Kingsmen application.");
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {})
    },
    ...(method === "POST" ? { body: JSON.stringify(payload ?? {}) } : {}),
    cache: "no-store"
  });
  const body = await response.json() as ApiBody;
  if (!response.ok || (body.ready !== true && body.ok !== true)) throw new Error(explain(body));
  return body;
}

export default function CandidateApplyPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<MasterTarget[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("ALL");
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredTargets = useMemo(
    () => targets.filter((target) => pathwayFilter === "ALL" || target.pathway_type === pathwayFilter),
    [targets, pathwayFilter]
  );
  const selectedTarget = useMemo(
    () => targets.find((target) => target.target_key === selectedTargetKey) ?? null,
    [targets, selectedTargetKey]
  );

  const loadTargets = useCallback(async () => {
    setLoadingTargets(true);
    setError("");
    try {
      const body = await requestJson("/api/candidate/applications", "GET");
      const loaded = Array.isArray(body.masterTargets) ? body.masterTargets : [];
      setTargets(loaded);
      setSelectedTargetKey((previous) =>
        loaded.some((item) => item.target_key === previous)
          ? previous
          : loaded.find((item) => item.application_id)?.target_key ?? loaded[0]?.target_key ?? ""
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saved application targets could not be loaded.");
    } finally {
      setLoadingTargets(false);
    }
  }, []);

  useEffect(() => { void loadTargets(); }, [loadTargets]);

  async function openSelectedTarget() {
    if (!selectedTarget) {
      setError("Save an eligible opportunity to your Kingsmen workspace before preparing its application.");
      return;
    }
    setOpening(true);
    setError("");
    setNotice("");
    try {
      let applicationId = selectedTarget.application_id;
      if (!applicationId) {
        const prepared = await requestJson("/api/candidate/applications", "POST", {
          action: "prepare_master_application",
          target_key: selectedTarget.target_key
        });
        const preparedApplication = prepared.application && typeof prepared.application === "object"
          ? prepared.application
          : {};
        applicationId = typeof preparedApplication.application_id === "string"
          ? preparedApplication.application_id
          : typeof preparedApplication.id === "string"
            ? preparedApplication.id
            : null;
        if (!applicationId) throw new Error("APPLICATION_PARENT_NOT_RETURNED: The preparation service did not return the Kingsmen parent application identifier.");
      }
      router.push("/candidate/applications/" + encodeURIComponent(applicationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The Kingsmen application could not be opened.");
      setOpening(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · Unified application</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">One application engine. Six pathways.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Select one of your saved Kingsmen opportunities. The same candidate-owned parent application and answer editor supports higher education, TVET, SETA programmes and learnerships, internships, apprenticeships and employment. Your reusable profile and Document Vault remain shared across pathways.
          </p>
          <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3 text-sm">
            <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
            <a href="/candidate/profile" className="rounded-xl border border-slate-700 px-4 py-2">My reusable profile</a>
            <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-2">Document Vault</a>
            <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-2">Application tracker</a>
            <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-2">Find opportunities</a>
          </nav>
        </header>

        {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100">
          <p>{error}</p>
          {(error.includes("AUTHENTICATION_REQUIRED") || error.includes("IDENTITY_NOT_VERIFIED") || error.includes("VERIFIED_CANDIDATE_IDENTITY_REQUIRED")) &&
            <a href="/candidate/login" className="mt-2 inline-block text-cyan-300 underline">Sign in / identity review</a>}
        </section>}
        {notice && <p role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</p>}

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Choose an opportunity</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                This list contains opportunities already saved to your Kingsmen workspace. The server rechecks candidate identity, consent, official-source freshness, eligibility and current opportunity status before creating a parent application.
              </p>
            </div>
            <button type="button" onClick={() => void loadTargets()} disabled={loadingTargets}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">
              {loadingTargets ? "Refreshing…" : "Refresh saved targets"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter by pathway">
            <button type="button" onClick={() => setPathwayFilter("ALL")}
              aria-pressed={pathwayFilter === "ALL"}
              className={"rounded-full px-3 py-2 text-xs font-bold " + (pathwayFilter === "ALL" ? "bg-cyan-300 text-slate-950" : "border border-slate-700 text-slate-200")}>All pathways</button>
            {PATHWAYS.map(([key, label]) => <button key={key} type="button" onClick={() => setPathwayFilter(key)}
              aria-pressed={pathwayFilter === key}
              className={"rounded-full px-3 py-2 text-xs font-bold " + (pathwayFilter === key ? "bg-cyan-300 text-slate-950" : "border border-slate-700 text-slate-200")}>{label}</button>)}
          </div>

          {loadingTargets && <p className="mt-5 text-sm text-slate-400">Loading saved Kingsmen opportunities…</p>}
          {!loadingTargets && filteredTargets.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5">
            <p className="font-semibold">No saved opportunities in this filter.</p>
            <p className="mt-1 text-sm text-slate-400">Find an eligible opportunity, save it to your workspace, then return here to prepare its application.</p>
            <a href="/candidate/opportunity-matches" className="mt-3 inline-block text-sm font-bold text-cyan-300 underline">Find opportunities</a>
          </div>}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredTargets.map((target) => <article key={target.target_key}
              className={"rounded-2xl border p-4 " + (selectedTargetKey === target.target_key ? "border-cyan-600 bg-slate-950" : "border-slate-800 bg-slate-950/60")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="rounded-full border border-cyan-900 px-3 py-1 text-xs font-semibold text-cyan-200">{pathwayLabel(target.pathway_type)}</span>
                <span className="text-xs text-slate-400">{target.application_id ? "Parent application linked" : "Saved opportunity"}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{target.programme_or_role}</h3>
              <p className="mt-1 text-sm text-slate-300">{target.provider_name}</p>
              <p className="mt-2 text-xs text-slate-500">Kingsmen source status: {target.source_confidence} · {target.planning_status}</p>
              <button type="button" onClick={() => setSelectedTargetKey(target.target_key)}
                aria-pressed={selectedTargetKey === target.target_key}
                className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Select this opportunity</button>
            </article>)}
          </div>
          <button type="button" onClick={() => void openSelectedTarget()} disabled={!selectedTarget || opening}
            className="mt-5 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {opening ? "Opening Kingsmen application…" : selectedTarget?.application_id ? "Open saved application" : "Prepare Kingsmen application"}
          </button>
        </section>
      </div>
    </main>
  );
}
