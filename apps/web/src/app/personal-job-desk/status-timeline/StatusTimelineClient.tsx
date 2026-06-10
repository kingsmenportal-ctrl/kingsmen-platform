"use client";

import { useEffect, useMemo, useState } from "react";

type TimelineItem = {
  timelineId: string;
  advancementId: string;
  packId: string;
  timelineStatus: string;
  evidenceLevel: string;
  targetStatus: string;
  previousCandidateStatus: string;
  candidateSummary: string;
  opportunity: any;
  evidence: {
    proofReference: string;
    proofType: string;
    proofLocation: string;
    proofVisibleToCandidate: boolean;
    proofIsSensitive: boolean;
    auditReference: string;
    auditRecordedAt: string;
    auditRecordedBy: string;
  };
  candidateMessage: {
    draft: string;
    approved: boolean;
    sentManually: boolean;
    manualSendProof: string;
  };
  progressSteps: Array<{
    key: string;
    label: string;
    state: string;
    evidenceBacked: boolean;
  }>;
  visibleRules: string[];
};

type TimelineOutput = {
  status?: string;
  generatedAt?: string;
  timelineItemCount?: number;
  summary?: any;
  timelineItems?: TimelineItem[];
};

const timelineStatuses = [
  "ALL",
  "AWAITING_PROOF",
  "AWAITING_APPROVAL",
  "READY_FOR_AUDIT_RECORD",
  "AUDIT_RECORDED",
  "REJECTED",
  "BLOCKED",
  "CLOSED"
];

const evidenceLevels = [
  "NO_EVIDENCE",
  "INTERNAL_ONLY",
  "CANDIDATE_VISIBLE_SUMMARY",
  "PROOF_BACKED",
  "AUDIT_RECORDED"
];

export default function StatusTimelineClient() {
  const [timeline, setTimeline] = useState<TimelineOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => timeline?.timelineItems ?? [], [timeline]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) =>
      item.timelineStatus === filter ||
      item.evidenceLevel === filter ||
      item.targetStatus === filter
    );
  }, [items, filter]);

  const selected = useMemo(() => {
    return items.find((item) => item.timelineId === selectedId) ?? filtered[0] ?? null;
  }, [items, filtered, selectedId]);

  useEffect(() => {
    loadTimeline();
  }, []);

  async function loadTimeline() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/status-timeline", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ31 load failed.");
      setTimeline(json);
      setSelectedId(json.timelineItems?.[0]?.timelineId ?? "");
      setMessage(`PJ31 loaded ${json.timelineItemCount} status timeline items.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ31 load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text || "");
    setMessage("Copied.");
  }

  return (
    <main style={main}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-31</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Candidate Status Timeline</h1>
        <p style={muted}>Evidence-readable dashboard for candidate progress. No automatic status mutation or message sending.</p>
        <button onClick={loadTimeline} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh timeline"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Items" value={timeline?.summary?.totalItems ?? 0} />
        <Stat label="Awaiting proof" value={timeline?.summary?.awaitingProof ?? 0} />
        <Stat label="Awaiting approval" value={timeline?.summary?.awaitingApproval ?? 0} />
        <Stat label="Ready audit" value={timeline?.summary?.readyForAuditRecord ?? 0} />
        <Stat label="Audit recorded" value={timeline?.summary?.auditRecorded ?? 0} />
        <Stat label="Proof-backed" value={timeline?.summary?.proofBacked ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Timeline</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            {timelineStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            {evidenceLevels.map((level) => <option key={level} value={level}>{level}</option>)}
            <option value="REVIEW_REQUIRED">REVIEW_REQUIRED</option>
            <option value="SUBMITTED_PROOF_CAPTURED">SUBMITTED_PROOF_CAPTURED</option>
            <option value="FOLLOW_UP_SCHEDULED">FOLLOW_UP_SCHEDULED</option>
            <option value="INTERVIEW_STAGE">INTERVIEW_STAGE</option>
            <option value="OFFER_RECEIVED">OFFER_RECEIVED</option>
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((item) => (
              <button
                key={item.timelineId}
                onClick={() => setSelectedId(item.timelineId)}
                style={{
                  ...queueCard,
                  outline: selected?.timelineId === item.timelineId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{item.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{item.timelineStatus} / {item.evidenceLevel}</span>
                <small>{item.targetStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No timeline item selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.timelineStatus}</p>
              <h2>{selected.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.opportunity?.company || "Unknown company"} - target: {selected.targetStatus}</p>

              <section style={subPanel}>
                <h3>Candidate summary</h3>
                <p style={messageBox}>{selected.candidateSummary}</p>
                <button style={buttonSecondary} onClick={() => copyText(selected.candidateSummary)}>
                  Copy summary
                </button>
              </section>

              <section style={subPanel}>
                <h3>Progress</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {selected.progressSteps.map((step) => (
                    <div key={step.key} style={progressCard}>
                      <strong>{step.label}</strong>
                      <span>{step.state}</span>
                      <small>{step.evidenceBacked ? "Evidence-backed" : "Waiting evidence"}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section style={subPanel}>
                <h3>Evidence</h3>
                <p style={muted}>Evidence level: {selected.evidenceLevel}</p>
                <p style={muted}>Proof reference: {selected.evidence.proofReference || "None"}</p>
                <p style={muted}>Proof type: {selected.evidence.proofType || "None"}</p>
                <p style={muted}>Audit reference: {selected.evidence.auditReference || "None"}</p>
                <p style={muted}>Audit recorded: {selected.evidence.auditRecordedAt || "Not recorded"}</p>
                <p style={muted}>Sensitive proof: {selected.evidence.proofIsSensitive ? "Yes" : "No"}</p>
              </section>

              <section style={subPanel}>
                <h3>Candidate message draft</h3>
                <pre style={pre}>{selected.candidateMessage.draft || "No candidate message draft."}</pre>
                <p style={muted}>Approved: {selected.candidateMessage.approved ? "Yes" : "No"}</p>
                <p style={muted}>Sent manually: {selected.candidateMessage.sentManually ? "Yes" : "No"}</p>
                <p style={muted}>Manual send proof: {selected.candidateMessage.manualSendProof || "None"}</p>
              </section>

              <section style={subPanel}>
                <h3>Visibility rules</h3>
                <ul style={listStyle}>{selected.visibleRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
              </section>
            </>
          )}
        </section>
      </section>
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

const buttonSecondary = {
  border: "1px solid rgba(255,215,122,.45)",
  borderRadius: 999,
  background: "transparent",
  color: "#ffd77a",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 14
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

const pre = {
  whiteSpace: "pre-wrap" as const,
  color: "#d8caa8",
  background: "rgba(0,0,0,.25)",
  padding: 12,
  borderRadius: 12,
  maxHeight: 260,
  overflow: "auto"
};