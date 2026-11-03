"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./saved-opportunities.module.css";

const PATHWAYS: Record<string, string> = {
  HIGHER_EDUCATION: "Higher Education", higher_education: "Higher Education",
  TVET: "TVET", tvet: "TVET",
  SETA_LEARNERSHIP: "SETA programmes & learnerships", seta_learnership: "SETA programmes & learnerships",
  INTERNSHIP: "Internships", internship: "Internships",
  APPRENTICESHIP: "Apprenticeships", apprenticeship: "Apprenticeships",
  EMPLOYMENT: "Employment", employment: "Employment"
};

type MasterTarget = {
  id?: string; target_key?: string; pathway_type?: string; provider_name?: string; programme_or_role?: string;
  provider_application_url?: string; source_reference?: string; source_confidence?: string;
  planning_status?: string; application_id?: string | null; created_at?: string; updated_at?: string;
};
type SavedOpportunity = { id?: string; title?: string; organisation?: string; official_url?: string; pathway?: string; closing_date?: string | null };
type Tracker = {
  id?: string; status?: string; candidate_note?: string; evidence_reference?: string; created_at?: string; updated_at?: string;
  candidate_workspace_saved_opportunities?: SavedOpportunity | SavedOpportunity[] | null;
};
type Feed = {
  ready?: boolean; error?: string; code?: string; message?: string;
  trackers?: Tracker[]; masterTargets?: MasterTarget[]; parentApplications?: Array<Record<string, unknown>>;
};
type SavedCard = {
  key: string; title: string; provider: string; pathway: string; url: string; status: string;
  sourceReference: string; createdAt: string; closingDate?: string | null;
};

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

