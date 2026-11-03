"use client";

import { useMemo, useState } from "react";

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

function getAuthContext(): { url: string; anonKey: string; token: string } | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const projectRef = new URL(url).hostname.split(".")[0];
    const storageKey = projectRef ? `sb-${projectRef}-auth-token` : "sb-euhubhhnumtibbyufghm-auth-token";
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { access_token?: string; expires_at?: number };
    if (typeof parsed.access_token !== "string") return null;
    if (typeof parsed.expires_at === "number" && parsed.expires_at <= Math.floor(Date.now() / 1000)) return null;
    return { url, anonKey, token: parsed.access_token };
  } catch { return null; }
}

export default function CandidateOpportunityMatchesPage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [pathway, setPathway] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingMatchRef, setSavingMatchRef] = useState<string | null>(null);
  const [saveResults, setSaveResults] = useState<Record<string, { ok: boolean; message: string }>>({});

  async function loadMatches() {
    setLoading(true);
    setError("");
    setFeed(null);
    try {
      const auth = getAuthContext();
      if (!auth) throw new Error("Sign in with an active session. Candidate matching is not configured or your session may have expired.");
      const response = await fetch(`${auth.url}/functions/v1/n15-candidate-opportunities`, {
        method: "GET",
        headers: { apikey: auth.anonKey, Authorization: `Bearer ${auth.token}` },
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
  }

  const opportunities = useMemo(() => (feed?.opportunities ?? []).filter(item =>
    pathway === "ALL" || item.pathways.includes(pathway)
  ), [feed, pathway]);

  async function saveOpportunity(item: Opportunity) {
    const auth = getAuthContext();
    if (!auth) {
      setSaveResults((current) => ({ ...current, [item.match_ref]: { ok: false, message: "Sign in again before saving an opportunity." } }));
      return;
    }
    setSavingMatchRef(item.match_ref);
    setSaveResults((current) => { const next = { ...current }; delete next[item.match_ref]; return next; });
    try {
      const response = await fetch(`${auth.url}/functions/v1/candidate-save-verified-opportunity`, {
        method: "POST",
        headers: { apikey: auth.anonKey, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", match_ref: item.match_ref, pathway_type: item.pathways[0] ?? "" }),
        cache: "no-store"
      });
      let body: { ok?: boolean; code?: string; error?: string; message?: string; trackerLinked?: boolean; application?: unknown } = {};
      try { body = await response.json(); } catch {}
      if (!response.ok || body.ok !== true) {
        throw new Error(body.error || body.message || body.code || `Save request failed (${response.status}).`);
      }
      setSaveResults((current) => ({ ...current, [item.match_ref]: { ok: true, message: body.message || "Saved to your candidate workspace. The application remains a draft; no provider submission occurred." } }));
    } catch (caught) {
      setSaveResults((current) => ({ ...current, [item.match_ref]: { ok: false, message: caught instanceof Error ? caught.message : "The opportunity was not confirmed as saved." } }));
    } finally {
      setSavingMatchRef(null);
    }
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
            {loading ? "Checking verified matches…" : "Load my verified matches"}
          </button>
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Candidate dashboard</a>
          <a href="/candidate/login" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Sign in</a>
          <a href="/packages/" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Packages</a>
        </div>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{error}</section>}
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
                    <div><dt className="inline font-semibold text-slate-800">Eligibility review: </dt><dd className="inline text-slate-600">{item.eligibility.status} — {item.eligibility.rules}</dd></div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={item.official_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Open official opportunity ↗</a>
                    <button type="button" onClick={() => void saveOpportunity(item)} disabled={savingMatchRef === item.match_ref}
                      className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 disabled:cursor-wait disabled:opacity-60">
                      {savingMatchRef === item.match_ref ? "Saving…" : "Save & prepare draft"}
                    </button>
                  </div>
                  {saveResults[item.match_ref] ? <p role={saveResults[item.match_ref].ok ? "status" : "alert"} aria-live="polite" className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${saveResults[item.match_ref].ok ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>{saveResults[item.match_ref].message}</p> : null}
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
