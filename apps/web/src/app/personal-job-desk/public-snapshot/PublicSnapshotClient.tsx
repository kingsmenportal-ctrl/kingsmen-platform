"use client";

import { useEffect, useMemo, useState } from "react";

type SnapshotItem = {
  snapshotItemId: string;
  timelineId: string;
  packId: string;
  publicStatus: string;
  targetStatus: string;
  candidateSummary: string;
  opportunity: {
    title: string;
    company: string;
    location: string;
  };
  progressSteps: Array<{
    key: string;
    label: string;
    state: string;
    evidenceBacked: boolean;
  }>;
  evidence: {
    visibility: string;
    evidenceLevel: string;
    proofAvailable: boolean;
    proofType: string;
    proofReference: string;
    auditReference: string;
    auditRecordedAt: string;
    candidateVisible: boolean;
    redactionReason: string;
  };
  candidateMessage: {
    approved: boolean;
    sentManually: boolean;
    message: string;
    manualSendProofAvailable: boolean;
  };
  candidateSafeRules: string[];
};

type SnapshotOutput = {
  status?: string;
  generatedAt?: string;
  snapshotItemCount?: number;
  summary?: any;
  snapshotItems?: SnapshotItem[];
  exportReport?: {
    format: string;
    filename: string;
    body: string;
  };
};

const filters = [
  "ALL",
  "AWAITING_PROOF",
  "AWAITING_APPROVAL",
  "READY_FOR_AUDIT_RECORD",
  "AUDIT_RECORDED",
  "REJECTED",
  "BLOCKED",
  "CLOSED",
  "NO_EVIDENCE",
  "PROOF_BACKED",
  "CANDIDATE_VISIBLE_SUMMARY",
  "AUDIT_RECORDED"
];

export default function PublicSnapshotClient() {
  const [snapshot, setSnapshot] = useState<SnapshotOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => snapshot?.snapshotItems ?? [], [snapshot]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) =>
      item.publicStatus === filter ||
      item.evidence.evidenceLevel === filter ||
      item.evidence.visibility === filter ||
      item.targetStatus === filter
    );
  }, [items, filter]);

  const selected = useMemo(() => {
    return items.find((item) => item.snapshotItemId === selectedId) ?? filtered[0] ?? null;
  }, [items, filtered, selectedId]);

  useEffect(() => {
    loadSnapshot();
  }, []);

  async function loadSnapshot() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/public-snapshot", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ32 load failed.");
      setSnapshot(json);
      setSelectedId(json.snapshotItems?.[0]?.snapshotItemId ?? "");
      setMessage(`PJ32 loaded ${json.snapshotItemCount} candidate-safe snapshot items.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ32 load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text || "");
    setMessage("Copied.");
  }

  function downloadReport() {
    const body = snapshot?.exportReport?.body || "";
    const filename = snapshot?.exportReport?.filename || "kingsmen-progress-snapshot.md";
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Export prepared.");
  }

  return (
    <main style={main}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-32</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Candidate-Safe Public Snapshot</h1>
        <p style={muted}>Exportable progress report with sensitive proof redacted. No automatic status mutation or sending.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={loadSnapshot} disabled={loading} style={button}>
            {loading ? "Working..." : "Refresh snapshot"}
          </button>
          <button onClick={downloadReport} style={buttonSecondary}>
            Download progress report
          </button>
          <button onClick={() => copyText(snapshot?.exportReport?.body || "")} style={buttonSecondary}>
            Copy report
          </button>
        </div>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Items" value={snapshot?.summary?.totalItems ?? 0} />
        <Stat label="Awaiting proof" value={snapshot?.summary?.awaitingProof ?? 0} />
        <Stat label="Ready audit" value={snapshot?.summary?.readyForAuditRecord ?? 0} />
        <Stat label="Audit recorded" value={snapshot?.summary?.auditRecorded ?? 0} />
        <Stat label="Proof-backed" value={snapshot?.summary?.proofBacked ?? 0} />
        <Stat label="Redacted" value={snapshot?.summary?.redactedProofItems ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Snapshot items</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            {filters.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((item) => (
              <button
                key={item.snapshotItemId}
                onClick={() => setSelectedId(item.snapshotItemId)}
                style={{
                  ...queueCard,
                  outline: selected?.snapshotItemId === item.snapshotItemId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{item.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{item.publicStatus} / {item.evidence.evidenceLevel}</span>
                <small>{item.evidence.visibility}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No snapshot item selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.publicStatus}</p>
              <h2>{selected.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.opportunity?.company || "Unknown company"} - target: {selected.targetStatus}</p>

              <section style={subPanel}>
                <h3>Candidate-safe summary</h3>
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
                <h3>Evidence summary</h3>
                <p style={muted}>Visibility: {selected.evidence.visibility}</p>
                <p style={muted}>Evidence level: {selected.evidence.evidenceLevel}</p>
                <p style={muted}>Proof available: {selected.evidence.proofAvailable ? "Yes" : "No"}</p>
                <p style={muted}>Proof type: {selected.evidence.proofType || "None"}</p>
                <p style={muted}>Proof reference: {selected.evidence.proofReference || "Not shown"}</p>
                <p style={muted}>Audit reference: {selected.evidence.auditReference || "None"}</p>
                {selected.evidence.redactionReason ? <p style={warningBox}>{selected.evidence.redactionReason}</p> : null}
              </section>

              <section style={subPanel}>
                <h3>Candidate message</h3>
                <pre style={pre}>{selected.candidateMessage.message || "No approved candidate message."}</pre>
                <p style={muted}>Approved: {selected.candidateMessage.approved ? "Yes" : "No"}</p>
                <p style={muted}>Sent manually: {selected.candidateMessage.sentManually ? "Yes" : "No"}</p>
              </section>

              <section style={subPanel}>
                <h3>Rules</h3>
                <ul style={listStyle}>{selected.candidateSafeRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
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

const warningBox = {
  color: "#ffd77a",
  lineHeight: 1.6,
  background: "rgba(255,215,122,.08)",
  border: "1px solid rgba(255,215,122,.26)",
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