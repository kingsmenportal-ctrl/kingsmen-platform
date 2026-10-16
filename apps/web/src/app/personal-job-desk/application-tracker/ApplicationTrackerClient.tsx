"use client";

import { useEffect, useMemo, useState } from "react";

type TrackerItem = {
  trackerId: string;
  workbenchId: string;
  packId: string;
  candidateStatus: string;
  candidateMessage: string;
  opportunity: {
    title: string;
    company: string;
    location: string;
    sourceUrl: string;
    applyUrl: string;
  };
  timeline: {
    createdAt: string;
    updatedAt: string;
    startedAt: string;
    submittedAt: string;
    followUpDate: string;
  };
  progress: Array<{
    key: string;
    label: string;
    state: string;
    proofBacked: boolean;
  }>;
  proof: {
    proofCaptured: boolean;
    proofType: string;
    proofReference: string;
    submittedAt: string;
    proofNotes: string;
    candidateVisibleRule: string;
  };
  outcome: {
    outcomeStatus: string;
    outcomeNotesVisible: boolean;
    outcomeMessage: string;
  };
  candidateControls: {
    candidateAcknowledged: boolean;
    candidateQuestion: string;
    lastCandidateNoteAt: string;
  };
  disclaimers: string[];
};

type TrackerOutput = {
  status?: string;
  generatedAt?: string;
  trackerItemCount?: number;
  summary?: any;
  items?: TrackerItem[];
};

const statuses = [
  "ALL",
  "REVIEW_REQUIRED",
  "READY_FOR_MANUAL_SUBMISSION",
  "MANUAL_SUBMISSION_IN_PROGRESS",
  "SUBMITTED_PROOF_CAPTURED",
  "FOLLOW_UP_SCHEDULED",
  "INTERVIEW_STAGE",
  "REJECTED",
  "OFFER_RECEIVED",
  "NO_RESPONSE_FOLLOWUP",
  "CLOSED_NOT_APPLYING"
];

const statusLabels: Record<string, string> = {
  ALL: "All statuses", REVIEW_REQUIRED: "Review required", READY_FOR_MANUAL_SUBMISSION: "Ready for manual submission",
  MANUAL_SUBMISSION_IN_PROGRESS: "Manual submission in progress", SUBMITTED_PROOF_CAPTURED: "Submission proof recorded",
  FOLLOW_UP_SCHEDULED: "Follow-up scheduled", INTERVIEW_STAGE: "Interview stage", REJECTED: "Rejected (recorded)",
  OFFER_RECEIVED: "Offer received (recorded)", NO_RESPONSE_FOLLOWUP: "No response — follow-up", CLOSED_NOT_APPLYING: "Closed — not applying"
};