export default function SavedOpportunitiesClient() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = getAccessToken();
      if (!url || !anonKey) throw new Error("Saved opportunity loading is not configured for this deployment.");
      if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");
      const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/candidate-application-preparation", {
        method: "POST",
        headers: { apikey: anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load" }),
        cache: "no-store"
      });
      const result = await response.json() as Feed;
      if (!response.ok || result.ready !== true) {
        throw new Error(result.error || result.message || result.code || ("Could not load saved opportunities (" + response.status + ")."));
      }
      setFeed(result);
    } catch (e) {
      setFeed(null);
      setError(e instanceof Error ? e.message : "Could not load saved opportunity records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSaved(); }, [loadSaved]);

  const cards = useMemo(() => {
    const result = new Map<string, SavedCard>();
    for (const target of feed?.masterTargets ?? []) {
      const key = target.target_key || target.id || ((target.provider_name || "Provider") + "-" + (target.programme_or_role || "Target"));
      result.set(key, {
        key,
        title: target.programme_or_role || "Saved application target",
        provider: target.provider_name || "Provider not recorded",
        pathway: target.pathway_type || "UNKNOWN",
        url: target.provider_application_url || "",
        status: target.planning_status || "PLANNING",
        sourceReference: target.source_reference || "Application target reference not available",
        createdAt: target.created_at || target.updated_at || "",
        closingDate: null
      });
    }
    for (const tracker of feed?.trackers ?? []) {
      const value = tracker.candidate_workspace_saved_opportunities;
      const opportunity = Array.isArray(value) ? value[0] : value;
      if (!opportunity) continue;
      const url = opportunity.official_url || "";
      const key = "saved:" + (url || opportunity.id || tracker.id || opportunity.title || "unknown");
      if (!result.has(key)) {
        result.set(key, {
          key, title: opportunity.title || "Saved opportunity", provider: opportunity.organisation || "Provider not recorded",
          pathway: opportunity.pathway || "UNKNOWN", url, status: tracker.status || "SAVED",
          sourceReference: tracker.evidence_reference || "Saved opportunity record",
          createdAt: tracker.created_at || tracker.updated_at || "", closingDate: opportunity.closing_date
        });
      } else {
        const existing = result.get(key);
        if (existing) {
          existing.status = tracker.status || existing.status;
          existing.sourceReference = tracker.evidence_reference || existing.sourceReference;
          existing.closingDate = opportunity.closing_date;
        }
      }
    }
    const all = Array.from(result.values());
    return filter === "ALL" ? all : all.filter(item => item.pathway === filter || item.pathway.toUpperCase() === filter);
  }, [feed, filter]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Saved opportunity navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.mark} aria-hidden="true">K</span>
            <span><strong>KINGSMEN</strong><small>SAVED OPPORTUNITIES</small></span>
          </a>
          <div className={styles.navLinks}>
            <a href="/candidate/dashboard">Dashboard</a>
            <a href="/candidate/profile">Profile & consent</a>
            <a href="/candidate/opportunity-matches">Verified matches</a>
            <a href="/candidate/workbench">Application workbench</a>
          </div>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Candidate workspace · Saved records</p>
          <h1>Your saved opportunities.</h1>
          <p className={styles.lead}>
            This list is loaded from Kingsmen’s authenticated application-preparation service. A saved record is not proof that the opportunity is still open;
            revisit the official provider source and let Kingsmen recheck freshness before relying on a deadline or eligibility detail.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={() => void loadSaved()} disabled={loading} className={styles.primary}>
              {loading ? "Loading saved records…" : "Reload saved records"}
            </button>
            <a className={styles.secondary} href="/candidate/opportunity-matches">Find verified opportunities ↗</a>
          </div>
        </header>

        {error && (
          <section className={styles.error} role="alert">
            {error}
            {error.includes("IDENTITY_NOT_VERIFIED") || error.toLowerCase().includes("identity")
              ? " Saved application records remain locked until an authorised reviewer verifies your identity link." : ""}
            <div className={styles.actions}><a className={styles.secondary} href="/candidate/profile">Open candidate profile</a></div>
          </section>
        )}

        {!error && feed && (
          <>
            <section className={styles.summary}>
              <span>{cards.length} saved target(s) loaded from the service.</span>
              <label>
                Pathway
                <select value={filter} onChange={e => setFilter(e.target.value)} style={{ marginLeft: 8, minHeight: 36, border: "1px solid #46566c", borderRadius: 8, background: "#080f1b", color: "#f2f0e8", padding: "6px 9px" }}>
                  <option value="ALL">All pathways</option>
                  {Object.entries(PATHWAYS).filter(([key]) => key.toUpperCase() === key).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                </select>
              </label>
            </section>

            {cards.length === 0 ? (
              <section className={styles.empty}>
                <h2>No saved opportunities are listed yet.</h2>
                <p>Load the verified opportunity feed, choose an eligible listing and select “Save to application workbench”. Kingsmen will recheck source and identity requirements when saving.</p>
                <div className={styles.actions}><a className={styles.secondary} href="/candidate/opportunity-matches">Open verified opportunity feed</a></div>
              </section>
            ) : (
              <section className={styles.grid} aria-label="Saved opportunity records">
                {cards.map(item => (
                  <article className={styles.card} key={item.key}>
                    <div className={styles.tags}>
                      <span className={styles.tag}>{PATHWAYS[item.pathway] || PATHWAYS[item.pathway.toUpperCase()] || item.pathway}</span>
                      <span className={styles.tag}>{item.status.replaceAll("_", " ")}</span>
                    </div>
                    <h2>{item.title}</h2>
                    <p className={styles.provider}>{item.provider}</p>
                    <dl className={styles.facts}>
                      <div className={styles.fact}><dt>Record state</dt><dd>{item.status.replaceAll("_", " ")}</dd></div>
                      <div className={styles.fact}><dt>Saved target</dt><dd>{item.key}</dd></div>
                      <div className={styles.fact}><dt>Deadline</dt><dd>{item.closingDate || "Not confirmed in saved target; recheck official page."}</dd></div>
                      <div className={styles.fact}><dt>Reference</dt><dd>{item.sourceReference}</dd></div>
                      {item.createdAt && <div className={styles.fact}><dt>Updated</dt><dd>{new Date(item.createdAt).toLocaleString()}</dd></div>}
                    </dl>
                    <div className={styles.cardActions}>
                      {item.url.startsWith("https://") && <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.routeLink}>Open official provider page ↗</a>}
                      <a href="/candidate/workbench" className={styles.routeLink}>Open application workbench</a>
                    </div>
                  </article>
                ))}
              </section>
            )}
            <section className={styles.notice}>
              {feed.message || "Saved application and preparation records loaded from the service."} No provider submission is implied. Candidate-reported submission, provider-confirmed receipt and provider-issued outcome remain separate.
            </section>
          </>
        )}

        <footer className={styles.footer}>
          A saved target is a planning record, not a current-open assertion. Provider links, dates, eligibility and submission receipts must be rechecked with official evidence.
        </footer>
      </div>
    </main>
  );
}
