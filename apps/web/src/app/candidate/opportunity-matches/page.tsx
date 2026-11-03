"use client";

import { useMemo, useState } from "react";
import styles from "./opportunity-matches.module.css";

const PATHWAYS = [
  ["HIGHER_EDUCATION", "Higher Education"],
  ["TVET", "TVET"],
  ["SETA_LEARNERSHIP", "SETA programmes & learnerships"],
  ["INTERNSHIP", "Internships"],
  ["APPRENTICESHIP", "Apprenticeships"],
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
type SaveResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  savedTarget?: boolean;
  targetKey?: string;
  trackerId?: string;
  trackerLinked?: boolean;
  opportunity?: { title?: string; provider?: string; pathway?: string; officialUrl?: string; closingDate?: string | null };
};

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
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
  const [saveState, setSaveState] = useState<Record<string, "saving" | "saved" | "partial">>({});
  const [saveMessages, setSaveMessages] = useState<Record<string, string>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

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
      const body = await response.json() as Feed;
      if (!response.ok) {
        if (response.status === 403 && body.status === "IDENTITY_REVIEW_REQUIRED") {
          setFeed(body);
          return;
        }
        throw new Error(body.message || body.empty_reason || body.status || `Request failed (${response.status})`);
      }
      setFeed(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load verified opportunities.");
    } finally {
      setLoading(false);
    }
  }

  async function saveOpportunity(item: Opportunity) {
    setError("");
    setSaveErrors(current => ({ ...current, [item.match_ref]: "" }));
    setSaveMessages(current => ({ ...current, [item.match_ref]: "" }));
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = getAccessToken();
    if (!url || !anonKey) {
      setSaveErrors(current => ({ ...current, [item.match_ref]: "Saving is not configured for this deployment." }));
      return;
    }
    if (!token) {
      setSaveErrors(current => ({ ...current, [item.match_ref]: "Sign in first to save this opportunity." }));
      return;
    }

    setSaveState(current => ({ ...current, [item.match_ref]: "saving" }));
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/candidate-save-verified-opportunity`, {
        method: "POST",
        headers: { apikey: anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", match_ref: item.match_ref }),
        cache: "no-store"
      });
      const result = await response.json() as SaveResponse;
      if (!response.ok || result.ok !== true) {
        if (result.savedTarget) {
          setSaveState(current => ({ ...current, [item.match_ref]: "partial" }));
          setSaveMessages(current => ({
            ...current,
            [item.match_ref]: result.message || "The saved target exists, but preparation needs reconciliation. Open the workbench and retry."
          }));
          return;
        }
        throw new Error(result.error || result.message || result.code || `Save failed (${response.status})`);
      }
      setSaveState(current => ({ ...current, [item.match_ref]: "saved" }));
      setSaveMessages(current => ({ ...current, [item.match_ref]: result.message || "The service confirmed that the opportunity and parent-application draft were saved." }));
    } catch (e) {
      setSaveState(current => {
        const next = { ...current };
        delete next[item.match_ref];
        return next;
      });
      setSaveErrors(current => ({ ...current, [item.match_ref]: e instanceof Error ? e.message : "The save could not be confirmed." }));
    }
  }

  const opportunities = useMemo(() => (feed?.opportunities ?? []).filter(item =>
    pathway === "ALL" || item.pathways.includes(pathway)
  ), [feed, pathway]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Opportunity navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.mark} aria-hidden="true">K</span>
            <span className={styles.brandText}><strong>KINGSMEN</strong><small>VERIFIED OPPORTUNITY FEED</small></span>
          </a>
          <div className={styles.navLinks}>
            <a href="/candidate/dashboard">Candidate dashboard</a>
            <a href="/candidate/profile">Profile & consent</a>
            <a href="/candidate/saved-opportunities">Saved opportunities</a>
            <a href="/candidate/workbench">Application workbench</a>
          </div>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Kingsmen · N15 verified feed</p>
          <h1>Opportunity matches.</h1>
          <p className={styles.lead}>
            Review opportunities matched to your authorised Kingsmen identity. Only human-approved matches with current official-source evidence can appear here.
            Saving rechecks source, provider, deadline and identity gates, then creates a parent-application draft where the service confirms success. Saving does not submit anything to the provider.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={loadMatches} disabled={loading} className={styles.primary}>
              {loading ? "Checking verified matches…" : "Load my verified matches"}
            </button>
            <a href="/candidate/profile" className={styles.secondary}>Review profile & consent ↗</a>
          </div>
        </header>

        {error && <section role="alert" className={styles.error}>{error}</section>}
        {feed?.status === "IDENTITY_REVIEW_REQUIRED" && (
          <section className={styles.review}>
            <h2>Identity review required</h2>
            <p>{feed.message || "An authorised reviewer must verify your candidate identity before opportunity matching is available."}</p>
            <p>Candidate matching and saving remain locked until that review is confirmed. Profile consent does not override identity review.</p>
            <div className={styles.actions}><a href="/candidate/profile" className={styles.secondary}>Open candidate profile</a></div>
          </section>
        )}

        {feed?.status === "OK" && (
          <>
            <section className={styles.summary}>
              <p className={styles.summaryLine}><strong>{feed.count ?? 0}</strong> verified match(es) currently pass all publication gates.</p>
              <label className={styles.summaryLine}>
                Pathway
                <select value={pathway} onChange={e => setPathway(e.target.value)} className={styles.select}>
                  <option value="ALL">All six pathways</option>
                  {PATHWAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </section>

            {opportunities.length === 0 ? (
              <section className={styles.emptyState}>
                <h2>No matches cleared the current verification gates</h2>
                <p>{feed.empty_reason || "No verified matches are available for this pathway yet."} Kingsmen will not substitute stale or unreviewed listings to fill this page.</p>
              </section>
            ) : (
              <section className={styles.matchGrid} aria-label="Verified opportunity matches">
                {opportunities.map(item => (
                  <article key={item.match_ref} className={styles.card}>
                    <div className={styles.tags}>
                      {item.pathways.map(p => <span key={p} className={styles.tag}>{PATHWAYS.find(x => x[0] === p)?.[1] ?? p}</span>)}
                    </div>
                    <h2 className={styles.cardTitle}>{item.title}</h2>
                    <p className={styles.provider}>{item.provider}{item.location ? ` · ${item.location}` : ""}</p>
                    <p className={styles.summaryText}>{item.recommendation_summary}</p>
                    <dl className={styles.facts}>
                      <div className={styles.fact}><dt className={styles.label}>Source checked</dt><dd className={styles.value}>{new Date(item.source_checked_at).toLocaleString()}</dd></div>
                      <div className={styles.fact}><dt className={styles.label}>Deadline</dt><dd className={styles.value}>{item.deadline.closes_at ? new Date(item.deadline.closes_at).toLocaleString() : item.deadline.message || "Not verified — check the official page."}</dd></div>
                      <div className={styles.fact}><dt className={styles.label}>Eligibility</dt><dd className={styles.value}>Requires candidate-specific review; not guaranteed.</dd></div>
                      <div className={styles.fact}><dt className={styles.label}>Evidence</dt><dd className={styles.value}>{item.source_evidence.length} source evidence reference(s) provided by feed.</dd></div>
                    </dl>
                    <div className={styles.cardActions}>
                      <a href={item.official_link} target="_blank" rel="noopener noreferrer" className={styles.officialLink}>Open official opportunity ↗</a>
                      <button type="button" onClick={() => void saveOpportunity(item)} disabled={saveState[item.match_ref] === "saving" || saveState[item.match_ref] === "saved"} className={styles.button}>
                        {saveState[item.match_ref] === "saving" ? "Saving securely…" : saveState[item.match_ref] === "saved" ? "Saved to workbench ✓" : saveState[item.match_ref] === "partial" ? "Reconcile saved target" : "Save to application workbench"}
                      </button>
                    </div>
                    {saveMessages[item.match_ref] && (
                      <div className={styles.savedNotice} role="status">
                        {saveMessages[item.match_ref]}{" "}
                        <a href="/candidate/saved-opportunities">Open saved opportunities</a> · <a href="/candidate/workbench">Open workbench</a>
                      </div>
                    )}
                    {saveErrors[item.match_ref] && (
                      <div className={styles.error} role="alert">
                        {saveErrors[item.match_ref]}{" "}
                        {saveErrors[item.match_ref].includes("consent") || saveErrors[item.match_ref].includes("Consent") ? <a href="/candidate/profile">Review profile consent</a> : null}
                      </div>
                    )}
                  </article>
                ))}
              </section>
            )}
          </>
        )}

        <footer className={styles.footer}>
          Freshness is checked at read time and again when an opportunity is saved. If a source is stale or the provider route no longer passes the publication gates, saving is refused.
          Candidate-reported submission, provider-confirmed receipt and provider-issued outcome remain separate events. No admission, funding, placement, employment, or success is guaranteed.
        </footer>
      </div>
    </main>
  );
}
