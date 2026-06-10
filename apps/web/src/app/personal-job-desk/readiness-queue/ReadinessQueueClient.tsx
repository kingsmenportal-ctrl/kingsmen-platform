"use client";

import { useEffect, useMemo, useState } from "react";

type QueueItem = {
  queueId: string;
  workflowId: string;
  threadId: string;
  trackerId: string;
  packId: string;
  queueStatus: string;
  priorityBand: string;
  priorityScore: number;
  assignedTo: string;
  operatorDecision: string;
  operatorNotes: string;
  context: any;
  actionPacket: {
    actionTitle: string;
    operatorAction: string;
    requiredProof: string;
    blockedReason: string;
  };
  readinessGate: {
    canAutoExecute: boolean;
    canAutoContactEmployer: boolean;
    canAutoSendCandidateMessage: boolean;
    canTouchPayments: boolean;
    canBypassLoginOtpCaptcha: boolean;
    humanApprovalRequired: boolean;
    proofRequiredForStatusAdvance: boolean;
  };
  nextAllowedActions: string[];
};

type QueueOutput = {
  status?: string;
  generatedAt?: string;
  queueItemCount?: number;
  summary?: any;
  queueItems?: QueueItem[];
};

const queueStatuses = [
  "BLOCKED_REVIEW_REQUIRED",
  "READY_FOR_MANUAL_SUBMISSION",
  "MANUAL_SUBMISSION_IN_PROGRESS",
  "PROOF_CAPTURE_REQUIRED",
  "FOLLOW_UP_DUE",
  "OUTCOME_REVIEW_REQUIRED",
  "CANDIDATE_RESPONSE_REQUIRED",
  "CLOSED"
];

const priorityBands = [
  "P0_URGENT",
  "P1_HIGH",
  "P2_NORMAL",
  "P3_LOW",
  "P4_WAIT"
];

export default function ReadinessQueueClient() {
  const [queue, setQueue] = useState<QueueOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => queue?.queueItems ?? [], [queue]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) => item.queueStatus === filter || item.priorityBand === filter);
  }, [items, filter]);

  const selected = useMemo(() => {
    return items.find((item) => item.queueId === selectedId) ?? filtered[0] ?? null;
  }, [items, filtered, selectedId]);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/readiness-queue", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ27 load failed.");
      setQueue(json);
      setSelectedId(json.queueItems?.[0]?.queueId ?? "");
      setMessage(`PJ27 loaded ${json.queueItemCount} readiness queue items.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ27 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchItem(key: keyof QueueItem, value: string) {
    if (!selected || !queue?.queueItems) return;

    const updated = queue.queueItems.map((item) => {
      if (item.queueId !== selected.queueId) return item;
      return { ...item, [key]: value };
    });

    setQueue({ ...queue, queueItems: updated });
  }

  async function saveSelected(item: QueueItem) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/readiness-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId: item.queueId, item })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ27 save failed.");

      setQueue(json.queue);
      setSelectedId(json.item.queueId);
      setMessage("Saved PJ27 queue item.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ27 save failed.");
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
        <p style={eyebrow}>PERSONAL-JOBS-27</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Readiness Governor & Priority Queue</h1>
        <p style={muted}>Ranks manual work without auto-executing anything. Human approval and proof remain required.</p>
        <button onClick={loadQueue} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh queue"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Items" value={queue?.summary?.totalItems ?? 0} />
        <Stat label="Urgent" value={queue?.summary?.urgent ?? 0} />
        <Stat label="High" value={queue?.summary?.high ?? 0} />
        <Stat label="Normal" value={queue?.summary?.normal ?? 0} />
        <Stat label="Blocked" value={queue?.summary?.blockedReviewRequired ?? 0} />
        <Stat label="Ready" value={queue?.summary?.readyForManualSubmission ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Queue</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All items</option>
            {priorityBands.map((band) => <option key={band} value={band}>{band}</option>)}
            {queueStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((item) => (
              <button
                key={item.queueId}
                onClick={() => setSelectedId(item.queueId)}
                style={{
                  ...queueCard,
                  outline: selected?.queueId === item.queueId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{item.context?.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{item.priorityBand} / {item.priorityScore}</span>
                <small>{item.queueStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No queue item selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.priorityBand} / {selected.priorityScore}</p>
              <h2>{selected.context?.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.context?.opportunity?.company || "Unknown company"} - {selected.queueStatus}</p>

              <section style={subPanel}>
                <h3>{selected.actionPacket.actionTitle}</h3>
                <p style={messageBox}>{selected.actionPacket.operatorAction}</p>
                <p style={muted}>Required proof: {selected.actionPacket.requiredProof}</p>
                {selected.actionPacket.blockedReason ? <p style={warningBox}>{selected.actionPacket.blockedReason}</p> : null}
                <button style={buttonSecondary} onClick={() => copyText(selected.actionPacket.operatorAction)}>
                  Copy action
                </button>
              </section>

              <section style={subPanel}>
                <h3>Queue controls</h3>
                <div style={formGrid}>
                  <Select label="Queue status" value={selected.queueStatus} options={queueStatuses} onChange={(v) => patchItem("queueStatus", v)} />
                  <Select label="Priority band" value={selected.priorityBand} options={priorityBands} onChange={(v) => patchItem("priorityBand", v)} />
                  <Input label="Assigned to" value={selected.assignedTo} onChange={(v) => patchItem("assignedTo", v)} />
                  <Input label="Operator decision" value={selected.operatorDecision} onChange={(v) => patchItem("operatorDecision", v)} placeholder="review / ready / blocked / closed" />
                </div>
                <TextArea label="Operator notes" value={selected.operatorNotes} onChange={(v) => patchItem("operatorNotes", v)} />
                <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                  Save queue item
                </button>
              </section>

              <section style={subPanel}>
                <h3>Readiness gate</h3>
                <ul style={listStyle}>
                  <li>Auto execute: {selected.readinessGate.canAutoExecute ? "Yes" : "No"}</li>
                  <li>Auto contact employer: {selected.readinessGate.canAutoContactEmployer ? "Yes" : "No"}</li>
                  <li>Auto send candidate message: {selected.readinessGate.canAutoSendCandidateMessage ? "Yes" : "No"}</li>
                  <li>Proof required: {selected.readinessGate.proofRequiredForStatusAdvance ? "Yes" : "No"}</li>
                  <li>Human approval required: {selected.readinessGate.humanApprovalRequired ? "Yes" : "No"}</li>
                </ul>
              </section>

              <section style={subPanel}>
                <h3>Context</h3>
                <p style={muted}>Candidate status: {selected.context?.candidateStatus || "None"}</p>
                <p style={muted}>Response status: {selected.context?.responseStatus || "None"}</p>
                <p style={muted}>Proof captured: {selected.context?.proof?.proofCaptured ? "Yes" : "No"}</p>
                <p style={muted}>Outcome: {selected.context?.outcome?.outcomeStatus || "NONE"}</p>
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={input}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block", marginTop: 12 }}>
      <span style={labelStyle}>{label}</span>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={textarea} />
    </label>
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

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 12
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

const labelStyle = {
  display: "block",
  color: "#d8caa8",
  marginBottom: 6,
  fontSize: 13
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
  minHeight: 92,
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

const warningBox = {
  color: "#ffd77a",
  lineHeight: 1.6,
  background: "rgba(255,215,122,.08)",
  border: "1px solid rgba(255,215,122,.26)",
  borderRadius: 16,
  padding: 14
};