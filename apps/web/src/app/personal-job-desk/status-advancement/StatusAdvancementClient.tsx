"use client";

import { useEffect, useMemo, useState } from "react";

type AdvancementRecord = {
  advancementId: string;
  reviewId: string;
  worklistId: string;
  queueId: string;
  workflowId: string;
  threadId: string;
  trackerId: string;
  packId: string;
  recordStatus: string;
  sourceReviewStatus: string;
  sourcePriorityBand: string;
  targetStatus: string;
  advanceApproved: boolean;
  proofReference: string;
  proofType: string;
  proofLocation: string;
  proofVisibleToCandidate: boolean;
  proofIsSensitive: boolean;
  context: any;
  auditMirror: {
    recordedInAuditMirror: boolean;
    recordedAt: string;
    recordedBy: string;
    auditReference: string;
    auditNote: string;
  };
  candidateFacing: {
    candidateMessageDraft: string;
    candidateMessageApproved: boolean;
    candidateMessageSentManually: boolean;
    manualSendProof: string;
  };
  controls: {
    canRecordAuditMirror: boolean;
    canMarkRecorded: boolean;
    requiresProof: boolean;
    requiresApproval: boolean;
    autoMutatesApplicationTracker: boolean;
    autoMutatesProofBoard: boolean;
    autoSendsCandidateMessage: boolean;
    autoContactsEmployer: boolean;
    writesAuditMirrorOnly: boolean;
  };
  auditRules: string[];
};

type AuditOutput = {
  status?: string;
  generatedAt?: string;
  advancementRecordCount?: number;
  summary?: any;
  advancementRecords?: AdvancementRecord[];
};

const recordStatuses = [
  "NOT_READY",
  "READY_TO_RECORD",
  "RECORDED_IN_AUDIT_MIRROR",
  "REJECTED",
  "BLOCKED",
  "CLOSED"
];

