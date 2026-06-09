"use client";

import { useMemo, useState } from "react";

const PJ20_MARKER = "PERSONAL_JOBS_20_UNIFIED_OPPORTUNITY_COMMAND_QUEUE_APPLY_READINESS_SELECTOR";
const PJ20_QUEUE_KEY = "kingsmen.personalJobs20.opportunityCommandQueue.v1";
const PJ20_SELECTED_KEY = "kingsmen.personalJobs20.selectedForApplyPack.v1";
const PJ04_CANDIDATES_KEY = "kingsmen.personalJobs04.applyPackCandidates.v1";

type QueueItem = {
  queueId: string;
  title: string;
  company: string;
  location: string;
  sourceUrl?: string;
  applyUrl?: string;
  sourceName?: string;
  sourceModule?: string;
  readinessScore: number;
  readinessState: string;
  priorityBand: string;
  countryFocus?: string;
  sourceHealth?: string | null;
  reasons?: string[];
  nextAction?: string;
  notes?: string;
};

type QueueResult = {
  status: string;
  generatedAt?: string;
  rawLeadCount?: number;
  queueCount?: number;
  applyPackCandidateCount?: number;
  stateCounts?: Record<string, number>;
  queue?: QueueItem[];
  applyPackCandidates?: QueueItem[];
  error?: string;
};

function stateLabel(state: string) {
  return state.replaceAll("_", " ");
}

