"use client";

import { useEffect, useMemo, useState } from "react";

const PERSONAL_JOBS_16_MARKER = "PERSONAL_JOBS_16_GITHUB_PROOF_INDEX_BUILD_LEDGER_FOUNDER_HANDOVER";
const HANDOVER_KEY = "kingsmen.personalJobs16.founderHandover.v1";
const VISIT_KEY = "kingsmen.personalJobs16.githubProofIndex.v1";

type LedgerEntry = {
  id: string;
  title: string;
  route: string;
  proof: string;
  validation: string;
  boundary: string;
};

type FounderHandover = {
  reviewedAt: string;
  reviewedBy: string;
  commitReference: string;
  note: string;
};

const LEDGER: LedgerEntry[] = [
  {
    id: "PJ01",
    title: "Local Personal Job Desk",
    route: "/personal-job-desk",
    proof: "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json",
    validation: "reports/validation/personal-jobs-01-local-job-desk-latest.json",
    boundary: "Local desk only"
  },
  {
    id: "PJ02",
    title: "Local External Job Opportunity Intake",
    route: "/personal-job-desk/opportunities",
    proof: "reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json",
    validation: "reports/validation/personal-jobs-02-local-opportunity-intake-latest.json",
    boundary: "Local lead capture only"
  },
  {
    id: "PJ03",
    title: "Local Fit Scoring / Shortlist Decision Desk",
    route: "/personal-job-desk/shortlist",
    proof: "reports/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist-proof.json",
    validation: "reports/validation/personal-jobs-03-local-fit-scoring-shortlist-latest.json",
    boundary: "Local scoring only"
  },
  {
    id: "PJ04",
    title: "CV & Motivation Letter Apply Pack Builder",
    route: "/personal-job-desk/apply-pack",
    proof: "reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json",
    validation: "reports/validation/personal-jobs-04-cv-motivation-apply-pack-builder-latest.json",
    boundary: "Draft pack only"
  },
  {
    id: "PJ06",
    title: "Follow-Up Calendar / Interview Prep / Response Tracker",
    route: "/personal-job-desk/follow-up",
    proof: "reports/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker-proof.json",
    validation: "reports/validation/personal-jobs-06-follow-up-calendar-interview-response-tracker-latest.json",
    boundary: "Local follow-up tracking only"
  },
  {
    id: "PJ07",
    title: "Outcome Ledger / Offer Decision / Job Search Command Dashboard",
    route: "/personal-job-desk/outcomes",
    proof: "reports/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-job-search-command-dashboard-proof.json",
    validation: "reports/validation/personal-jobs-07-outcome-ledger-offer-decision-job-search-command-dashboard-latest.json",
    boundary: "Local outcome ledger only"
  },
  {
    id: "PJ08",
    title: "End-to-End Local Runtime Smoke Test / Navigation Hub / Real Use Gate",
    route: "/personal-job-desk/real-use-gate",
    proof: "reports/personal-jobs/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate-proof.json",
    validation: "reports/validation/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate-latest.json",
    boundary: "Local real-use gate only"
  },
  {
    id: "PJ10",
    title: "Personal Job Campaign Daily Operating Loop",
    route: "/personal-job-desk/daily-loop",
    proof: "reports/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop-proof.json",
    validation: "reports/validation/personal-jobs-10-personal-job-campaign-daily-operating-loop-latest.json",
    boundary: "Local daily operating loop only"
  },
  {
    id: "PJ11",
    title: "Local Job Search Import Desk",
    route: "/personal-job-desk/import-search",
    proof: "reports/personal-jobs/personal-jobs-11-local-job-search-import-desk-proof.json",
    validation: "reports/validation/personal-jobs-11-local-job-search-import-desk-latest.json",
    boundary: "Manual import only"
  },
  {
    id: "PJ12",
    title: "Real Job Search Source Runner / Verified Lead Finder",
    route: "/personal-job-desk/source-runner",
    proof: "reports/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-proof.json",
    validation: "reports/validation/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-latest.json",
    boundary: "Verified-source runner only"
  },
  {
    id: "PJ13",
    title: "PJ02 Lead Schema Compatibility Repair / Import Normalizer",
    route: "/personal-job-desk/import-normalizer",
    proof: "reports/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-proof.json",
    validation: "reports/validation/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-latest.json",
    boundary: "Local normalization only"
  },
  {
    id: "PJ14",
    title: "Personal Job Desk Navigation / Real Use Gate Expansion",
    route: "/personal-job-desk/navigation",
    proof: "reports/personal-jobs/personal-jobs-14-navigation-real-use-gate-expansion-proof.json",
    validation: "reports/validation/personal-jobs-14-navigation-real-use-gate-expansion-latest.json",
    boundary: "Local navigation only"
  },
  {
    id: "PJ15",
    title: "Personal Job Desk Runtime Click Test / Local UI Smoke Gate",
    route: "/personal-job-desk/runtime-click-test",
    proof: "reports/personal-jobs/personal-jobs-15-runtime-click-test-local-ui-smoke-gate-proof.json",
    validation: "reports/validation/personal-jobs-15-runtime-click-test-local-ui-smoke-gate-latest.json",
    boundary: "Local runtime click proof only"
  }
];

