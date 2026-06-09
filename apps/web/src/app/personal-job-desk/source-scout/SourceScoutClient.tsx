"use client";

import { useMemo, useState } from "react";

const PJ19_MARKER = "PERSONAL_JOBS_19_PLAYWRIGHT_SOURCE_QUEUE_EMPLOYER_CAREER_PAGE_SCOUT_SA_SOURCE_HEALTH_REPORT";
const PJ19_LEADS_KEY = "kingsmen.personalJobs19.playwrightScoutLeads.v1";
const PJ19_HEALTH_KEY = "kingsmen.personalJobs19.sourceHealth.v1";
const PJ02_LEADS_KEY = "kingsmen.personalJobs02.externalLeads.v1";

type Lead = {
  id?: string;
  title: string;
  company: string;
  location: string;
  applyUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  sourceConfidence?: number;
  fitScore?: number;
  band?: string;
  notes?: string;
  status?: string;
  discoveredAt?: string;
};

type Health = {
  sourceId: string;
  sourceLabel: string;
  url: string;
  company?: string;
  group?: string;
  status: string;
  statusReason?: string;
  extractedLinkCount?: number;
  jobLikeLinkCount?: number;
  leadCount?: number;
};

type RunResult = {
  status: string;
  generatedAt?: string;
  queueCount?: number;
  sourceHealthCount?: number;
  discoveredCount?: number;
  pj02CompatibleCount?: number;
  combinedPj02CompatibleCount?: number;
  sourceHealth?: Health[];
  leads?: Lead[];
  pj02CompatibleLeads?: Lead[];
  combinedPj02CompatibleLeads?: Lead[];
  error?: string;
};

function scoreLabel(score?: number) {
  if (typeof score !== "number") return "Unscored";
  if (score >= 80) return "Crown target";
  if (score >= 65) return "Strong route";
  if (score >= 45) return "Watchlist";
  return "Research first";
}