const targetStatuses = [
  "NONE",
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

export default function StatusAdvancementClient() {
  const [audit, setAudit] = useState<AuditOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const records = useMemo(() => audit?.advancementRecords ?? [], [audit]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return records;
    return records.filter((record) =>
      record.recordStatus === filter ||
      record.targetStatus === filter ||
      record.sourcePriorityBand === filter
    );
  }, [records, filter]);

  const selected = useMemo(() => {
    return records.find((record) => record.advancementId === selectedId) ?? filtered[0] ?? null;
  }, [records, filtered, selectedId]);

  useEffect(() => {
    loadAudit();
  }, []);

  async function loadAudit() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/status-advancement", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ30 load failed.");
      setAudit(json);
      setSelectedId(json.advancementRecords?.[0]?.advancementId ?? "");
      setMessage(`PJ30 loaded ${json.advancementRecordCount} status advancement records.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ30 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchRecord(key: keyof AdvancementRecord, value: string | boolean) {
    if (!selected || !audit?.advancementRecords) return;

    const updated = audit.advancementRecords.map((record) => {
      if (record.advancementId !== selected.advancementId) return record;
      return { ...record, [key]: value };
    });

    setAudit({ ...audit, advancementRecords: updated });
  }

  function patchMirror(key: keyof AdvancementRecord["auditMirror"], value: string | boolean) {
    if (!selected || !audit?.advancementRecords) return;

    const updated = audit.advancementRecords.map((record) => {
      if (record.advancementId !== selected.advancementId) return record;
      return { ...record, auditMirror: { ...record.auditMirror, [key]: value } };
    });

    setAudit({ ...audit, advancementRecords: updated });
  }

  function patchCandidate(key: keyof AdvancementRecord["candidateFacing"], value: string | boolean) {
    if (!selected || !audit?.advancementRecords) return;

    const updated = audit.advancementRecords.map((record) => {
      if (record.advancementId !== selected.advancementId) return record;
      return { ...record, candidateFacing: { ...record.candidateFacing, [key]: value } };
    });

    setAudit({ ...audit, advancementRecords: updated });
  }

  async function saveSelected(record: AdvancementRecord) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/status-advancement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advancementId: record.advancementId, record })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ30 save failed.");

      setAudit(json.audit);
      setSelectedId(json.record.advancementId);
      setMessage("Saved PJ30 status advancement audit record.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ30 save failed.");
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
        <p style={eyebrow}>PERSONAL-JOBS-30</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Status Advancement Audit Mirror</h1>
        <p style={muted}>Records approved proof-backed status changes in an audit mirror. No automatic tracker mutation or message sending.</p>
        <button onClick={loadAudit} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh audit"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Records" value={audit?.summary?.totalRecords ?? 0} />
        <Stat label="Ready" value={audit?.summary?.readyToRecord ?? 0} />
        <Stat label="Recorded" value={audit?.summary?.recordedInAuditMirror ?? 0} />
        <Stat label="Not ready" value={audit?.summary?.notReady ?? 0} />
        <Stat label="Proof-backed" value={audit?.summary?.proofBacked ?? 0} />
        <Stat label="Approved" value={audit?.summary?.approved ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Advancement records</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All records</option>
            {recordStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            {targetStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            <option value="P0_URGENT">P0_URGENT</option>
            <option value="P1_HIGH">P1_HIGH</option>
            <option value="P2_NORMAL">P2_NORMAL</option>
            <option value="P3_LOW">P3_LOW</option>
            <option value="P4_WAIT">P4_WAIT</option>
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((record) => (
              <button
                key={record.advancementId}
                onClick={() => setSelectedId(record.advancementId)}
                style={{
                  ...queueCard,
                  outline: selected?.advancementId === record.advancementId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{record.context?.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{record.recordStatus} / {record.targetStatus}</span>
                <small>{record.proofReference ? "proof-backed" : "needs proof"}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No status advancement record selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.recordStatus}</p>
              <h2>{selected.context?.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.context?.opportunity?.company || "Unknown company"} - target: {selected.targetStatus}</p>

              <section style={subPanel}>
                <h3>Audit mirror control</h3>
                <div style={formGrid}>
                  <Select label="Record status" value={selected.recordStatus} options={recordStatuses} onChange={(v) => patchRecord("recordStatus", v)} />
                  <Select label="Target status" value={selected.targetStatus} options={targetStatuses} onChange={(v) => patchRecord("targetStatus", v)} />
                  <Input label="Proof reference" value={selected.proofReference} onChange={(v) => patchRecord("proofReference", v)} />
                  <Input label="Recorded by" value={selected.auditMirror.recordedBy} onChange={(v) => patchMirror("recordedBy", v)} />
                  <Input label="Recorded at" value={selected.auditMirror.recordedAt} onChange={(v) => patchMirror("recordedAt", v)} />
                  <Input label="Audit reference" value={selected.auditMirror.auditReference} onChange={(v) => patchMirror("auditReference", v)} />
                </div>

                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.advanceApproved} onChange={(e) => patchRecord("advanceApproved", e.target.checked)} />
                  Advance approved
                </label>

                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.auditMirror.recordedInAuditMirror} onChange={(e) => patchMirror("recordedInAuditMirror", e.target.checked)} />
                  Recorded in audit mirror
                </label>

                <TextArea label="Audit note" value={selected.auditMirror.auditNote} onChange={(v) => patchMirror("auditNote", v)} />
              </section>

              <section style={subPanel}>
                <h3>Candidate-facing draft</h3>
                <TextArea label="Candidate message draft" value={selected.candidateFacing.candidateMessageDraft} onChange={(v) => patchCandidate("candidateMessageDraft", v)} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={buttonSecondary} onClick={() => copyText(selected.candidateFacing.candidateMessageDraft)}>
                    Copy message
                  </button>
                  <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                    Save audit record
                  </button>
                </div>

                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.candidateFacing.candidateMessageApproved} onChange={(e) => patchCandidate("candidateMessageApproved", e.target.checked)} />
                  Candidate message approved
                </label>

                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.candidateFacing.candidateMessageSentManually} onChange={(e) => patchCandidate("candidateMessageSentManually", e.target.checked)} />
                  Candidate message sent manually
                </label>

                <Input label="Manual send proof" value={selected.candidateFacing.manualSendProof} onChange={(v) => patchCandidate("manualSendProof", v)} />
              </section>

              <section style={subPanel}>
                <h3>Gate</h3>
                <ul style={listStyle}>
                  <li>Can record audit mirror: {selected.controls.canRecordAuditMirror ? "Yes" : "No"}</li>
                  <li>Requires proof: {selected.controls.requiresProof ? "Yes" : "No"}</li>
                  <li>Requires approval: {selected.controls.requiresApproval ? "Yes" : "No"}</li>
                  <li>Auto mutates tracker: {selected.controls.autoMutatesApplicationTracker ? "Yes" : "No"}</li>
                  <li>Auto mutates proof board: {selected.controls.autoMutatesProofBoard ? "Yes" : "No"}</li>
                  <li>Auto sends candidate message: {selected.controls.autoSendsCandidateMessage ? "Yes" : "No"}</li>
                </ul>
              </section>

              <section style={subPanel}>
                <h3>Audit rules</h3>
                <ul style={listStyle}>{selected.auditRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
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

const checkLabel = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#d8caa8",
  marginTop: 14
};

const listStyle = {
  color: "#d8caa8",
  lineHeight: 1.55,
  paddingLeft: 22
};