function safeReadHandover(): FounderHandover | null {
  try {
    const raw = window.localStorage.getItem(HANDOVER_KEY);
    return raw ? (JSON.parse(raw) as FounderHandover) : null;
  } catch {
    return null;
  }
}

export default function ProofIndexClient() {
  const [handover, setHandover] = useState<FounderHandover | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const visit = {
      marker: PERSONAL_JOBS_16_MARKER,
      visitedAt: new Date().toISOString(),
      route: "/personal-job-desk/proof-index"
    };

    window.localStorage.setItem(VISIT_KEY, JSON.stringify(visit));
    setHandover(safeReadHandover());
  }, []);

  const handoverText = useMemo(() => {
    return [
      "PERSONAL-JOBS-16 - Founder Handover",
      "Route: /personal-job-desk/proof-index",
      "Proof authority: repo files, proof reports, validation reports, Git commits, and clean working tree.",
      "Production boundary: local UI only. No email, WhatsApp, employer contact, payment, external calendar, scraping, Docker startup, Oracle deployment, or production release.",
      `Indexed modules: ${LEDGER.map((entry) => entry.id).join(", ")}`
    ].join("\n");
  }, []);

  async function copyHandover() {
    setCopied(false);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(handoverText);
      setCopied(true);
      return;
    }

    setCopied(false);
  }

  function markReviewed() {
    const next: FounderHandover = {
      reviewedAt: new Date().toISOString(),
      reviewedBy: "Founder",
      commitReference: "Fill after git commit and push",
      note: "Founder reviewed the Personal Job Desk proof index, build ledger, and local-only production boundary."
    };

    window.localStorage.setItem(HANDOVER_KEY, JSON.stringify(next));
    setHandover(next);
  }

  return (
    <main className="pj16-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Personal Job Desk</p>
          <h1>GitHub Proof Index / Build Ledger / Founder Handover</h1>
          <p className="summary">
            This page gives the founder one local, clickable proof index for the Personal Job Desk chain.
            It does not claim production readiness. It only records what has been locally built, proven,
            validated, and preserved through Git.
          </p>
        </div>

        <div className="status-card">
          <span className="status-dot" />
          <strong>Local proof gate</strong>
          <p>{LEDGER.length} prior modules indexed</p>
          <p className="muted">No-send boundary active</p>
        </div>
      </section>

      <section className="actions">
        <button type="button" onClick={copyHandover}>
          Copy founder handover summary
        </button>
        <button type="button" onClick={markReviewed}>
          Mark founder handover reviewed
        </button>
        <a href="/personal-job-desk/navigation">Open navigation hub</a>
        <a href="/personal-job-desk/runtime-click-test">Open runtime click test</a>
      </section>

      {copied ? <p className="notice">Founder handover summary copied locally.</p> : null}

      <section className="handover">
        <h2>Founder handover state</h2>
        {handover ? (
          <dl>
            <div>
              <dt>Reviewed at</dt>
              <dd>{handover.reviewedAt}</dd>
            </div>
            <div>
              <dt>Reviewed by</dt>
              <dd>{handover.reviewedBy}</dd>
            </div>
            <div>
              <dt>Commit reference</dt>
              <dd>{handover.commitReference}</dd>
            </div>
            <div>
              <dt>Note</dt>
              <dd>{handover.note}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">
            No founder handover review marker has been recorded in this browser yet.
          </p>
        )}
      </section>

      <section className="ledger">
        <h2>Build ledger</h2>
        <div className="ledger-grid">
          {LEDGER.map((entry) => (
            <article key={entry.id} className="ledger-card">
              <div className="ledger-head">
                <strong>{entry.id}</strong>
                <span>{entry.boundary}</span>
              </div>
              <h3>{entry.title}</h3>
              <a href={entry.route}>Open route</a>
              <p><b>Proof:</b> {entry.proof}</p>
              <p><b>Validation:</b> {entry.validation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="boundary">
        <h2>Locked boundary</h2>
        <p>
          PERSONAL-JOBS-16 is local UI only. It does not perform internet search, website scraping,
          email sending, WhatsApp sending, employer contact, application submission, payment processing,
          external calendar writing, Docker startup, Oracle deployment, or production release.
        </p>
      </section>

      <style>{`
        .pj16-shell {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(218, 165, 32, 0.16), transparent 28rem),
            linear-gradient(135deg, #050505 0%, #101014 52%, #1a1408 100%);
          color: #f8f0db;
          font-family: Arial, Helvetica, sans-serif;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 24px;
        }

        .eyebrow {
          color: #d7ad49;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 12px;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(32px, 6vw, 62px);
          line-height: 0.95;
          margin: 0 0 18px;
          max-width: 980px;
        }

        h2 {
          margin: 0 0 16px;
          color: #ffd77a;
        }

        h3 {
          margin: 12px 0;
          font-size: 18px;
        }

        .summary {
          max-width: 920px;
          color: #d8caa8;
          line-height: 1.7;
        }

        .status-card,
        .handover,
        .boundary,
        .ledger-card {
          border: 1px solid rgba(255, 215, 122, 0.24);
          background: rgba(255, 255, 255, 0.055);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          border-radius: 22px;
        }

        .status-card {
          padding: 22px;
        }

        .status-dot {
          width: 14px;
          height: 14px;
          display: inline-block;
          border-radius: 999px;
          background: #50f08e;
          box-shadow: 0 0 18px rgba(80, 240, 142, 0.9);
          margin-right: 10px;
          vertical-align: middle;
        }

        .muted {
          color: #b9ad92;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 22px 0;
        }

        button,
        .actions a,
        .ledger-card a {
          border: 1px solid rgba(255, 215, 122, 0.38);
          background: #d7ad49;
          color: #111;
          border-radius: 999px;
          padding: 11px 16px;
          text-decoration: none;
          font-weight: 700;
          cursor: pointer;
        }

        .actions a,
        .ledger-card a {
          background: transparent;
          color: #ffd77a;
        }

        .notice {
          background: rgba(80, 240, 142, 0.12);
          border: 1px solid rgba(80, 240, 142, 0.36);
          padding: 14px 16px;
          border-radius: 16px;
        }

        .handover,
        .boundary {
          padding: 22px;
          margin: 22px 0;
        }

        dl {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin: 0;
        }

        dt {
          color: #d7ad49;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        dd {
          margin: 6px 0 0;
          color: #f8f0db;
          overflow-wrap: anywhere;
        }

        .ledger {
          margin-top: 24px;
        }

        .ledger-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 16px;
        }

        .ledger-card {
          padding: 18px;
        }

        .ledger-card p {
          color: #d8caa8;
          overflow-wrap: anywhere;
          line-height: 1.45;
        }

        .ledger-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #ffd77a;
          font-size: 13px;
        }

        @media (max-width: 780px) {
          .pj16-shell {
            padding: 18px;
          }

          .hero {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}