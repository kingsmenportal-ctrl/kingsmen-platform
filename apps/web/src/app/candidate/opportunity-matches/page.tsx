"use client";

import { useMemo, useState } from "react";
import { getCandidateAccessToken, getCandidateSupabaseConfig } from "../../../lib/candidate-session";

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

function getAccessToken(): string | null { return getCandidateAccessToken(); }

export default function CandidateOpportunityMatchesPage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [pathway, setPathway] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState("");
  const [savedTargets, setSavedTargets] = useState<Record<string, string>>({});
  const [preparedApplications, setPreparedApplications] = useState<Record<string, string>>({});
  const [selectedPathways, setSelectedPathways] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function loadMatches() {
    setLoading(true);
    setError("");
    setFeed(null);
    try {
      const config = getCandidateSupabaseConfig();
      const token = getAccessToken();
      if (!config) throw new Error("Candidate matching is not configured for this deployment.");
      if (!token) throw new Error("Please sign in first. Your authenticated session was not found in this browser.");
      const response = await fetch(`${config.url}/functions/v1/n15-candidate-opportunities`, {
        method: "GET",
        headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
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

  function toApplicationPathway(value: string): string {
    if (value === "SETA_LEARNERSHIPS") return "SETA_LEARNERSHIP";
    if (value === "INTERNSHIPS") return "INTERNSHIP";
    if (value === "APPRENTICESHIPS") return "APPRENTICESHIP";
    return value;
  }
  function pathwayFor(item: Opportunity): string {
    const choice = selectedPathways[item.match_ref] || (pathway !== "ALL" && item.pathways.includes(pathway) ? pathway : item.pathways[0] || "");
    return toApplicationPathway(choice);
  }
  async function saveOpportunity(item: Opportunity) {
    setSaving(`save:${item.match_ref}`); setError(""); setNotice("");
    const token = getAccessToken();
    if (!token) { setError("Sign in before saving an opportunity."); setSaving(""); return; }
    const selected = pathwayFor(item);
    if (!selected) { setError("This listing does not have a supported pathway. Nothing was saved."); setSaving(""); return; }
    try {
      const response = await fetch("/api/candidate/applications", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_n15_match", match_ref: item.match_ref, pathway_type: selected }),
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ready !== true || typeof body.target_key !== "string") {
        throw new Error(body.code && body.error ? `${body.code}: ${body.error}` : body.error || "Opportunity could not be saved.");
      }
      setSavedTargets(old => ({ ...old, [item.match_ref]: body.target_key }));
      setNotice("Opportunity saved to your Kingsmen account. Current official-source gates were rechecked by the backend; no external application was submitted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opportunity could not be saved. Reload the feed and retry.");
    } finally { setSaving(""); }
  }
  async function prepareApplication(item: Opportunity) {
    const targetKey = savedTargets[item.match_ref];
    if (!targetKey) { setError("Save the opportunity before preparing an application."); return; }
    setSaving(`prepare:${item.match_ref}`); setError(""); setNotice("");
    const token = getAccessToken();
    if (!token) { setError("Sign in before preparing an application."); setSaving(""); return; }
    try {
      const response = await fetch("/api/candidate/applications", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare_master_application", target_key: targetKey }),
        cache: "no-store"
      });
      const body = await response.json();
      const application = body.application as Record<string, unknown> | undefined;
      if (!response.ok || body.ready !== true || application?.ok !== true) {
        throw new Error(body.code && body.error ? `${body.code}: ${body.error}` : body.error || "Parent application could not be prepared.");
      }
      const reference = typeof application.application_ref === "string" ? application.application_ref : String(application.application_id ?? "Prepared");
      setPreparedApplications(old => ({ ...old, [item.match_ref]: reference }));
      setNotice(`Application preparation record ${reference} saved. This is a draft and has not been submitted to the provider.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Application preparation failed. Your saved opportunity remains available.");
    } finally { setSaving(""); }
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
        </div>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{error}</section>}
      {notice && <section role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">{notice} <a href="/candidate/applications" className="ml-1 font-semibold underline">Open application tracker</a></section>}
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
                  <div className="mt-4">
                    <button type="button" aria-expanded={expanded[item.match_ref] === true}
                      onClick={() => setExpanded(old => ({ ...old, [item.match_ref]: !old[item.match_ref] }))}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
                      {expanded[item.match_ref] ? "Hide source and eligibility details" : "View source and eligibility details"}
                    </button>
                    {expanded[item.match_ref] && <section className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <p><strong>Listing state:</strong> Open at the last source check shown above. Backend rechecks freshness and review status when saving.</p>
                      <p className="mt-2"><strong>Eligibility:</strong> {item.eligibility.rules || "Candidate-specific eligibility is unverified and needs review."}</p>
                      <p className="mt-2"><strong>Source evidence references:</strong> {item.source_evidence.length ? item.source_evidence.join(", ") : "Missing; the listing should not be published without evidence."}</p>
                      <p className="mt-2"><strong>Deadline evidence:</strong> {item.deadline.evidence?.length ? item.deadline.evidence.join(", ") : item.deadline.message || "No current confirmed deadline evidence; check the official page."}</p>
                      <p className="mt-2 break-all"><strong>Canonical official URL:</strong> {item.official_link}</p>
                    </section>}
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-slate-800">Prepare under pathway
                    <select aria-label={`Application pathway for ${item.title}`} value={selectedPathways[item.match_ref] ?? (pathway !== "ALL" && item.pathways.includes(pathway) ? pathway : item.pathways[0] ?? "")} onChange={e=>setSelectedPathways(old=>({...old,[item.match_ref]:e.target.value}))}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" disabled={!item.pathways.length}>
                      {item.pathways.map(p=><option key={p} value={p}>{PATHWAYS.find(x=>x[0]===p)?.[1]??p}</option>)}
                    </select>
                  </label>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={()=>void saveOpportunity(item)} disabled={saving===`save:${item.match_ref}` || saving===`prepare:${item.match_ref}`}
                      className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
                      {saving===`save:${item.match_ref}`?"Saving…":savedTargets[item.match_ref]?"Saved to account":"Save opportunity"}
                    </button>
                    <button type="button" onClick={()=>void prepareApplication(item)} disabled={!savedTargets[item.match_ref] || saving===`prepare:${item.match_ref}`}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50">
                      {saving===`prepare:${item.match_ref}`?"Preparing…":preparedApplications[item.match_ref]? `Draft ${preparedApplications[item.match_ref]}`:"Prepare application"}
                    </button>
                    <a href={item.official_link} target="_blank" rel="noopener noreferrer"
                      className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Open official opportunity ↗</a>
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