export default function SourceScoutClient() {
  const [running, setRunning] = useState(false);
  const [limit, setLimit] = useState(8);
  const [headed, setHeaded] = useState(false);
  const [message, setMessage] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [health, setHealth] = useState<Health[]>([]);

  const topLeads = useMemo(() => {
    return [...leads].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0)).slice(0, 80);
  }, [leads]);

  async function runScout() {
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/source-scout/run", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          limit,
          headed
        })
      });

      const json = (await response.json()) as RunResult;

      if (!response.ok) {
        throw new Error(json.error || "Playwright source scout failed.");
      }

      const nextLeads = json.leads ?? [];
      const nextHealth = json.sourceHealth ?? [];
      const combined = json.combinedPj02CompatibleLeads ?? json.pj02CompatibleLeads ?? [];

      window.localStorage.setItem(
        PJ19_LEADS_KEY,
        JSON.stringify({
          marker: PJ19_MARKER,
          updatedAt: new Date().toISOString(),
          leads: nextLeads
        })
      );

      window.localStorage.setItem(
        PJ19_HEALTH_KEY,
        JSON.stringify({
          marker: PJ19_MARKER,
          updatedAt: new Date().toISOString(),
          sourceHealth: nextHealth
        })
      );

      window.localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify(combined));

      setRunResult(json);
      setLeads(nextLeads);
      setHealth(nextHealth);
      setMessage(`Source scout completed. ${nextLeads.length} Playwright leads found. ${combined.length} total leads exported to PJ02.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }

  function exportAgain() {
    const pj02Compatible = leads.map((lead) => ({
      source: "PERSONAL-JOBS-19",
      title: lead.title,
      company: lead.company,
      location: lead.location,
      sourceUrl: lead.applyUrl || lead.sourceUrl || "",
      applyUrl: lead.applyUrl || lead.sourceUrl || "",
      sourceName: lead.sourceName || "PJ19 Playwright source scout",
      sourceConfidence: lead.sourceConfidence ?? 0.5,
      fitScore: lead.fitScore ?? 0,
      band: lead.band || scoreLabel(lead.fitScore),
      notes: lead.notes || "",
      status: "PLAYWRIGHT_SCOUT_PENDING_REVIEW",
      discoveredAt: lead.discoveredAt || new Date().toISOString(),
      manualApprovalRequired: true,
      countryFocus: "South Africa"
    }));

    window.localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify(pj02Compatible));
    setMessage(`${pj02Compatible.length} Playwright scout leads exported to PJ02 local intake.`);
  }

  return (
    <main className="pj19-shell">
      <section className="hero">
        <p className="eyebrow">PERSONAL-JOBS-19</p>
        <h1>Playwright Source Scout</h1>
        <p className="summary">
          This is the controlled browser scout for South African career pages. It opens public source pages,
          waits for rendered content, extracts visible opportunity links, records source health, and exports
          leads back to the Personal Job Desk. It does not apply, log in, bypass CAPTCHA, or contact employers.
        </p>

        <div className="controls">
          <label>
            Targets
            <input
              type="number"
              min={1}
              max={25}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={headed}
              onChange={(event) => setHeaded(event.target.checked)}
            />
            Show browser window
          </label>
        </div>

        <div className="actions">
          <button type="button" onClick={runScout} disabled={running}>
            {running ? "Scouting with Playwright..." : "Run Playwright source scout"}
          </button>
          <button type="button" onClick={exportAgain} disabled={leads.length === 0}>
            Export scout leads to PJ02
          </button>
          <a href="/personal-job-desk/sa-sources">Open PJ18 SA sources</a>
          <a href="/personal-job-desk/shortlist">Open shortlist desk</a>
        </div>

        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="status-grid">
        <article>
          <strong>{runResult?.queueCount ?? "—"}</strong>
          <span>Targets queued</span>
        </article>
        <article>
          <strong>{health.length}</strong>
          <span>Health checks</span>
        </article>
        <article>
          <strong>{leads.length}</strong>
          <span>Scout leads</span>
        </article>
        <article>
          <strong>No auto-apply</strong>
          <span>Approval required</span>
        </article>
      </section>

      <section className="panel">
        <h2>Source health report</h2>
        {health.length === 0 ? (
          <p className="muted">Run the scout to see portal health: rendered, blocked, timeout, login wall, CAPTCHA, or manual review required.</p>
        ) : (
          <div className="health-list">
            {health.map((item) => (
              <article key={`${item.sourceId}-${item.url}`} className="health-row">
                <div>
                  <b>{item.sourceLabel}</b>
                  <small>{item.url}</small>
                </div>
                <span>{item.status}</span>
                <span>{item.leadCount ?? 0} leads</span>
                {item.statusReason ? <p>{item.statusReason}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Playwright scout leads</h2>
        {topLeads.length === 0 ? (
          <p className="muted">
            No scout leads loaded yet. Press “Run Playwright source scout”. This is where Kingsmen handles
            JavaScript-rendered career pages that normal HTML fetching cannot read.
          </p>
        ) : (
          <div className="lead-grid">
            {topLeads.map((lead, index) => (
              <article key={`${lead.id ?? lead.title}-${index}`} className="lead-card">
                <div className="lead-head">
                  <span>{lead.band || scoreLabel(lead.fitScore)}</span>
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
          PJ19 uses Playwright only as a scout. It does not submit applications, send emails, send WhatsApp
          messages, contact employers, touch payments, use credentials, bypass login, bypass OTP, bypass
          CAPTCHA, or claim Oracle/production deployment.
        </p>
      </section>

      <style>{`
        .pj19-shell {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(36, 194, 255, 0.2), transparent 34rem),
            linear-gradient(135deg, #020814 0%, #07111e 48%, #081a2f 100%);
          color: #eaf8ff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .hero,
        .panel,
        .boundary,
        .status-grid article,
        .lead-card,
        .health-row {
          border: 1px solid rgba(82, 213, 255, 0.28);
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
          color: #52d5ff;
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
          color: #52d5ff;
        }

        h3 {
          margin: 12px 0 6px;
        }

        .summary {
          max-width: 980px;
          color: #b9d9ea;
          line-height: 1.7;
        }

        .controls,
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
          align-items: center;
        }

        .controls label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #b9d9ea;
        }

        .controls .check {
          flex-direction: row;
          align-items: center;
        }

        input[type="number"] {
          width: 100px;
          border-radius: 14px;
          border: 1px solid rgba(82, 213, 255, 0.35);
          background: rgba(0, 0, 0, 0.24);
          color: #eaf8ff;
          padding: 10px 12px;
        }

        button,
        .actions a,
        .lead-card a {
          border: 1px solid rgba(82, 213, 255, 0.38);
          background: #52d5ff;
          color: #03101a;
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
          color: #52d5ff;
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
          color: #52d5ff;
        }

        .status-grid span,
        .muted {
          color: #9fb8c8;
        }

        .health-list {
          display: grid;
          gap: 10px;
        }

        .health-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 210px 90px;
          gap: 12px;
          align-items: center;
          padding: 14px;
        }

        .health-row small {
          display: block;
          color: #9fb8c8;
          overflow-wrap: anywhere;
          margin-top: 4px;
        }

        .health-row p {
          grid-column: 1 / -1;
          color: #b9d9ea;
          margin: 0;
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
          color: #52d5ff;
        }

        .company {
          color: #eaf8ff;
          font-weight: 700;
        }

        .lead-card p {
          line-height: 1.55;
        }

        @media (max-width: 760px) {
          .pj19-shell {
            padding: 16px;
          }

          .health-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}