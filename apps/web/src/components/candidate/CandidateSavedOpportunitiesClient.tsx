"use client";

import { useCallback, useEffect, useState } from "react";

type SavedOpportunity = {
  id: string;
  title: string;
  organisation: string;
  pathway: string;
  official_url: string;
  closing_date: string | null;
  created_at: string;
  updated_at: string;
};
type ProfileGate = { identityStatus?: string; consent?: { status?: string } };

const PATHWAY_LABELS: Record<string, string> = {
  higher_education: "Higher Education",
  tvet: "TVET",
  seta_learnership: "SETA programmes & learnerships",
  internship: "Internships",
  apprenticeship: "Apprenticeships",
  employment: "Employment",
  cao: "Higher Education / CAO",
  nsfas: "Funding / NSFAS",
  bursary: "Funding / bursary",
  accommodation: "Accommodation support"
};

function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let storageKey = "sb-euhubhhnumtibbyufghm-auth-token";
  try {
    if (url) {
      const ref = new URL(url).hostname.split(".")[0];
      if (ref) storageKey = `sb-${ref}-auth-token`;
    }
  } catch {}
  return { url, anonKey, storageKey };
}

function accessToken() {
  const config = authConfig();
  if (!config.url || !config.anonKey) throw new Error("Saved-opportunity access is not configured for this deployment.");
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(config.storageKey); } catch {}
  if (!raw) throw new Error("Sign in to view saved opportunities.");
  try {
    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (!session.access_token) throw new Error("Sign in to view saved opportunities.");
    if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) {
      throw new Error("Your session has expired. Sign in again to continue.");
    }
    return { ...config, token: session.access_token };
  } catch (caught) {
    if (caught instanceof Error && (caught.message.startsWith("Sign in") || caught.message.startsWith("Your session"))) throw caught;
    throw new Error("Your browser session could not be read. Sign in again.");
  }
}

