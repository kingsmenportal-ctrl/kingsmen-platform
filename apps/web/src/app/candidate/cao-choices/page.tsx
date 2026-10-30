"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getCandidateAccessToken } from "../../../lib/candidate-session";

type CaoParent = {
  application_id: string;
  application_ref: string;
  status: string;
  pathway_type: string;
  opportunity_title: string;
  provider_name: string;
  updated_at: string;
};
type CaoChoice = {
  choice_number: number;
  institution_name: string;
  programme_name: string;
  cao_programme_code: string;
  source_url: string;
  source_confidence_band?: string;
  choice_status?: string;
  cao_choice_ref?: string;
};
type ApiResponse = {
  ready?: boolean;
  ok?: boolean;
  parents?: CaoParent[];
  choices?: CaoChoice[];
  application_id?: string;
  application_ref?: string;
  choices_saved?: number;
  message?: string;
  code?: string;
  error?: string;
};

const BLANK_CHOICE = (number: number): CaoChoice => ({
  choice_number: number,
  institution_name: "",
  programme_name: "",
  cao_programme_code: "",
  source_url: ""
});
const explain = (body: ApiResponse) => body.error
  ? `${body.code ? body.code + ": " : ""}${body.error}`
  : "The CAO choice request could not be completed.";

export default function CandidateCaoChoicesPage() {
  const [parents, setParents] = useState<CaoParent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [choices, setChoices] = useState<CaoChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedParent = useMemo(
    () => parents.find(parent => parent.application_id === selectedParentId) ?? null,
    [parents, selectedParentId]
  );

  const loadChoices = useCallback(async (applicationId: string, token: string) => {
    const response = await fetch(`/api/candidate/cao-choices?application_id=${encodeURIComponent(applicationId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const body = await response.json() as ApiResponse;
    if (!response.ok || body.ready !== true || body.ok !== true || !Array.isArray(body.choices)) {
      throw new Error(explain(body));
    }
    const next = body.choices.map((choice, index) => ({
      choice_number: index + 1,
      institution_name: choice.institution_name ?? "",
      programme_name: choice.programme_name ?? "",
      cao_programme_code: choice.cao_programme_code ?? "",
      source_url: choice.source_url ?? "",
      source_confidence_band: choice.source_confidence_band ?? "D",
      choice_status: choice.choice_status ?? "DRAFT",
      cao_choice_ref: choice.cao_choice_ref
    }));
    setChoices(next);
  }, []);

  const loadParents = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    const token = getCandidateAccessToken();
    if (!token) {
      setParents([]);
      setChoices([]);
      setSelectedParentId("");
      setError("Sign in to load CAO choices attached to your verified candidate identity.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/candidate/cao-choices", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const body = await response.json() as ApiResponse;
      if (!response.ok || body.ready !== true || body.ok !== true || !Array.isArray(body.parents)) {
        throw new Error(explain(body));
      }
      const nextParents = body.parents;
      setParents(nextParents);
      const nextId = nextParents.some(parent => parent.application_id === selectedParentId)
        ? selectedParentId
        : nextParents[0]?.application_id ?? "";
      setSelectedParentId(nextId);
      if (nextId) await loadChoices(nextId, token);
      else setChoices([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the eligible CAO parent applications.");
    } finally {
      setLoading(false);
    }
  }, [loadChoices, selectedParentId]);

  useEffect(() => { void loadParents(); }, [loadParents]);

  async function selectParent(applicationId: string) {
    setSelectedParentId(applicationId);
    setError("");
    setNotice("");
    const token = getCandidateAccessToken();
    if (!applicationId || !token) { setChoices([]); return; }
    setLoading(true);
    try {
      await loadChoices(applicationId, token);
    } catch (e) {
      setChoices([]);
      setError(e instanceof Error ? e.message : "Could not load this parent application's CAO choices.");
    } finally {
      setLoading(false);
    }
  }

  function updateChoice(index: number, key: keyof CaoChoice, value: string) {
    setChoices(old => old.map((choice, i) => i === index ? { ...choice, [key]: value } : choice));
    setNotice("");
  }

  function reorderChoice(index: number, delta: -1 | 1) {
    const destination = index + delta;
    if (destination < 0 || destination >= choices.length) return;
    setChoices(old => {
      const next = [...old];
      const [moved] = next.splice(index, 1);
      next.splice(destination, 0, moved);
      return next.map((choice, i) => ({ ...choice, choice_number: i + 1 }));
    });
    setNotice("");
  }

  function removeChoice(index: number) {
    setChoices(old => old.filter((_, i) => i !== index).map((choice, i) => ({ ...choice, choice_number: i + 1 })));
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!selectedParent) {
      setError("Choose an eligible CAO parent application first.");
      return;
    }
    if (selectedParent.status !== "DRAFT") {
      setError("These CAO choices are locked because the parent application is no longer a draft.");
      return;
    }
    for (const choice of choices) {
      if (!choice.institution_name.trim() || !choice.programme_name.trim()) {
        setError("Every choice needs an institution and programme name.");
        return;
      }
      if (choice.source_url.trim() && !/^https:\/\//i.test(choice.source_url.trim())) {
        setError("Programme source URLs must use HTTPS. Leave the source blank until you have the official page.");
        return;
      }
    }
    const token = getCandidateAccessToken();
    if (!token) {
      setError("Sign in before saving CAO choices.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        action: "save",
        application_id: selectedParent.application_id,
        choices: choices.map((choice, index) => ({
          choice_number: index + 1,
          institution_name: choice.institution_name,
          programme_name: choice.programme_name,
          cao_programme_code: choice.cao_programme_code,
          source_url: choice.source_url
        }))
      };
      const response = await fetch("/api/candidate/cao-choices", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
      });
      const body = await response.json() as ApiResponse;
      if (!response.ok || body.ready !== true || body.ok !== true) throw new Error(explain(body));
      if (Array.isArray(body.choices)) setChoices(body.choices.map((choice, index) => ({ ...choice, choice_number: index + 1 })));
      setNotice(body.message ?? `Saved ${body.choices_saved ?? choices.length} CAO choice(s) to the Kingsmen parent draft. No external submission occurred.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CAO choices could not be saved. Reload before retrying.");
    } finally {
      setSaving(false);
    }
  }

  function addChoice() {
    if (choices.length >= 6) return;
    setChoices(old => [...old, BLANK_CHOICE(old.length + 1)]);
    setNotice("");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · Higher Education</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">CAO programme choices</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            CAO choices are children of one Kingsmen parent application. You can keep up to six ordered choices. Saving this list records draft preparation only; it does not submit anything to CAO or a provider.
          </p>
          <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3 text-sm">
            <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-3">Dashboard</a>
            <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-3">Application tracker</a>
            <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-3">Verified opportunities</a>
            <button type="button" onClick={() => void loadParents()} disabled={loading || saving} className="rounded-xl border border-slate-700 px-4 py-3 font-semibold disabled:opacity-40">{loading ? "Loading…" : "Reload saved choices"}</button>
          </nav>
        </header>

        {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100">{error}</section>}
        {notice && <section role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</section>}

        {parents.length === 0 && !loading ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">No eligible CAO parent draft found</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Create a parent draft from a current, verified CAO opportunity first. This page does not turn an institution directory into an active application and will not create a sample parent on your behalf.</p>
            <a href="/candidate/opportunity-matches" className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">Open verified opportunities</a>
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <label className="block text-sm font-semibold">
              Kingsmen parent application
              <select value={selectedParentId} onChange={event => void selectParent(event.target.value)} disabled={loading || !parents.length} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3">
                {parents.map(parent => <option key={parent.application_id} value={parent.application_id}>{parent.application_ref} · {parent.opportunity_title} · {parent.status}</option>)}
              </select>
            </label>
            {selectedParent && <p className="mt-3 text-xs leading-5 text-slate-400">Parent: {selectedParent.application_ref} · {selectedParent.provider_name} · state {selectedParent.status}. Choices remain candidate-entered draft data.</p>}

            <form onSubmit={event => void save(event)} className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-xl font-bold">Ordered programme choices</h2><p className="mt-1 text-sm text-slate-400">{choices.length} of 6 · Rank 1 is your first choice</p></div>
                <button type="button" onClick={addChoice} disabled={loading || saving || choices.length >= 6 || selectedParent?.status !== "DRAFT"} className="rounded-xl border border-cyan-700 px-4 py-2 text-sm font-bold disabled:opacity-40">Add choice</button>
              </div>

              {choices.length === 0 && <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">No choices are saved yet. Add the first programme below. Saving an empty list clears existing choices from this draft.</p>}

              {choices.map((choice, index) => (
                <article key={choice.cao_choice_ref ?? `choice-${index}`} className="rounded-2xl border border-slate-700 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold">Choice {index + 1}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" aria-label={`Move choice ${index + 1} up`} onClick={() => reorderChoice(index, -1)} disabled={loading || saving || index === 0 || selectedParent?.status !== "DRAFT"} className="rounded-lg border border-slate-600 px-3 py-2 text-xs disabled:opacity-40">Move up</button>
                      <button type="button" aria-label={`Move choice ${index + 1} down`} onClick={() => reorderChoice(index, 1)} disabled={loading || saving || index === choices.length - 1 || selectedParent?.status !== "DRAFT"} className="rounded-lg border border-slate-600 px-3 py-2 text-xs disabled:opacity-40">Move down</button>
                      <button type="button" onClick={() => removeChoice(index)} disabled={loading || saving || selectedParent?.status !== "DRAFT"} className="rounded-lg border border-rose-800 px-3 py-2 text-xs text-rose-200 disabled:opacity-40">Remove</button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold">Institution name
                      <input required maxLength={180} value={choice.institution_name} onChange={event => updateChoice(index,"institution_name",event.target.value)} disabled={loading || saving || selectedParent?.status !== "DRAFT"} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" placeholder="Official institution name" />
                    </label>
                    <label className="text-sm font-semibold">Programme name
                      <input required maxLength={240} value={choice.programme_name} onChange={event => updateChoice(index,"programme_name",event.target.value)} disabled={loading || saving || selectedParent?.status !== "DRAFT"} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" placeholder="Exact programme or course" />
                    </label>
                    <label className="text-sm font-semibold">CAO programme code (optional)
                      <input maxLength={80} value={choice.cao_programme_code} onChange={event => updateChoice(index,"cao_programme_code",event.target.value)} disabled={loading || saving || selectedParent?.status !== "DRAFT"} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" placeholder="Enter only if confirmed from an official source" />
                    </label>
                    <label className="text-sm font-semibold">Official programme source URL (optional)
                      <input type="url" maxLength={1000} value={choice.source_url} onChange={event => updateChoice(index,"source_url",event.target.value)} disabled={loading || saving || selectedParent?.status !== "DRAFT"} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" placeholder="https://…" />
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-amber-200">Evidence state: {choice.source_confidence_band === "D" || !choice.source_confidence_band ? "Unverified candidate-entered draft" : choice.source_confidence_band}. An entered URL is not proof of programme availability, eligibility or deadline.</p>
                </article>
              ))}

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={loading || saving || !selectedParent || selectedParent.status !== "DRAFT"} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40">{saving ? "Saving choices…" : "Save ordered choices"}</button>
                {selectedParent?.status !== "DRAFT" && <span className="self-center text-sm text-amber-200">Parent is locked outside DRAFT; choice editing is disabled.</span>}
              </div>
            </form>
          </section>
        )}

        <footer className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-400">Kingsmen stores one parent application and ordered child choices. It does not create one Kingsmen application per CAO choice. Candidate-entered details stay unverified until a separate source-evidence review; application submission and provider/CAO receipt remain separate workflow events.</footer>
      </div>
    </main>
  );
}
