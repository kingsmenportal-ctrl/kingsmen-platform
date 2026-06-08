"use client";

import { useEffect, useMemo, useState } from "react";

const PJ18_MARKER = "PERSONAL_JOBS_18_SOUTH_AFRICAN_JOB_SOURCE_EXPANSION_REAL_LOCAL_LEAD_ADAPTERS";
const PJ18_LEADS_KEY = "kingsmen.personalJobs18.saDiscoveredLeads.v1";
const PJ02_LEADS_KEY = "kingsmen.personalJobs02.externalLeads.v1";

type Lead = {
  id?: string;
  title: string;
  company: string;
  location: string;
  applyUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  sourceLabel?: string;
  sourceGroup?: string;
  sourceConfidence?: number;
  fitScore?: number;
  band?: string;
  notes?: string;
  status?: string;
  discoveredAt?: string;
};

type RunResult = {
  status: string;
  generatedAt?: string;
  discoveredCount?: number;
  pj02CompatibleCount?: number;
  combinedPj02CompatibleCount?: number;
  searchQueries?: string[];
  leads?: Lead[];
  pj02CompatibleLeads?: Lead[];
  combinedPj02CompatibleLeads?: Lead[];
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
    const raw = window.localStorage.getItem(PJ18_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.leads) ? parsed.leads : [];
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

export default function SaSourcesClient() {
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLeads(readStoredLeads());
  }, []);

  const topLeads = useMemo(() => {
    return [...leads].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0)).slice(0, 60);
  }, [leads]);

  async function runSaSources() {
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/sa-sources/run", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        }
      });

      const json = (await response.json()) as RunResult;

      if (!response.ok) {
        throw new Error(json.error || "South African source runner failed.");
      }

      const nextLeads = json.leads ?? [];
      const combined = json.combinedPj02CompatibleLeads ?? json.pj02CompatibleLeads ?? [];

      window.localStorage.setItem(
        PJ18_LEADS_KEY,
        JSON.stringify({
          marker: PJ18_MARKER,
          updatedAt: new Date().toISOString(),
          leads: nextLeads
        })
      );

      window.localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify(combined));

      setRunResult(json);
      setLeads(nextLeads);
      setMessage(`SA source runner completed. ${nextLeads.length} local leads found and ${combined.length} total leads exported to PJ02.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }

  function exportToPj02Again() {
    const pj02Compatible = leads.map((lead) => ({
      source: "PERSONAL-JOBS-18",
      title: lead.title,
      company: lead.company,
      location: lead.location,
      sourceUrl: lead.applyUrl || lead.sourceUrl || "",
      applyUrl: lead.applyUrl || lead.sourceUrl || "",
      sourceName: lead.sourceName || lead.sourceLabel || "PJ18 SA source runner",
      sourceConfidence: lead.sourceConfidence ?? 0.5,
      fitScore: lead.fitScore ?? 0,
      band: lead.band || fitLabel(lead.fitScore),
      notes: lead.notes || "",
      status: "SA_DISCOVERED_PENDING_REVIEW",
      discoveredAt: lead.discoveredAt || new Date().toISOString(),
      manualApprovalRequired: true,
      countryFocus: "South Africa"
    }));

    window.localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify(pj02Compatible));
    setMessage(`${pj02Compatible.length} South African leads exported to PJ02 local intake.`);
  }

  return (
    <main className="pj18-shell">
      <section className="hero">
        <p className="eyebrow">PERSONAL-JOBS-18</p>
        <h1>South African Job Source Expansion</h1>
        <p className="summary">
          This expands Kingsmen from generic international job discovery into South African source scouting:
          public-sector circulars, retail careers, company career pages, and reviewable job-board search landings.
          Manual job entry remains fallback only.
        </p>

        <div className="actions">
          <button type="button" onClick={runSaSources} disabled={running}>
            {running ? "Scanning SA sources..." : "Run SA source runner"}
          </button>
          <button type="button" onClick={exportToPj02Again} disabled={leads.length === 0}>
            Export SA leads to PJ02
          </button>
          <a href="/personal-job-desk/job-finder">Open PJ17 job finder</a>
          <a href="/personal-job-desk/shortlist">Open shortlist desk</a>
        </div>

        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="status-grid">
        <article>
          <strong>{leads.length}</strong>
          <span>SA leads</span>
        </article>
        <article>
          <strong>{runResult?.sourcesTried?.length ?? "—"}</strong>
          <span>Sources checked</span>
        </article>
        <article>
          <strong>{runResult?.searchQueries?.length ?? "—"}</strong>
          <span>Profile queries</span>
        </article>
        <article>
          <strong>No auto-apply</strong>
          <span>Approval required</span>
        </article>
      </section>

      {runResult?.sourcesTried?.length ? (
        <section className="panel">
          <h2>South African source run</h2>
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
        <h2>South African opportunities</h2>
        {topLeads.length === 0 ? (
          <p className="muted">
            No SA leads loaded yet. Press “Run SA source runner”. Kingsmen will use your one local profile
            and the South African source registry to build reviewable local opportunities.
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
                <p>{(lead.notes || "").slice(0, 260)}</p>
                {lead.applyUrl || lead.sourceUrl ? (
                  <a href={lead.applyUrl || lead.sourceUrl} target="_blank" rel="noreferrer">
                    Review source
                  </a>
                ) : (
                  <span className="muted">No source URL captured</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="boundary">
        <h2>Locked safety boundary</h2>
        <p>
          PJ18 finds and prepares South African leads. It does not submit applications, send emails,
          send WhatsApp messages, contact employers, touch payments, use private credentials, bypass
          CAPTCHA/OTP/login walls, or claim production deployment.
        </p>
      </section>

      <style>{`
        .pj18-shell {
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
          .pj18-shell {
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