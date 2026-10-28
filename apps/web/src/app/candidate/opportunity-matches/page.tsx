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

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

function formatDate(value?: string | null): string {
  if (!value) return "Not verified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not verified" : date.toLocaleString();
}

function deadlineLabel(item: Opportunity): string {
  const status = (item.deadline.status || "").toUpperCase();
  if (status === "CLOSED" || status === "EXPIRED") return "Closed";
  if (status === "STALE" || status === "UNVERIFIED") return "Not currently verified";
  if (item.deadline.closes_at) return formatDate(item.deadline.closes_at);
  return item.deadline.message || "Not verified — check the official page.";
}

export default function CandidateOpportunityMatchesPage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [pathway, setPathway] = useState("ALL");
  const [query, setQuery] = useState("");
  const [deadlineOrder, setDeadlineOrder] = useState("RELEVANCE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMatches() {
    setLoading(true);
    setError("");
    setFeed(null);
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
  }

  const opportunities = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const filtered = (feed?.opportunities ?? []).filter(item => {
      const pathwayMatches = pathway === "ALL" || item.pathways.includes(pathway);
      const textMatches = !term || [
        item.title, item.provider, item.location, item.recommendation_summary, item.sector
      ].some(value => (value || "").toLocaleLowerCase().includes(term));
      return pathwayMatches && textMatches;
    });
    if (deadlineOrder === "CLOSING_FIRST") {
      return filtered.sort((a, b) => {
        const da = a.deadline.closes_at ? new Date(a.deadline.closes_at).getTime() : Number.POSITIVE_INFINITY;
        const db = b.deadline.closes_at ? new Date(b.deadline.closes_at).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return filtered;
  }, [feed, pathway, query, deadlineOrder]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kingsmen One · Opportunity Intelligence</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Find your next opportunity</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Explore approved matches across higher education, TVET, SETA programmes and learnerships, internships, apprenticeships, and employment. Kingsmen helps you prepare and navigate applications; providers retain authority over eligibility, receipt, selection and outcomes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={loadMatches} disabled={loading}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Checking verified matches…" : "Load my verified matches"}
          </button>
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Candidate dashboard</a>
          <a href="/candidate/documents" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">My documents</a>
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
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
              <label className="text-sm font-semibold text-slate-700">
                Search opportunities
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Title, provider, location or keyword"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Pathway
                <select value={pathway} onChange={e => setPathway(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="ALL">All six pathways</option>
                  {PATHWAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Sort by
                <select value={deadlineOrder} onChange={e => setDeadlineOrder(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="RELEVANCE">Recommended match order</option>
                  <option value="CLOSING_FIRST">Earliest verified deadline</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700"><strong>{opportunities.length}</strong> of {feed.count ?? (feed.opportunities ?? []).length} approved match(es) shown.</p>
              {(query || pathway !== "ALL" || deadlineOrder !== "RELEVANCE") && (
                <button type="button" onClick={() => { setQuery(""); setPathway("ALL"); setDeadlineOrder("RELEVANCE"); }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Clear filters</button>
              )}
            </div>
          </section>

          {opportunities.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-bold text-slate-900">No opportunities match these filters</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feed.empty_reason || "Try another pathway or search term. Kingsmen will not substitute stale or unreviewed listings to fill this page."}</p>
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
                    <div><dt className="inline font-semibold text-slate-800">Official source checked: </dt><dd className="inline text-slate-600">{formatDate(item.source_checked_at)}</dd></div>
                    <div><dt className="inline font-semibold text-slate-800">Deadline: </dt><dd className="inline text-slate-600">{deadlineLabel(item)}</dd></div>
                    <div><dt className="inline font-semibold text-slate-800">Eligibility: </dt><dd className="inline text-slate-600">{item.eligibility?.rules || "Candidate-specific review required; eligibility is not guaranteed."}</dd></div>
                    <div><dt className="inline font-semibold text-slate-800">Evidence references: </dt><dd className="inline text-slate-600">{item.source_evidence?.length ?? 0} source reference(s) recorded</dd></div>
                  </dl>
                  <a href={item.official_link} target="_blank" rel="noopener noreferrer"
                    className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Continue on official provider site ↗</a>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      <footer className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        Source freshness is checked by the authorised feed. If source evidence is stale or insufficient, the opportunity should be withheld. Candidate-reported submission, Kingsmen-recorded evidence, provider-confirmed receipt and provider-issued outcome remain separate events. A Kingsmen match is not an offer or a guarantee.
      </footer>
    </main>
  );
}