export default function OpportunityQueueClient() {
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<QueueResult | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedItems = useMemo(() => {
    const ids = new Set(selectedIds);
    return queue.filter((item) => ids.has(item.queueId));
  }, [queue, selectedIds]);

  const readyCount = queue.filter((item) => item.readinessState === "READY_FOR_APPLY_PACK").length;
  const reviewCount = queue.filter((item) => item.readinessState === "REVIEWABLE_SA_ROUTE").length;
  const manualCount = queue.filter((item) => item.readinessState === "NEEDS_MANUAL_SOURCE_REVIEW").length;

  async function buildQueue() {
    setBuilding(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/opportunity-queue/build", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        }
      });

      const json = (await response.json()) as QueueResult;

      if (!response.ok) {
        throw new Error(json.error || "Opportunity queue build failed.");
      }

      const nextQueue = json.queue ?? [];

      window.localStorage.setItem(
        PJ20_QUEUE_KEY,
        JSON.stringify({
          marker: PJ20_MARKER,
          updatedAt: new Date().toISOString(),
          queue: nextQueue,
          applyPackCandidates: json.applyPackCandidates ?? []
        })
      );

      setResult(json);
      setQueue(nextQueue);
      setSelectedIds([]);
      setMessage(`Opportunity command queue built. ${nextQueue.length} deduped opportunities and ${json.applyPackCandidateCount ?? 0} apply-pack candidates.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBuilding(false);
    }
  }

  function toggleSelect(item: QueueItem) {
    setSelectedIds((current) => {
      if (current.includes(item.queueId)) {
        return current.filter((id) => id !== item.queueId);
      }

      return [...current, item.queueId];
    });
  }

  function exportSelected() {
    const exportItems = selectedItems.map((item) => ({
      source: "PERSONAL-JOBS-20",
      queueId: item.queueId,
      title: item.title,
      company: item.company,
      location: item.location,
      sourceUrl: item.sourceUrl,
      applyUrl: item.applyUrl || item.sourceUrl,
      readinessScore: item.readinessScore,
      readinessState: item.readinessState,
      priorityBand: item.priorityBand,
      reasons: item.reasons ?? [],
      nextAction: item.nextAction,
      manualApprovalRequired: true
    }));

    window.localStorage.setItem(
      PJ20_SELECTED_KEY,
      JSON.stringify({
        marker: PJ20_MARKER,
        updatedAt: new Date().toISOString(),
        selected: exportItems
      })
    );

    window.localStorage.setItem(PJ04_CANDIDATES_KEY, JSON.stringify(exportItems));

    setMessage(`${exportItems.length} opportunities exported as apply-pack candidates. No applications were sent.`);
  }

  return (
    <main className="pj20-shell">
      <section className="hero">
        <p className="eyebrow">PERSONAL-JOBS-20</p>
        <h1>Unified Opportunity Command Queue</h1>
        <p className="summary">
          Kingsmen now has many leads from PJ17, PJ18, and PJ19. This desk turns those leads into a real command queue:
          ready opportunities, reviewable South African routes, watchlist items, manual-review sources, and low-priority rejects.
          The goal is to choose what deserves an apply pack next, not to blindly apply everywhere.
        </p>

        <div className="actions">
          <button type="button" onClick={buildQueue} disabled={building}>
            {building ? "Building queue..." : "Build opportunity queue"}
          </button>
          <button type="button" onClick={exportSelected} disabled={selectedItems.length === 0}>
            Export selected to apply pack
          </button>
          <a href="/personal-job-desk/source-scout">Open PJ19 source scout</a>
          <a href="/personal-job-desk/apply-pack">Open apply pack builder</a>
        </div>

        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="status-grid">
        <article>
          <strong>{queue.length}</strong>
          <span>Deduped queue</span>
        </article>
        <article>
          <strong>{readyCount}</strong>
          <span>Ready for apply pack</span>
        </article>
        <article>
          <strong>{reviewCount}</strong>
          <span>Reviewable SA routes</span>
        </article>
        <article>
          <strong>{manualCount}</strong>
          <span>Manual review needed</span>
        </article>
        <article>
          <strong>{selectedItems.length}</strong>
          <span>Selected</span>
        </article>
      </section>

      {result?.stateCounts ? (
        <section className="panel">
          <h2>Queue state summary</h2>
          <div className="state-grid">
            {Object.entries(result.stateCounts).map(([state, count]) => (
              <article key={state}>
                <strong>{count}</strong>
                <span>{stateLabel(state)}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Opportunity command queue</h2>
        {queue.length === 0 ? (
          <p className="muted">Build the queue. It will combine PJ17, PJ18, and PJ19 leads into one apply-readiness selector.</p>
        ) : (
          <div className="queue-grid">
            {queue.slice(0, 120).map((item) => {
              const selected = selectedIds.includes(item.queueId);

              return (
                <article key={item.queueId} className={`queue-card ${selected ? "selected" : ""}`}>
                  <div className="card-head">
                    <span>{stateLabel(item.readinessState)}</span>
                    <b>{item.readinessScore}/100</b>
                  </div>

                  <h3>{item.title}</h3>
                  <p className="company">{item.company}</p>
                  <p className="muted">{item.location}</p>

                  <div className="chips">
                    <span>{item.priorityBand}</span>
                    <span>{item.sourceModule}</span>
                    <span>{item.countryFocus}</span>
                    {item.sourceHealth ? <span>{item.sourceHealth}</span> : null}
                  </div>

                  <p>{item.nextAction}</p>

                  {item.reasons?.length ? (
                    <ul>
                      {item.reasons.slice(0, 4).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="card-actions">
                    <button type="button" onClick={() => toggleSelect(item)}>
                      {selected ? "Unselect" : "Select for apply pack"}
                    </button>

                    {item.sourceUrl || item.applyUrl ? (
                      <a href={item.sourceUrl || item.applyUrl} target="_blank" rel="noreferrer">
                        Review source
                      </a>
                    ) : (
                      <span className="muted">No source URL</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="boundary">
        <h2>Locked safety boundary</h2>
        <p>
          PJ20 only builds the command queue and lets you select opportunities for apply-pack preparation.
          It does not submit applications, send email, send WhatsApp, contact employers, touch payments,
          bypass login/CAPTCHA, or claim production deployment.
        </p>
      </section>

      <style>{`
        .pj20-shell {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top left, rgba(214, 164, 61, 0.2), transparent 32rem),
            linear-gradient(135deg, #050505 0%, #111113 52%, #201807 100%);
          color: #f8f0db;
          font-family: Arial, Helvetica, sans-serif;
        }

        .hero,
        .panel,
        .boundary,
        .status-grid article,
        .state-grid article,
        .queue-card {
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
          max-width: 1020px;
          color: #d8caa8;
          line-height: 1.7;
        }

        .actions,
        .card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
          align-items: center;
        }

        button,
        .actions a,
        .card-actions a {
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
        .card-actions a {
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

        .status-grid,
        .state-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .status-grid article,
        .state-grid article {
          padding: 18px;
        }

        .status-grid strong,
        .state-grid strong {
          display: block;
          font-size: 24px;
          color: #ffd77a;
        }

        .status-grid span,
        .state-grid span,
        .muted {
          color: #b9ad92;
        }

        .queue-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        .queue-card {
          padding: 18px;
        }

        .queue-card.selected {
          border-color: rgba(80, 240, 142, 0.7);
          background: rgba(80, 240, 142, 0.08);
        }

        .card-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #ffd77a;
        }

        .company {
          color: #f8f0db;
          font-weight: 700;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0;
        }

        .chips span {
          border: 1px solid rgba(255, 215, 122, 0.24);
          border-radius: 999px;
          padding: 6px 10px;
          color: #ffd77a;
          font-size: 12px;
        }

        .queue-card p,
        .queue-card li {
          line-height: 1.55;
        }

        ul {
          padding-left: 18px;
        }

        @media (max-width: 760px) {
          .pj20-shell {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
}