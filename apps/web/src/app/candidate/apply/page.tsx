"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

type Application = {
  id: string;
  application_ref: string;
  pathway_type: string;
  status: string;
  readiness_status: string;
  title: string;
  provider_name: string;
  closes_at: string | null;
};

type AnswerState = {
  motivation_statement: string;
  relevant_experience: string;
  qualifications_summary: string;
  availability_date: string;
  preferred_campus: string;
  additional_context: string;
};

type ApiBody = {
  ready?: boolean;
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  masterTargets?: MasterTarget[];
  application?: Record<string, unknown> | Application;
  draft?: Record<string, unknown>;
  draft_version?: number;
  draft_updated_at?: string | null;
  is_editable?: boolean;
  provider_submission_sent?: boolean;
};

const EMPTY_ANSWERS: AnswerState = {
  motivation_statement: "",
  relevant_experience: "",
  qualifications_summary: "",
  availability_date: "",
  preferred_campus: "",
  additional_context: ""
};

function explain(body: ApiBody): string {
  if (body.code && body.error) return body.code + ": " + body.error;
  return body.error || body.message || "The application request could not be completed.";
}

function pathwayLabel(value: string): string {
  return PATHWAYS.find(([key]) => key === value)?.[1] ?? value.replaceAll("_", " ");
}

function toAnswerState(value: Record<string, unknown> | undefined): AnswerState {
  const additional = Array.isArray(value?.additional_answers) ? value?.additional_answers : [];
  const firstAdditional = additional.find((item) =>
    item && typeof item === "object" && (item as Record<string, unknown>).question_key === "additional_context"
  ) as Record<string, unknown> | undefined;
  return {
    motivation_statement: typeof value?.motivation_statement === "string" ? value.motivation_statement : "",
    relevant_experience: typeof value?.relevant_experience === "string" ? value.relevant_experience : "",
    qualifications_summary: typeof value?.qualifications_summary === "string" ? value.qualifications_summary : "",
    availability_date: typeof value?.availability_date === "string" ? value.availability_date : "",
    preferred_campus: typeof value?.preferred_campus === "string" ? value.preferred_campus : "",
    additional_context: typeof firstAdditional?.answer === "string" ? firstAdditional.answer : ""
  };
}

