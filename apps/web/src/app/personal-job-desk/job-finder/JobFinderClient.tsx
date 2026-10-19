"use client";

import { useEffect, useMemo, useState } from "react";

const PJ17_MARKER = "PERSONAL_JOBS_17_REAL_JOB_DISCOVERY_AGENT_ONE_PROFILE_JOB_FINDER_PLAYWRIGHT_SOURCE_SCOUT";
const PJ17_LEADS_KEY = "kingsmen.personalJobs17.discoveredLeads.v1";
const PJ02_LEADS_KEY = "kingsmen.personalJobs02.externalLeads.v1";

type Lead = {
  id?: string;
  title: string;
  company: string;
  location: string;
  applyUrl?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceName?: string;
  sourceConfidence?: number;
  fitScore?: number;
  band?: string;
  description?: string;
  notes?: string;
  status?: string;
  discoveredAt?: string;
};

type RunResult = {
  status: string;
  generatedAt?: string;
  discoveredCount?: number;
  pj02CompatibleCount?: number;
  searchQueries?: string[];
  leads?: Lead[];
  pj02CompatibleLeads?: Lead[];
  sourcesTried?: {
    sourceId: string;
    sourceLabel: string;
    skipped: boolean;
    failed: boolean;
    reason?: string | null;
    leadCount: number;
  }[];
  boundaries?: Record<string, boolean>;
  error?: string;
};

