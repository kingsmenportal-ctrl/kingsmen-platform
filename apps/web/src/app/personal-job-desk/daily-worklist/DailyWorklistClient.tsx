"use client";

import { useEffect, useMemo, useState } from "react";

type WorklistItem = {
  worklistId: string;
  queueId: string;
  workflowId: string;
  threadId: string;
  trackerId: string;
  packId: string;
  workDate: string;
  workSlot: string;
  worklistStatus: string;
  priorityBand: string;
  priorityScore: number;
  estimatedMinutes: number;
  assignedTo: string;
  founderAttentionRequired: boolean;
  candidateHarmRisk: boolean;
  context: any;
  actionPacket: any;
  readinessGate: any;
  operatorProgress: {
    startedAt: string;
    completedAt: string;
    proofReference: string;
    blockerNote: string;
    completionNote: string;
  };
  founderDecision: {
    decision: string;
    decidedBy: string;
    decidedAt: string;
    decisionNote: string;
  };
};

type WorklistOutput = {
  status?: string;
  generatedAt?: string;
  workDate?: string;
  worklistItemCount?: number;
  summary?: any;
  founderDigest?: any;
  worklistItems?: WorklistItem[];
};

const worklistStatuses = [
  "QUEUED",
  "TODAY",
  "IN_PROGRESS",
  "WAITING_PROOF",
  "WAITING_CANDIDATE",
  "WAITING_FOUNDER",
  "DONE",
  "CLOSED"
];

const workSlots = [
  "MORNING_REVIEW",
  "MIDDAY_EXECUTION",
  "AFTERNOON_PROOF",
  "END_OF_DAY_DIGEST",
  "WAITING"
];

