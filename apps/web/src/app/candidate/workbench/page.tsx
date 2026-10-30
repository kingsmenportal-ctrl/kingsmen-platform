"use client";

import { getCandidateAccessToken } from "../../../lib/candidate-session";
import { useCallback, useEffect, useState } from "react";

const pathways = [
  ["higher-education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta", "SETA programmes & learnerships"],
  ["internships", "Internships"],
  ["apprenticeships", "Apprenticeships"],
  ["employment", "Employment"]
] as const;
const taskOptions = [
  ["profile", "Review my core candidate profile"],
  ["id", "Prepare identity and supporting documents"],
  ["results", "Review my qualifications and results"],
  ["route", "Set my opportunity and pathway preferences"]
] as const;

type Readiness = {
  completed_tasks: string[];
  priority_pathway: string;
  revision: number;
  updated_at: string | null;
};
function errorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const p = body as Record<string, unknown>;
    if (typeof p.code === "string" && typeof p.error === "string") return `${p.code}: ${p.error}`;
    if (typeof p.error === "string") return p.error;
    if (typeof p.message === "string") return p.message;
    if (typeof p.code === "string") return p.code;
  }
  return "The saved preparation workspace is unavailable.";
}

export default function CandidateWorkbenchPage() {
  const [readiness, setReadiness] = useState<Readiness>({
    completed_tasks: [], priority_pathway: "", revision: 0, updated_at: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = getCandidateAccessToken();
    if (!token) {
      setAccessGranted(false);
      setError("Sign in to load your saved preparation progress.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/candidate/workbench/readiness", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load" }),
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ready !== true) {
        setAccessGranted(false);
        setError(errorMessage(body));
        return;
      }
      setReadiness({
        completed_tasks: Array.isArray(body.completed_tasks) ? body.completed_tasks : [],
        priority_pathway: typeof body.priority_pathway === "string" ? body.priority_pathway : "",
        revision: typeof body.revision === "number" ? body.revision : 0,
        updated_at: typeof body.updated_at === "string" ? body.updated_at : null
      });
      setAccessGranted(true);
      setNotice("");
    } catch {
      setError("Could not load saved preparation progress.");
      setAccessGranted(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function toggleTask(taskId: string) {
    setReadiness((old) => ({
      ...old,
      completed_tasks: old.completed_tasks.includes(taskId)
        ? old.completed_tasks.filter((id) => id !== taskId)
        : [...old.completed_tasks, taskId]
    }));
    setNotice("");
  }

  async function save() {
    setError("");
    setNotice("");
    const token = getCandidateAccessToken();
    if (!token) {
      setError("Sign in before saving preparation progress.");
      setAccessGranted(false);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/candidate/workbench/readiness", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          completed_tasks: readiness.completed_tasks,
          priority_pathway: readiness.priority_pathway
        }),
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ready !== true) {
        setError(errorMessage(body));
        if (response.status === 401 || response.status === 403) setAccessGranted(false);
        return;
      }
      setReadiness({
        completed_tasks: Array.isArray(body.completed_tasks) ? body.completed_tasks : [],
        priority_pathway: typeof body.priority_pathway === "string" ? body.priority_pathway : "",
        revision: typeof body.revision === "number" ? body.revision : readiness.revision,
        updated_at: typeof body.updated_at === "string" ? body.updated_at : null
      });
      setNotice("Preparation progress saved to your authenticated Kingsmen workspace.");
    } catch {
      setError("Could not save preparation progress. Your changes may not have been saved.");
    } finally {
      setSaving(false);
    }
  }

  const completion = Math.round((readiness.completed_tasks.length / taskOptions.length) * 100);

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · N06</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Application workbench</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Prepare once for all six national pathways. Your plan changes service intensity, not which opportunities you can discover. This checklist is your reported preparation progress; it does not verify documents, eligibility, payment, submission or provider outcomes.
        </p>
        <nav aria-label="Candidate portal" className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
          <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-2">Document Vault</a>
          <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-2">Verified opportunities</a>
        </nav>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100">
        <h2 className="font-bold">{error.includes("IDENTITY_NOT_VERIFIED") || error.includes("Identity") ? "Authorised identity review required" : "Workspace access"}</h2>
        <p className="mt-1">{error}</p>
        {(!getCandidateAccessToken() || error.includes("expired") || error.includes("Sign in")) && <a href="/candidate/login" className="mt-3 inline-block text-cyan-300 underline">Sign in / create account</a>}
      </section>}
      {notice && <p role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-100">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-xl font-bold">Preparation checklist</h2><p className="mt-1 text-sm text-slate-400">Self-reported progress · not a verified compliance status</p></div>
            <span className="text-xl font-bold text-cyan-300">{completion}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${completion}%` }} /></div>
          <div className="mt-6 space-y-3">
            {taskOptions.map(([id,label]) => <label key={id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 p-4 hover:border-slate-600">
              <input type="checkbox" checked={readiness.completed_tasks.includes(id)} disabled={loading || !accessGranted} onChange={() => toggleTask(id)} className="mt-1 h-4 w-4 accent-cyan-300" />
              <span><span className="block font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-400">Mark only when you believe this preparation step is complete.</span></span>
            </label>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={save} disabled={loading || saving || !accessGranted} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving…" : "Save preparation progress"}</button>
            <button type="button" onClick={() => void load()} disabled={loading || saving} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold disabled:opacity-40">{loading ? "Loading…" : "Reload saved progress"}</button>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Saved revision: {readiness.revision}{readiness.updated_at ? ` · Updated ${new Date(readiness.updated_at).toLocaleString()}` : ""}</p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">Priority pathway</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Select your current focus. All pathways remain discoverable regardless of selection or package.</p>
          <label className="mt-5 block text-sm font-semibold">
            Choose a priority pathway
            <select disabled={loading || !accessGranted} value={readiness.priority_pathway} onChange={(e) => { setReadiness(old => ({ ...old, priority_pathway: e.target.value })); setNotice(""); }}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white disabled:opacity-40">
              <option value="">No priority selected</option>
              {pathways.map(([id,label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>

          <div className="mt-7 space-y-3">
            <h3 className="font-semibold">All six pathways</h3>
            {pathways.map(([id,label]) => <div key={id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-4 py-3">
              <span className="text-sm">{label}</span>
              <span className="text-xs text-slate-400">{readiness.priority_pathway === id ? "Current focus" : "Available"}</span>
            </div>)}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-700 p-4 text-sm leading-6 text-slate-300">
            <strong className="text-white">CAO parent-child rule</strong>
            <p className="mt-1">CAO remains one Kingsmen-managed application. Programme choices belong under that parent application and do not each count as a separate Kingsmen application.</p>
          </div>
        </section>
      </div>
      <footer className="text-xs leading-5 text-slate-500">No acceptance, funding, placement, employment, or success is guaranteed. Kingsmen may assist with preparation and matching, but the provider makes the decision. You cannot verify sources, mark a payment settled, claim submission receipt or assert an outcome from this browser checklist.</footer>
    </div>
  </main>;
}