function readStoredLeads(): Lead[] {
  try {
    const raw = window.localStorage.getItem(PJ17_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.leads) ? parsed.leads : Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fitLabel(score?: number) {
  if (typeof score !== "number") return "Unscored";
  if (score >= 80) return "Crown target";
  if (score >= 65) return "Strong route";
  if (score >= 45) return "Watchlist";
  return "Research first";
}

function keyForLead(lead: Lead, index: number) {
  return [lead.title, lead.company, lead.location, lead.applyUrl || lead.sourceUrl || index].join("|").toLowerCase();
}

export default function JobFinderClient() {
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState("");
  const [savedLeadKeys, setSavedLeadKeys] = useState<string[]>([]);
  const [savingLeadKey, setSavingLeadKey] = useState("");

  useEffect(() => {
    setLeads(readStoredLeads());
  }, []);

  const topLeads = useMemo(() => {
    return [...leads].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0)).slice(0, 40);
  }, [leads]);

  async function runJobFinder() {
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/job-finder/run", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        }
      });

      const json = (await response.json()) as RunResult;

      if (!response.ok) {
        throw new Error(json.error || "Job finder failed.");
      }

      const nextLeads = json.leads ?? [];
      const pj02Compatible = json.pj02CompatibleLeads ?? [];

      window.localStorage.setItem(
        PJ17_LEADS_KEY,
        JSON.stringify({
          marker: PJ17_MARKER,
          updatedAt: new Date().toISOString(),
          leads: nextLeads
        })
      );

      window.localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify(pj02Compatible));

      setRunResult(json);
      setLeads(nextLeads);
      setMessage(`Job finder completed. ${nextLeads.length} leads discovered and ${pj02Compatible.length} leads exported to PJ02.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }

  async function saveLeadToWorkspace(lead: Lead, key: string) {
    const sourceUrl = lead.applyUrl || lead.sourceUrl || "";
    if (!lead.title.trim() || !lead.company.trim() || !sourceUrl) {
      setMessage("This lead needs a title, organisation, and source URL before it can be saved.");
      return;
    }
    setSavingLeadKey(key);
    setMessage("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addOpportunity",
          opportunity: {
            title: lead.title.slice(0, 180),
            organisation: lead.company.slice(0, 180),
            category: "JOB",
            applicationMethod: "PORTAL",
            sourceUrl: sourceUrl.slice(0, 1000),
            notes: [lead.location, lead.description || lead.notes || "", lead.sourceLabel || lead.sourceName || "Job discovery", typeof lead.fitScore === "number" ? `Fit score: ${lead.fitScore}/100` : ""].filter(Boolean).join(" | ").slice(0, 1800)
          }
        })
      });
      const data = await response.json();
      if (!response.ok || !["OPPORTUNITY_ADDED", "OPPORTUNITY_ALREADY_EXISTS"].includes(data.status)) {
        throw new Error(data.error || "The opportunity was not saved to your candidate workspace.");
      }
      setSavedLeadKeys((current) => current.includes(key) ? current : [...current, key]);
      setMessage(data.status === "OPPORTUNITY_ALREADY_EXISTS"
        ? `“${lead.title}” is already in your candidate workspace. Open the shortlist desk to review it.`
        : `Saved “${lead.title}” to your authenticated candidate workspace. Review it before preparing an application.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this opportunity.");
    } finally {
      setSavingLeadKey("");
    }
  }

  function exportToPj02Again() {
    const pj02Compatible = leads.map((lead) => ({
      source: "PERSONAL-JOBS-17",
      title: lead.title,
      company: lead.company,
      location: lead.location,
      sourceUrl: lead.applyUrl || lead.sourceUrl || "",
      applyUrl: lead.applyUrl || lead.sourceUrl || "",
      sourceName: lead.sourceLabel || lead.sourceName || "PJ17 discovery",
      sourceConfidence: lead.sourceConfidence ?? 0.5,
      fitScore: lead.fitScore ?? 0,
      band: lead.band || fitLabel(lead.fitScore),
      notes: lead.description || lead.notes || "",
      status: "DISCOVERED_PENDING_REVIEW",
      discoveredAt: lead.discoveredAt || new Date().toISOString(),
      manualApprovalRequired: true
    }));

    window.localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify(pj02Compatible));
    setMessage(`${pj02Compatible.length} discovered leads exported to PJ02 local intake.`);
  }

  return (
    <main className="pj17-shell">
      <section className="hero">
        <p className="eyebrow">PERSONAL-JOBS-17</p>
        <h1>Real Job Discovery Agent</h1>
        <p className="summary">
          Kingsmen now starts acting like the real job finder: it reads one local candidate profile,
          generates searches automatically, runs safe source adapters, scores opportunities, and exports
          discovered leads into the Personal Job Desk flow. Manual job entry is now only a fallback.
        </p>

        <div className="actions">
          <button type="button" onClick={runJobFinder} disabled={running}>
            {running ? "Finding jobs..." : "Run job finder"}
          </button>
          <button type="button" onClick={exportToPj02Again} disabled={leads.length === 0}>
            Export leads to PJ02
          </button>
          <a href="/personal-job-desk/shortlist">Open shortlist desk</a>
          <a href="/personal-job-desk/apply-pack">Open apply pack builder</a>
        </div>

        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="status-grid">
        <article>
          <strong>{leads.length}</strong>
          <span>Discovered leads</span>
        </article>
        <article>
          <strong>{runResult?.searchQueries?.length ?? "Ã¢â‚¬â€"}</strong>
          <span>Auto-generated searches</span>
        </article>
        <article>
          <strong>No auto-apply</strong>
          <span>Human approval required</span>
        </article>
        <article>
          <strong>One profile</strong>
          <span>No manual job-name entry required</span>
        </article>
      </section>

      {runResult?.sourcesTried?.length ? (
        <section className="panel">
          <h2>Source run</h2>
          <div className="source-list">
            {runResult.sourcesTried.map((source) => (
              <div key={source.sourceId} className="source-row">
                <b>{source.sourceLabel}</b>
                <span>{source.skipped ? "Skipped" : source.failed ? "Failed" : "Checked"}</span>
                <span>{source.leadCount} leads</span>
                {source.reason ? <small>{source.reason}</small> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Discovered opportunities</h2>
        {topLeads.length === 0 ? (
          <p className="muted">
            No leads loaded yet. Press Ã¢â‚¬Å“Run job finderÃ¢â‚¬Â. The agent will use your one local profile
            and the local source registry to search automatically.
          </p>
        ) : (
          <div className="lead-grid">
            {topLeads.map((lead, index) => (
              <article key={`${lead.id ?? lead.title}-${index}`} className="lead-card">
                <div className="lead-head">
                  <span>{lead.band || fitLabel(lead.fitScore)}</span>
                  <b>{lead.fitScore ?? 0}/100</b>
                </div>
                <h3>{lead.title}</h3>
                <p className="company">{lead.company}</p>
                <p className="muted">{lead.location}</p>
                <p>{(lead.description || lead.notes || "").slice(0, 240)}</p>
                {lead.applyUrl || lead.sourceUrl ? (
                  <>
                    <a href={lead.applyUrl || lead.sourceUrl} target="_blank" rel="noreferrer">
                      Review source
                    </a>
                    <button
                      type="button"
                      disabled={savedLeadKeys.includes(String(lead.id ?? keyForLead(lead, index))) || Boolean(savingLeadKey)}
                      onClick={() => void saveLeadToWorkspace(lead, String(lead.id ?? keyForLead(lead, index)))}
                      style={{ marginTop: 10 }}
                    >
                      {savedLeadKeys.includes(String(lead.id ?? keyForLead(lead, index)))
                        ? "Saved to workspace"
                        : savingLeadKey === String(lead.id ?? keyForLead(lead, index))
                          ? "Saving…"
                          : "Save to candidate workspace"}
                    </button>
                  </>
                ) : (
                  <span className="muted">No source URL captured — cannot save until a source is verified</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="boundary">
        <h2>Locked safety boundary</h2>
        <p>
          PJ17 finds, scores, and exports leads. It does not submit applications, send emails,
          send WhatsApp messages, contact employers, touch payments, use private credentials, bypass
          CAPTCHA/OTP/login walls, or claim production deployment.
        </p>
      </section>

      <style>{`
        .pj17-shell {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(214, 164, 61, 0.18), transparent 30rem),
            linear-gradient(135deg, #050505 0%, #111113 52%, #211807 100%);
          color: #f8f0db;
          font-family: Arial, Helvetica, sans-serif;
        }

        .hero,
        .panel,
        .boundary,
        .status-grid article,
        .lead-card {
          border: 1px solid rgba(255, 215, 122, 0.24);
          background: rgba(255, 255, 255, 0.055);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          border-radius: 24px;
        }

        .hero,
        .panel,
        .boundary {
          padding: 24px;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: #d7ad49;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 12px;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(34px, 7vw, 72px);
          line-height: 0.92;
          margin: 0 0 18px;
        }

        h2 {
          margin: 0 0 16px;
          color: #ffd77a;
        }

        h3 {
          margin: 12px 0 6px;
        }

        .summary {
          max-width: 980px;
          color: #d8caa8;
          line-height: 1.7;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }

        button,
        .actions a,
        .lead-card a {
          border: 1px solid rgba(255, 215, 122, 0.38);
          background: #d7ad49;
          color: #111;
          border-radius: 999px;
          padding: 12px 16px;
          text-decoration: none;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .actions a,
        .lead-card a {
          background: transparent;
          color: #ffd77a;
          display: inline-block;
        }

        .notice {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(80, 240, 142, 0.12);
          border: 1px solid rgba(80, 240, 142, 0.36);
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .status-grid article {
          padding: 18px;
        }

        .status-grid strong {
          display: block;
          font-size: 24px;
          color: #ffd77a;
        }

        .status-grid span,
        .muted {
          color: #b9ad92;
        }

        .source-list {
          display: grid;
          gap: 10px;
        }

        .source-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px 100px;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.18);
        }

        .source-row small {
          grid-column: 1 / -1;
          color: #b9ad92;
        }

        .lead-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .lead-card {
          padding: 18px;
        }

        .lead-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #ffd77a;
        }

        .company {
          color: #f8f0db;
          font-weight: 700;
        }

        .lead-card p {
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .pj17-shell {
            padding: 16px;
          }

          .source-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}