export default function ApplicationTrackerClient() {
  const [tracker, setTracker] = useState<TrackerOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => tracker?.items ?? [], [tracker]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) => item.candidateStatus === filter);
  }, [items, filter]);

  const selected = useMemo(() => {
    return items.find((item) => item.trackerId === selectedId) ?? filtered[0] ?? null;
  }, [items, filtered, selectedId]);

  useEffect(() => {
    loadTracker();
  }, []);

  async function loadTracker() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/application-tracker", { method: "GET" });
      const json = await response.json();
      if (!response.ok) {
        setTracker(null);
        setSelectedId("");
        if (response.status === 503 && json.code === "CANDIDATE_AUTHORIZATION_NOT_CONFIGURED") {
          setMessage("Tracker unavailable: authenticated candidate access and record ownership are not configured. No tracker records were loaded. Do not enter personal information here.");
        } else {
          setMessage("Tracker could not be loaded. No tracker records are available in this view.");
        }
        return;
      }
      setTracker(json);
      setSelectedId(json.items?.[0]?.trackerId ?? "");
      setMessage(`PJ24 loaded ${json.trackerItemCount} tracker items.`);
    } catch {
      setTracker(null);
      setSelectedId("");
      setMessage("Tracker could not be reached. No tracker records are available in this view.");
    } finally {
      setLoading(false);
    }
  }

  function patchControls(key: keyof TrackerItem["candidateControls"], value: string | boolean) {
    if (!selected || !tracker?.items) return;

    const updatedItems = tracker.items.map((item) => {
      if (item.trackerId !== selected.trackerId) return item;
      return {
        ...item,
        candidateControls: {
          ...item.candidateControls,
          [key]: value
        }
      };
    });

    setTracker({ ...tracker, items: updatedItems });
  }

  async function saveSelected(item: TrackerItem) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/application-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackerId: item.trackerId,
          candidateControls: item.candidateControls
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ24 save failed.");

      setTracker(json.tracker);
      setSelectedId(json.item.trackerId);
      setMessage("Saved candidate tracker note.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ24 save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={main}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-24</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Application Tracker</h1>
        <p style={muted}>
          Local application-workbench view. These records are not authenticated, candidate-owned records and must not be treated as a candidate's official application history.
        </p>
        <aside role="note" style={{ ...subPanel, border: "1px solid #a67b35", marginTop: 16 }}><strong>Unavailable — security integration required</strong><p style={muted}>The legacy shared-file API has been disabled. This page does not currently have authenticated candidate identity, owner-scoped records, or a secure application data source. Do not enter personal information here.</p><p style={muted}>The interface is retained as a non-production shell only. Historic status/proof labels must not be interpreted as current application facts or employer confirmation.</p></aside>
        <button onClick={loadTracker} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh tracker"}
        </button>
        {message ? <p role="status" aria-live="polite" style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      {tracker ? <>
      <section style={statsGrid}>
        <Stat label="Total" value={tracker?.summary?.totalItems ?? 0} />
        <Stat label="Review required" value={tracker?.summary?.reviewRequired ?? 0} />
        <Stat label="Ready manual" value={tracker?.summary?.readyForManualSubmission ?? 0} />
        <Stat label="Proof captured" value={tracker?.summary?.submittedProofCaptured ?? 0} />
        <Stat label="Follow-up" value={tracker?.summary?.followUpScheduled ?? 0} />
        <Stat label="Outcomes" value={tracker?.summary?.outcomesVisible ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Applications</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            {statuses.map((status) => <option key={status} value={status}>{statusLabels[status] ?? status}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((item) => (
              <button
                key={item.trackerId}
                onClick={() => setSelectedId(item.trackerId)}
                style={{
                  ...queueCard,
                  outline: selected?.trackerId === item.trackerId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{item.opportunity.title || "Untitled opportunity"}</strong>
                <span>{item.opportunity.company || "Unknown company"} - {item.opportunity.location || "Unknown location"}</span>
                <small>{statusLabels[item.candidateStatus] ?? item.candidateStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No tracker item selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{statusLabels[selected.candidateStatus] ?? selected.candidateStatus}</p>
              <h2>{selected.opportunity.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.opportunity.company || "Unknown company"} - {selected.opportunity.location || "Unknown location"}</p>
              <p style={messageBox}>{selected.candidateMessage}</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {selected.opportunity.sourceUrl ? <a href={selected.opportunity.sourceUrl} target="_blank" rel="noreferrer" style={linkButton}>Open source</a> : null}
                {selected.opportunity.applyUrl ? <a href={selected.opportunity.applyUrl} target="_blank" rel="noreferrer" style={linkButton}>Open apply URL</a> : null}
              </div>

              <section style={subPanel}>
                <h3>Progress</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {selected.progress.map((step) => (
                    <div key={step.key} style={progressCard}>
                      <strong>{step.label}</strong>
                      <span>{step.state}</span>
                      <small>{step.proofBacked ? "Proof-backed" : "Waiting for proof"}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section style={subPanel}>
                <h3>Proof</h3>
                <p style={muted}>Captured: {selected.proof.proofCaptured ? "Yes" : "No"}</p>
                <p style={muted}>Type: {selected.proof.proofType || "None yet"}</p>
                <p style={muted}>Reference: {selected.proof.proofReference || "None yet"}</p>
                <p style={muted}>Submitted at: {selected.proof.submittedAt || "Not submitted yet"}</p>
              </section>

              <section style={subPanel}>
                <h3>Timeline</h3>
                <p style={muted}>Started: {selected.timeline.startedAt || "Not started"}</p>
                <p style={muted}>Submitted: {selected.timeline.submittedAt || "Not submitted"}</p>
                <p style={muted}>Follow-up: {selected.timeline.followUpDate || "No follow-up date"}</p>
              </section>

              <section style={subPanel}>
                <h3>Candidate note</h3>
                <label style={checkLabel}>
                  <input
                    type="checkbox"
                    checked={selected.candidateControls.candidateAcknowledged}
                    onChange={(e) => patchControls("candidateAcknowledged", e.target.checked)}
                  />
                  I have seen this status
                </label>
                <textarea
                  value={selected.candidateControls.candidateQuestion}
                  onChange={(e) => patchControls("candidateQuestion", e.target.value)}
                  placeholder="Ask a question or add a note..."
                  style={textarea}
                />
                <button style={button} disabled title="Candidate-owned note saving is disabled until authenticated ownership and persistence are implemented.">Save note unavailable — auth integration required</button>
                <p style={muted}>Notes cannot be safely saved from this shared local-workbench route yet. No candidate-specific audit trail or ownership enforcement is connected.</p>
              </section>

              <section style={subPanel}>
                <h3>Important</h3>
                <ul style={listStyle}>{selected.disclaimers.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            </>
          )}
        </section>
      </section>
      </> : <section role="status" aria-live="polite" style={{ ...panel, border: "1px solid #a67b35" }}>
        <h2>Application records are unavailable</h2>
        <p style={muted}>Candidate-specific application history will appear here only after authenticated identity, owner-scoped persistence, and isolation tests are implemented. No application count or status is being inferred.</p>
      </section>}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article style={card}>
      <strong style={{ fontSize: 28, color: "#ffd77a" }}>{value}</strong>
      <span style={{ display: "block", color: "#b9ad92" }}>{label}</span>
    </article>
  );
}

const main = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#050505,#151108,#241907)",
  color: "#f8f0db",
  padding: 28,
  fontFamily: "Arial, sans-serif"
};

const panel = {
  border: "1px solid rgba(255,215,122,.25)",
  borderRadius: 24,
  background: "rgba(255,255,255,.055)",
  padding: 22,
  marginBottom: 20
};

const subPanel = {
  border: "1px solid rgba(255,215,122,.14)",
  borderRadius: 18,
  background: "rgba(0,0,0,.18)",
  padding: 16,
  marginTop: 14
};

const card = {
  border: "1px solid rgba(255,215,122,.2)",
  borderRadius: 18,
  background: "rgba(0,0,0,.22)",
  padding: 16
};

const layout = {
  display: "grid",
  gridTemplateColumns: "minmax(300px, 420px) 1fr",
  gap: 18,
  alignItems: "start"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: 14,
  marginBottom: 20
};

const queueCard = {
  textAlign: "left" as const,
  border: "1px solid rgba(255,215,122,.18)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db",
  cursor: "pointer",
  display: "grid",
  gap: 5
};

const progressCard = {
  border: "1px solid rgba(255,215,122,.18)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(0,0,0,.22)",
  color: "#f8f0db",
  display: "grid",
  gap: 5
};

const eyebrow = {
  color: "#d7ad49",
  textTransform: "uppercase" as const,
  letterSpacing: ".18em",
  fontSize: 12
};

const muted = {
  color: "#d8caa8",
  lineHeight: 1.6
};

const input = {
  width: "100%",
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 12,
  padding: 11,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db"
};

const textarea = {
  width: "100%",
  minHeight: 90,
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 12,
  padding: 11,
  marginTop: 12,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db"
};

const button = {
  border: 0,
  borderRadius: 999,
  background: "#d7ad49",
  color: "#111",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 14
};

const linkButton = {
  borderRadius: 999,
  border: "1px solid rgba(255,215,122,.45)",
  color: "#ffd77a",
  padding: "9px 12px",
  textDecoration: "none"
};

const checkLabel = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#d8caa8"
};

const listStyle = {
  color: "#d8caa8",
  lineHeight: 1.55,
  paddingLeft: 22
};

const messageBox = {
  color: "#f8f0db",
  lineHeight: 1.6,
  background: "rgba(215,173,73,.12)",
  border: "1px solid rgba(215,173,73,.28)",
  borderRadius: 16,
  padding: 14
};