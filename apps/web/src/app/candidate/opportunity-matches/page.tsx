"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const PATHWAYS = [
  ["HIGHER_EDUCATION", "Higher education"],
  ["TVET", "TVET"],
  ["SETA_LEARNERSHIPS", "SETA / learnerships"],
  ["INTERNSHIPS", "Internships"],
  ["APPRENTICESHIPS", "Apprenticeships"],
  ["EMPLOYMENT", "Employment"]
] as const;

type Opportunity = {
  match_ref: string;
  title: string;
  provider: string;
  sector: string;
  pathways: string[];
  location?: string | null;
  official_link: string;
  match_score: number;
  source_checked_at: string;
  source_evidence: string[];
  deadline: { closes_at?: string; timezone?: string; evidence?: string[]; status?: string; message?: string };
  eligibility: { status: string; rules: string };
  recommendation_summary: string;
};

type Feed = { status: string; count?: number; opportunities?: Opportunity[]; message?: string; empty_reason?: string };

type MasterTarget = { target_key: string; application_id: string | null; planning_status: string };
type ParentApplication = { id: string; application_ref: string; status: string };

function getAccessToken(): string | null {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    const projectRef = new URL(base).hostname.split(".")[0];
    const stored = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

export default function CandidateOpportunityMatchesPage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [pathway, setPathway] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveBusy, setSaveBusy] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [savedTargets, setSavedTargets] = useState<Record<string, string>>({});
  const [preparedApplications, setPreparedApplications] = useState<Record<string, string>>({});
  const [workbenchStatus, setWorkbenchStatus] = useState("");

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = getAccessToken();
      if (!url || !anonKey) throw new Error("Candidate matching is not configured for this deployment.");
      if (!token) throw new Error("Please sign in first. Your authenticated session was not found in this browser.");
      const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/n15-candidate-opportunities`, {
        method: "GET",
        headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 403 && body.status === "IDENTITY_REVIEW_REQUIRED") {
          setFeed(body);
          return;
        }
        throw new Error(body.message || body.reason || body.status || `Request failed (${response.status})`);
      }
      setFeed(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load verified opportunities.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedWorkbench = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await fetch("/api/candidate/applications", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ready !== true) {
        setWorkbenchStatus(typeof body.error === "string" ? body.error : "Saved application state could not be reloaded. Open the application tracker to inspect the current server response.");
        return;
      }

      const targets = Array.isArray(body.masterTargets) ? body.masterTargets as MasterTarget[] : [];
      const applications = Array.isArray(body.parentApplications) ? body.parentApplications as ParentApplication[] : [];
      const saved: Record<string, string> = {};
      const prepared: Record<string, string> = {};
      for (const target of targets) {
        if (typeof target.target_key !== "string" || !target.target_key.startsWith("n15:")) continue;
        const matchRef = target.target_key.slice(4);
        if (!matchRef) continue;
        saved[matchRef] = target.target_key;
        if (target.application_id) {
          const application = applications.find(item => item.id === target.application_id);
          prepared[matchRef] = application?.application_ref || "Draft saved";
        }
      }
      setSavedTargets(saved);
      setPreparedApplications(prepared);
      setWorkbenchStatus(`Reloaded saved Kingsmen records: ${Object.keys(saved).length} opportunity target(s), ${Object.keys(prepared).length} linked parent draft(s).`);
    } catch {
      setWorkbenchStatus("Saved workbench state could not be refreshed. The application tracker remains the authoritative view of saved records.");
    }
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    void loadMatches();
    void loadSavedWorkbench();
  }, [loadMatches, loadSavedWorkbench]);

  const opportunities = useMemo(() => (feed?.opportunities ?? []).filter(item =>
    pathway === "ALL" || item.pathways.includes(pathway)
  ), [feed, pathway]);

  async function saveToWorkbench(item: Opportunity) {
    setSaveBusy(item.match_ref);
    setSaveNotice("");
    setError("");
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Sign in before saving an opportunity.");
      const selected = pathway !== "ALL" && item.pathways.includes(pathway) ? pathway : item.pathways[0];
      const pathwayType = selected === "SETA_LEARNERSHIPS" ? "SETA_LEARNERSHIP"
        : selected === "INTERNSHIPS" ? "INTERNSHIP"
        : selected === "APPRENTICESHIPS" ? "APPRENTICESHIP"
        : selected;
      if (!pathwayType) throw new Error("This match has no supported pathway mapping yet.");
      const response = await fetch("/api/candidate/opportunity-save", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", match_ref: item.match_ref, pathway_type: pathwayType }),
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ok !== true) throw new Error(body.message || body.error || body.code || `Save failed (${response.status})`);
      await loadSavedWorkbench();
      setSaveNotice(body.message || "Opportunity saved and application draft prepared. No provider submission has occurred.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this opportunity.");
    } finally { setSaveBusy(""); }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kingsmen · N15</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Opportunity matches</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Review opportunities matched to your authorised Kingsmen identity. Only human-approved matches with current official-source evidence can appear here. A match is not an eligibility decision, application submission or promise of acceptance.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={loadMatches} disabled={loading}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Checking verified matches…" : feed ? "Refresh my verified matches" : "Load my verified matches"}
          </button>
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Candidate dashboard</a>
        </div>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{error}</section>}
      {saveNotice && <section role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">{saveNotice}<div className="mt-3"><a href="/candidate/applications" className="font-bold underline">Open application tracker</a> · <a href="/candidate/workbench" className="font-bold underline">Open workbench</a></div></section>}
      {workbenchStatus && <section role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{workbenchStatus} <a href="/candidate/applications" className="ml-1 font-semibold underline">View saved records</a></section>}
      {feed?.status === "IDENTITY_REVIEW_REQUIRED" && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-950">Identity review required</h2>
          <p className="mt-2 text-sm text-amber-900">{feed.message}</p>
        </section>
      )}

      {feed?.status === "OK" && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700"><strong>{feed.count ?? 0}</strong> verified match(es) currently pass all publication gates.</p>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Pathway
                <select value={pathway} onChange={e => setPathway(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="ALL">All six pathways</option>
                  {PATHWAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
          </section>

          {opportunities.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-bold text-slate-900">No matches cleared the current verification gates</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feed.empty_reason || "No verified matches are available for this pathway yet."} Kingsmen will not substitute stale or unreviewed listings to fill this page.</p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2">
              {opportunities.map(item => (
                <article key={item.match_ref} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap gap-2">
                    {item.pathways.map(p => <span key={p} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{PATHWAYS.find(x => x[0] === p)?.[1] ?? p}</span>)}
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.provider}{item.location ? ` · ${item.location}` : ""}</p>
                  <p className="mt-3 text-sm text-slate-700">{item.recommendation_summary}</p>
                  <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                    <div><dt className="inline font-semibold text-slate-800">Source checked: </dt><dd className="inline text-slate-600">{new Date(item.source_checked_at).toLocaleString()}</dd></div>
                    <div><dt className="inline font-semibold text-slate-800">Deadline: </dt><dd className="inline text-slate-600">{item.deadline.closes_at ? new Date(item.deadline.closes_at).toLocaleString() : item.deadline.message || "Not verified — check the official page."}</dd></div>
                    <div><dt className="inline font-semibold text-slate-800">Eligibility: </dt><dd className="inline text-slate-600">Requires candidate-specific review; not guaranteed.</dd></div>
                  </dl>
                  <details className="mt-4 rounded-xl border border-slate-200 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-900">Opportunity details and evidence</summary>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                      <p><strong className="text-slate-800">Publication state:</strong> Open listing only; individual eligibility still requires review.</p>
                      <p><strong className="text-slate-800">Official-source evidence:</strong> {item.source_evidence.length ? item.source_evidence.join(", ") : "No source evidence returned."}</p>
                      <p><strong className="text-slate-800">Deadline evidence:</strong> {item.deadline.evidence?.length ? item.deadline.evidence.join(", ") : "No confirmed deadline evidence returned."}</p>
                      <p><strong className="text-slate-800">Eligibility:</strong> {item.eligibility.rules}</p>
                    </div>
                  </details>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={item.official_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Open official opportunity ↗</a>
                    <button type="button" onClick={() => void saveToWorkbench(item)} disabled={Boolean(saveBusy)}
                      className="inline-flex rounded-xl border border-cyan-700 px-4 py-3 text-sm font-bold text-slate-900 disabled:opacity-50">
                      {saveBusy === item.match_ref ? "Verifying and saving…" : preparedApplications[item.match_ref] ? `Saved · draft ${preparedApplications[item.match_ref]}` : savedTargets[item.match_ref] ? "Saved · retry preparation" : "Save & prepare application"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      <footer className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        Freshness is checked at read time. If a source is stale, the opportunity is withheld. Candidate-reported submission, provider-confirmed receipt and provider-issued outcome remain separate events.
      </footer>
    </main>
  );
}