async function requestJson(path: string, method: "GET" | "POST", payload?: Record<string, unknown>): Promise<ApiBody> {
  const token = getCandidateAccessToken();
  if (!token) throw new Error("AUTHENTICATION_REQUIRED: Sign in to open your Kingsmen application.");
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
  const [targets, setTargets] = useState<MasterTarget[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("ALL");
  const [application, setApplication] = useState<Application | null>(null);
  const [answers, setAnswers] = useState<AnswerState>(EMPTY_ANSWERS);
  const [draftVersion, setDraftVersion] = useState(0);
  const [editable, setEditable] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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

  const loadDraft = useCallback(async (applicationId: string) => {
    const body = await requestJson(
      "/api/candidate/application-draft?application_id=" + encodeURIComponent(applicationId),
      "GET"
    );
    const record = body.application as Application | undefined;
    if (!record || typeof record.id !== "string") throw new Error("APPLICATION_PARENT_NOT_RETURNED: The saved application could not be opened.");
    setApplication(record);
    setAnswers(toAnswerState(body.draft));
    setDraftVersion(typeof body.draft_version === "number" ? body.draft_version : 0);
    setEditable(body.is_editable === true);
    setLastSavedAt(typeof body.draft_updated_at === "string" ? body.draft_updated_at : null);
    setNotice("Your Kingsmen application draft was loaded from the backend. No provider submission has occurred.");
  }, []);

  async function openSelectedTarget() {
    if (!selectedTarget) {
      setError("Save a verified opportunity first, then select it here.");
      return;
    }
    setOpening(true);
    setError("");
    setNotice("");
    setApplication(null);
    try {
      let applicationId = selectedTarget.application_id;
      if (!applicationId) {
        const prepared = await requestJson("/api/candidate/applications", "POST", {
          action: "prepare_master_application",
          target_key: selectedTarget.target_key
        });
        const preparedApplication = prepared.application && typeof prepared.application === "object"
          ? prepared.application as Record<string, unknown>
          : {};
        applicationId = typeof preparedApplication.application_id === "string"
          ? preparedApplication.application_id
          : null;
        if (!applicationId) throw new Error("APPLICATION_PARENT_NOT_RETURNED: The preparation service did not return an application identifier.");
        setTargets((current) => current.map((item) =>
          item.target_key === selectedTarget.target_key ? { ...item, application_id: applicationId } : item
        ));
      }
      await loadDraft(applicationId);
      await loadTargets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The application draft could not be opened.");
    } finally {
      setOpening(false);
    }
  }

  function updateAnswer(key: keyof AnswerState, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application) return;
    if (!editable) {
      setError("This application is read-only because its current status does not permit candidate edits.");
      return;
    }
    const token = getCandidateAccessToken();
    if (!token) {
      setError("AUTHENTICATION_REQUIRED: Sign in before saving this application.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const answerData: Record<string, unknown> = {
      motivation_statement: answers.motivation_statement,
      relevant_experience: answers.relevant_experience,
      qualifications_summary: answers.qualifications_summary,
      preferred_campus: answers.preferred_campus,
      additional_answers: answers.additional_context.trim()
        ? [{ question_key: "additional_context", answer: answers.additional_context.trim() }]
        : []
    };
    if (answers.availability_date) answerData.availability_date = answers.availability_date;
    try {
      const body = await requestJson("/api/candidate/application-draft", "POST", {
        application_id: application.id,
        expected_version: draftVersion,
        idempotency_key: "kma-" + crypto.randomUUID().replaceAll("-", ""),
        answer_data: answerData
      });
      setDraftVersion(typeof body.draft_version === "number" ? body.draft_version : draftVersion + 1);
      setLastSavedAt(typeof body.updated_at === "string" ? body.updated_at : new Date().toISOString());
      setNotice("Application draft saved to your authenticated Kingsmen account. It remains a draft; no provider submission occurred.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "The application draft could not be saved.";
      setError(message.includes("VERSION_CONFLICT")
        ? message + " Reload this draft before making another save."
        : message);
    } finally {
      setSaving(false);
    }
  }

  async function reloadDraft() {
    if (!application) return;
    setError("");
    setNotice("");
    try {
      await loadDraft(application.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The saved draft could not be reloaded.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · Unified application</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">One application form. Six pathways.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Use your reusable Kingsmen profile context to prepare applications across higher education, TVET, SETA programmes and learnerships, internships, apprenticeships and employment. Select a saved verified opportunity to open its Kingsmen parent application. Each draft stays inside your candidate account.
          </p>
          <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3 text-sm">
            <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
            <a href="/candidate/profile" className="rounded-xl border border-slate-700 px-4 py-2">My profile</a>
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
                The catalogue remains available across all pathways. This list contains opportunities you have already saved to your Kingsmen workspace; selecting one creates or reopens its owned draft.
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
            <p className="mt-1 text-sm text-slate-400">Open verified opportunities, save a suitable target to your workspace, then return here to prepare its application.</p>
            <a href="/candidate/opportunity-matches" className="mt-3 inline-block text-sm font-bold text-cyan-300 underline">Find verified opportunities</a>
          </div>}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredTargets.map((target) => <article key={target.target_key}
              className={"rounded-2xl border p-4 " + (selectedTargetKey === target.target_key ? "border-cyan-600 bg-slate-950" : "border-slate-800 bg-slate-950/60")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="rounded-full border border-cyan-900 px-3 py-1 text-xs font-semibold text-cyan-200">{pathwayLabel(target.pathway_type)}</span>
                <span className="text-xs text-slate-400">{target.application_id ? "Parent draft linked" : "Saved target"}</span>
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
            {opening ? "Opening Kingsmen draft…" : selectedTarget?.application_id ? "Open saved application" : "Prepare Kingsmen application draft"}
          </button>
        </section>

        {application && <section className="rounded-3xl border border-cyan-900 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Kingsmen parent application · {application.application_ref}</p>
              <h2 className="mt-2 text-2xl font-bold">{application.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{application.provider_name} · {pathwayLabel(application.pathway_type)}</p>
              <p className="mt-2 text-xs text-slate-400">Status: {application.status} · Readiness: {application.readiness_status}</p>
            </div>
            <button type="button" onClick={() => void reloadDraft()} disabled={saving || opening}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">Reload saved draft</button>
          </div>
          {application.pathway_type === "HIGHER_EDUCATION" && <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
            For an eligible CAO route, programme choices remain ordered child records under one Kingsmen parent application. Open <a href="/candidate/cao-choices" className="font-bold text-cyan-300 underline">CAO programme choices</a> to manage those child records.
          </p>}
          <form onSubmit={saveDraft} className="mt-6 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              Your reusable candidate profile and Document Vault remain separate shared records. These fields store application-specific answers only. Required eligibility, source freshness and document checks are handled by the relevant Kingsmen readiness workflow.
            </div>
            <fieldset disabled={!editable || saving} className="space-y-5 disabled:opacity-70">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Motivation statement</span>
                <textarea value={answers.motivation_statement} onChange={(event) => updateAnswer("motivation_statement", event.target.value)}
                  maxLength={5000} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-cyan-500"
                  placeholder="Explain why this opportunity fits your goals and experience." />
                <span className="mt-1 block text-xs text-slate-500">Maximum 5,000 characters.</span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Relevant experience</span>
                <textarea value={answers.relevant_experience} onChange={(event) => updateAnswer("relevant_experience", event.target.value)}
                  maxLength={4000} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-cyan-500"
                  placeholder="Describe relevant work, volunteering, projects, learnerships or practical experience." />
                <span className="mt-1 block text-xs text-slate-500">Maximum 4,000 characters.</span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Qualifications summary</span>
                <textarea value={answers.qualifications_summary} onChange={(event) => updateAnswer("qualifications_summary", event.target.value)}
                  maxLength={3000} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-cyan-500"
                  placeholder="Summarise relevant qualifications. Keep your verified documents in the Document Vault." />
                <span className="mt-1 block text-xs text-slate-500">Maximum 3,000 characters.</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Availability date</span>
                  <input type="date" value={answers.availability_date} onChange={(event) => updateAnswer("availability_date", event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Preferred campus / location</span>
                  <input type="text" value={answers.preferred_campus} onChange={(event) => updateAnswer("preferred_campus", event.target.value)}
                    maxLength={180} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm"
                    placeholder="Campus, town, province or preferred work location" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Additional information</span>
                <textarea value={answers.additional_context} onChange={(event) => updateAnswer("additional_context", event.target.value)}
                  maxLength={2000} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-cyan-500"
                  placeholder="Add information relevant to this application." />
                <span className="mt-1 block text-xs text-slate-500">Maximum 2,000 characters.</span>
              </label>
            </fieldset>
            {!editable && <p className="rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-100">This parent application is not currently editable. The saved draft remains available for review.</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!editable || saving}
                className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">
                {saving ? "Saving securely…" : "Save application draft"}
              </button>
              <span className="text-xs text-slate-400">Draft version {draftVersion}{lastSavedAt ? " · Last saved " + new Date(lastSavedAt).toLocaleString() : " · Not yet saved"}</span>
            </div>
          </form>
          <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-400">
            Saving creates or updates a Kingsmen draft only. No external provider portal is opened, no provider submission is sent, and no provider receipt or outcome is inferred.
          </p>
        </section>}
      </div>
    </main>
  );
}