function displayDate(value?: string | null) {
  if (!value) return "No verified date provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No verified date provided" : date.toLocaleDateString("en-ZA", { dateStyle: "medium" });
}

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function CandidateSavedOpportunitiesClient() {
  const [items, setItems] = useState<SavedOpportunity[]>([]);
  const [identityStatus, setIdentityStatus] = useState<string | null>(null);
  const [consentStatus, setConsentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const auth = accessToken();

      // The profile service verifies Auth -> candidate identity without using email equality.
      const gateResponse = await fetch(`${auth.url}/functions/v1/candidate-master-profile`, {
        method: "POST",
        headers: { apikey: auth.anonKey!, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load" }),
        cache: "no-store"
      });
      const gate = await gateResponse.json() as ProfileGate & { ok?: boolean; code?: string; error?: string };
      if (!gateResponse.ok || gate.ok === false) throw new Error(gate.error || gate.code || `Identity check failed (${gateResponse.status}).`);
      setIdentityStatus(gate.identityStatus ?? null);
      setConsentStatus(gate.consent?.status ?? null);

      if (gate.identityStatus !== "VERIFIED") {
        setItems([]);
        setLoadedAt(new Date().toISOString());
        return;
      }

      // Row-level security returns only rows owned by the verified candidate identity.
      const query = new URLSearchParams({
        select: "id,title,organisation,pathway,official_url,closing_date,created_at,updated_at",
        order: "updated_at.desc",
        limit: "100"
      });
      const response = await fetch(`${auth.url}/rest/v1/candidate_workspace_saved_opportunities?${query.toString()}`, {
        method: "GET",
        headers: {
          apikey: auth.anonKey!,
          Authorization: `Bearer ${auth.token}`,
          Accept: "application/json"
        },
        cache: "no-store"
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string; code?: string };
        throw new Error(body.message || body.code || `Saved records could not be loaded (${response.status}).`);
      }
      const rows = await response.json() as SavedOpportunity[];
      if (!Array.isArray(rows)) throw new Error("The saved-opportunity service returned an unexpected response.");
      setItems(rows.filter((row) => Boolean(row.id && row.title && safeHttpsUrl(row.official_url))));
      setLoadedAt(new Date().toISOString());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saved opportunities could not be loaded.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const requiresSignIn = error.startsWith("Sign in") || error.startsWith("Your session");

  return (
    <main className="public-site candidate-page">
      <div className="public-notice"><span aria-hidden="true" /> SAVED OPPORTUNITIES · Authenticated records with row-level security</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <a className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></a>
        <nav className="public-nav" aria-label="Candidate navigation"><a href="/candidate/dashboard/">Dashboard</a><a href="/candidate/profile/">Profile</a><a href="/candidate/opportunity-matches/">Opportunities ↗</a><a href="/candidate/workbench/">Workbench</a></nav>
      </div></header>
      <div className="public-container candidate-page-body">
        <header className="candidate-page-heading"><div><div className="public-eyebrow"><span /> YOUR SHORTLIST</div><h1>Saved opportunities <em>and next steps.</em></h1><p>Saved records belong to the authenticated candidate workspace. Saving a verified match prepares a parent application draft; it does not submit an application to the provider.</p></div><span className="candidate-preview-chip">{loading ? "LOADING" : identityStatus === "VERIFIED" ? "IDENTITY VERIFIED" : "REVIEW REQUIRED"}</span></header>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-500">{loadedAt ? `Last loaded: ${displayDate(loadedAt)}.` : "Saved records are loaded from the backend, not from browser-only storage."}</p>
          <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:border-slate-500 disabled:opacity-60">{loading ? "Loading…" : "Refresh saved records"}</button>
        </div>

        {error ? <section role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><strong className="block">{requiresSignIn ? "Sign-in required" : "Saved records need attention"}</strong><p className="mt-1">{error}</p>{requiresSignIn ? <a href="/candidate/login/" className="mt-3 inline-flex rounded-lg bg-slate-950 px-3 py-2 font-semibold text-white">Sign in</a> : null}</section> : null}

        {!loading && !error && identityStatus !== "VERIFIED" ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-800">Identity review boundary</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Your candidate identity needs verification.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{identityStatus === "PENDING_REVIEW" ? "Your profile is saved, but the candidate identity link remains pending. The saved-opportunity workflow is held until an authorised reviewer verifies the link." : "Complete the reusable profile first. Kingsmen will not expose another candidate's saved opportunities or link accounts by email equality."}</p>
            <a href="/candidate/profile/" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Open candidate profile →</a>
          </section>
        ) : null}

        {!loading && !error && identityStatus === "VERIFIED" && consentStatus !== "ACTIVE" ? (
          <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-800">Profile-processing consent is not active. You can view your saved records, but saving additional opportunities requires active consent. <a className="font-bold underline" href="/candidate/profile/">Review consent in your profile</a>.</section>
        ) : null}

        {loading ? <section className="candidate-doc-panel"><p className="text-sm text-slate-600">Verifying candidate identity and loading saved backend records…</p></section> : null}
        {!loading && !error && identityStatus === "VERIFIED" ? (
          items.length === 0 ? (
            <section className="candidate-doc-panel"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Your saved list is empty</p><h2 className="mt-2 text-xl font-bold text-slate-950">Start with a verified opportunity.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Only approved N15 matches with official, current-source evidence can be saved here. Saving creates a Kingsmen parent application draft; it does not send an application to the provider.</p><a className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" href="/candidate/opportunity-matches/">Load verified matches →</a></section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2" aria-label="Saved verified opportunities">
              {items.map((item) => {
                const officialUrl = safeHttpsUrl(item.official_url);
                return <article key={item.id} className="candidate-doc-panel">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">{PATHWAY_LABELS[item.pathway?.toLowerCase()] ?? item.pathway}</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.organisation}</p>
                  <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                    <div><dt className="inline font-semibold text-slate-800">Saved record updated: </dt><dd className="inline text-slate-600">{displayDate(item.updated_at)}</dd></div>
                    <div><dt className="inline font-semibold text-slate-800">Deadline stored: </dt><dd className="inline text-slate-600">{displayDate(item.closing_date)}</dd></div>
                  </dl>
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-slate-700">Saved status is not proof that the programme is still open. Recheck the current provider source, eligibility and deadline before acting.</p>
                  {officialUrl ? <a className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" href={officialUrl} target="_blank" rel="noopener noreferrer">Open official provider page ↗</a> : null}
                </article>;
              })}
            </section>
          )
        ) : null}
      </div>
      <footer className="public-footer public-container"><a className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></a><span>Provider receipt and final outcomes remain separate from saved records.</span></footer>
    </main>
  );
}