export default function DailyWorklistClient() {
  const [worklist, setWorklist] = useState<WorklistOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => worklist?.worklistItems ?? [], [worklist]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) =>
      item.worklistStatus === filter ||
      item.workSlot === filter ||
      item.priorityBand === filter
    );
  }, [items, filter]);

  const selected = useMemo(() => {
    return items.find((item) => item.worklistId === selectedId) ?? filtered[0] ?? null;
  }, [items, filtered, selectedId]);

  useEffect(() => {
    loadWorklist();
  }, []);

  async function loadWorklist() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/daily-worklist", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ28 load failed.");
      setWorklist(json);
      setSelectedId(json.worklistItems?.[0]?.worklistId ?? "");
      setMessage(`PJ28 loaded ${json.worklistItemCount} daily worklist items.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ28 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchItem(key: keyof WorklistItem, value: string) {
    if (!selected || !worklist?.worklistItems) return;

    const updated = worklist.worklistItems.map((item) => {
      if (item.worklistId !== selected.worklistId) return item;
      return { ...item, [key]: value };
    });

    setWorklist({ ...worklist, worklistItems: updated });
  }

  function patchOperator(key: keyof WorklistItem["operatorProgress"], value: string) {
    if (!selected || !worklist?.worklistItems) return;

    const updated = worklist.worklistItems.map((item) => {
      if (item.worklistId !== selected.worklistId) return item;
      return {
        ...item,
        operatorProgress: {
          ...item.operatorProgress,
          [key]: value
        }
      };
    });

    setWorklist({ ...worklist, worklistItems: updated });
  }

  function patchFounder(key: keyof WorklistItem["founderDecision"], value: string) {
    if (!selected || !worklist?.worklistItems) return;

    const updated = worklist.worklistItems.map((item) => {
      if (item.worklistId !== selected.worklistId) return item;
      return {
        ...item,
        founderDecision: {
          ...item.founderDecision,
          [key]: value
        }
      };
    });

    setWorklist({ ...worklist, worklistItems: updated });
  }

  async function saveSelected(item: WorklistItem) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/daily-worklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worklistId: item.worklistId, item })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ28 save failed.");

      setWorklist(json.worklist);
      setSelectedId(json.item.worklistId);
      setMessage("Saved PJ28 worklist item.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ28 save failed.");
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
        <p style={eyebrow}>PERSONAL-JOBS-28</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Daily Worklist & Founder Digest</h1>
        <p style={muted}>One-founder daily operating board. It packages work; it does not execute applications or send messages.</p>
        <button onClick={loadWorklist} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh worklist"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Items" value={worklist?.summary?.totalItems ?? 0} />
        <Stat label="Today" value={worklist?.summary?.today ?? 0} />
        <Stat label="Waiting founder" value={worklist?.summary?.waitingFounder ?? 0} />
        <Stat label="Harm risk" value={worklist?.summary?.candidateHarmRisk ?? 0} />
        <Stat label="Founder attention" value={worklist?.summary?.founderAttentionRequired ?? 0} />
        <Stat label="Est. minutes" value={worklist?.summary?.estimatedMinutes ?? 0} />
      </section>

      <section style={panel}>
        <h2>Founder digest</h2>
        <p style={messageBox}>{worklist?.founderDigest?.founderSummary?.headline || "No digest loaded."}</p>
        <p style={muted}>Action packets: {worklist?.founderDigest?.actionPackets?.length ?? 0}</p>
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Worklist</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All items</option>
            {worklistStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            {workSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            <option value="P0_URGENT">P0_URGENT</option>
            <option value="P1_HIGH">P1_HIGH</option>
            <option value="P2_NORMAL">P2_NORMAL</option>
            <option value="P3_LOW">P3_LOW</option>
            <option value="P4_WAIT">P4_WAIT</option>
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((item) => (
              <button
                key={item.worklistId}
                onClick={() => setSelectedId(item.worklistId)}
                style={{
                  ...queueCard,
                  outline: selected?.worklistId === item.worklistId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{item.context?.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{item.workSlot} / {item.priorityBand}</span>
                <small>{item.worklistStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No worklist item selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.workSlot} / {selected.priorityBand}</p>
              <h2>{selected.context?.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.context?.opportunity?.company || "Unknown company"} - {selected.worklistStatus}</p>

              <section style={subPanel}>
                <h3>{selected.actionPacket?.actionTitle || "Action"}</h3>
                <p style={messageBox}>{selected.actionPacket?.operatorAction || "No action packet."}</p>
                <p style={muted}>Required proof: {selected.actionPacket?.requiredProof || "None"}</p>
                <button style={buttonSecondary} onClick={() => copyText(selected.actionPacket?.operatorAction || "")}>
                  Copy action
                </button>
              </section>

              <section style={subPanel}>
                <h3>Work controls</h3>
                <div style={formGrid}>
                  <Select label="Worklist status" value={selected.worklistStatus} options={worklistStatuses} onChange={(v) => patchItem("worklistStatus", v)} />
                  <Select label="Work slot" value={selected.workSlot} options={workSlots} onChange={(v) => patchItem("workSlot", v)} />
                  <Input label="Assigned to" value={selected.assignedTo} onChange={(v) => patchItem("assignedTo", v)} />
                  <Input label="Started at" value={selected.operatorProgress.startedAt} onChange={(v) => patchOperator("startedAt", v)} />
                  <Input label="Completed at" value={selected.operatorProgress.completedAt} onChange={(v) => patchOperator("completedAt", v)} />
                  <Input label="Proof reference" value={selected.operatorProgress.proofReference} onChange={(v) => patchOperator("proofReference", v)} />
                </div>
                <TextArea label="Blocker note" value={selected.operatorProgress.blockerNote} onChange={(v) => patchOperator("blockerNote", v)} />
                <TextArea label="Completion note" value={selected.operatorProgress.completionNote} onChange={(v) => patchOperator("completionNote", v)} />
              </section>

              <section style={subPanel}>
                <h3>Founder decision</h3>
                <div style={formGrid}>
                  <Input label="Decision" value={selected.founderDecision.decision} onChange={(v) => patchFounder("decision", v)} placeholder="approve / block / defer / close" />
                  <Input label="Decided by" value={selected.founderDecision.decidedBy} onChange={(v) => patchFounder("decidedBy", v)} />
                  <Input label="Decided at" value={selected.founderDecision.decidedAt} onChange={(v) => patchFounder("decidedAt", v)} />
                </div>
                <TextArea label="Decision note" value={selected.founderDecision.decisionNote} onChange={(v) => patchFounder("decisionNote", v)} />
                <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                  Save worklist item
                </button>
              </section>

              <section style={subPanel}>
                <h3>Safety</h3>
                <ul style={listStyle}>
                  <li>Auto execute: {selected.readinessGate?.canAutoExecute ? "Yes" : "No"}</li>
                  <li>Auto contact employer: {selected.readinessGate?.canAutoContactEmployer ? "Yes" : "No"}</li>
                  <li>Auto send candidate: {selected.readinessGate?.canAutoSendCandidateMessage ? "Yes" : "No"}</li>
                  <li>Proof required: {selected.readinessGate?.proofRequiredForStatusAdvance ? "Yes" : "No"}</li>
                </ul>
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