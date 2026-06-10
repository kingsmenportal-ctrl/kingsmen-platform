"use client";

import { useEffect, useMemo, useState } from "react";

type ChecklistItem = {
  key: string;
  label: string;
  required: boolean;
  completed: boolean;
  note?: string;
};

type WorkbenchRecord = {
  workbenchId: string;
  ledgerId: string;
  packId: string;
  readiness: any;
  pack: any;
  execution: {
    executionStatus: string;
    applicationMethod: string;
    startedAt: string;
    submittedAt: string;
    proofType: string;
    proofReference: string;
    proofNotes: string;
    followUpDate: string;
    outcomeStatus: string;
    outcomeNotes: string;
    executorNotes: string;
  };
  checklist: ChecklistItem[];
  officialSource: {
    sourceUrl: string;
    applyUrl: string;
    title: string;
    company: string;
    location: string;
  };
  proofRules: string[];
};

type WorkbenchOutput = {
  status?: string;
  generatedAt?: string;
  workbenchRecordCount?: number;
  summary?: any;
  records?: WorkbenchRecord[];
};

const executionStatuses = [
  "NOT_READY_REVIEW_REQUIRED",
  "READY_TO_EXECUTE_MANUALLY",
  "MANUAL_SUBMISSION_STARTED",
  "SUBMITTED_PROOF_CAPTURED",
  "FOLLOW_UP_SCHEDULED",
  "OUTCOME_INTERVIEW",
  "OUTCOME_REJECTED",
  "OUTCOME_OFFER",
  "OUTCOME_NO_RESPONSE",
  "CLOSED_NOT_APPLYING"
];

const outcomeStatuses = [
  "NONE",
  "SUBMITTED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "NO_RESPONSE",
  "WITHDRAWN"
];

export default function ManualSubmissionWorkbenchClient() {
  const [workbench, setWorkbench] = useState<WorkbenchOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const records = useMemo(() => workbench?.records ?? [], [workbench]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return records;
    return records.filter((record) => record.execution.executionStatus === filter);
  }, [records, filter]);

  const selected = useMemo(() => {
    return records.find((record) => record.workbenchId === selectedId) ?? filtered[0] ?? null;
  }, [records, filtered, selectedId]);

  useEffect(() => {
    loadWorkbench();
  }, []);

  async function loadWorkbench() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/manual-submission-workbench", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ23 load failed.");
      setWorkbench(json);
      setSelectedId(json.records?.[0]?.workbenchId ?? "");
      setMessage(`PJ23 loaded ${json.workbenchRecordCount} workbench records.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ23 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchExecution(key: keyof WorkbenchRecord["execution"], value: string) {
    if (!selected || !workbench?.records) return;

    const updatedRecords = workbench.records.map((record) => {
      if (record.workbenchId !== selected.workbenchId) return record;
      return {
        ...record,
        execution: {
          ...record.execution,
          [key]: value
        }
      };
    });

    setWorkbench({ ...workbench, records: updatedRecords });
  }

  function patchChecklist(key: string, completed: boolean) {
    if (!selected || !workbench?.records) return;

    const updatedRecords = workbench.records.map((record) => {
      if (record.workbenchId !== selected.workbenchId) return record;
      return {
        ...record,
        checklist: record.checklist.map((item) => item.key === key ? { ...item, completed } : item)
      };
    });

    setWorkbench({ ...workbench, records: updatedRecords });
  }

  async function saveSelected(record: WorkbenchRecord) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/manual-submission-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbenchId: record.workbenchId,
          execution: record.execution,
          checklist: record.checklist
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ23 save failed.");

      setWorkbench(json.workbench);
      setSelectedId(json.record.workbenchId);
      setMessage("Saved PJ23 manual execution record.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ23 save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Copied.");
  }

  return (
    <main style={main}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-23</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Manual Submission Workbench</h1>
        <p style={muted}>
          Execute approved PJ22 records manually, capture proof, schedule follow-ups, and record outcomes.
          No auto-apply. No employer contact. No email or WhatsApp sending.
        </p>
        <button onClick={loadWorkbench} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh workbench"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Total" value={workbench?.summary?.totalRecords ?? 0} />
        <Stat label="Not ready" value={workbench?.summary?.notReadyReviewRequired ?? 0} />
        <Stat label="Ready manual" value={workbench?.summary?.readyToExecuteManually ?? 0} />
        <Stat label="Started" value={workbench?.summary?.manualSubmissionStarted ?? 0} />
        <Stat label="Proof captured" value={workbench?.summary?.submittedProofCaptured ?? 0} />
        <Stat label="Outcomes" value={workbench?.summary?.outcomesRecorded ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Manual queue</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All records</option>
            {executionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((record) => (
              <button
                key={record.workbenchId}
                onClick={() => setSelectedId(record.workbenchId)}
                style={{
                  ...queueCard,
                  outline: selected?.workbenchId === record.workbenchId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{record.officialSource.title || "Untitled role"}</strong>
                <span>{record.officialSource.company || "Unknown company"} - {record.officialSource.location || "Unknown location"}</span>
                <small>{record.execution.executionStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No PJ23 record selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.execution.executionStatus}</p>
              <h2>{selected.officialSource.title || "Untitled role"}</h2>
              <p style={muted}>{selected.officialSource.company || "Unknown company"} - {selected.officialSource.location || "Unknown location"}</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {selected.officialSource.sourceUrl ? <a href={selected.officialSource.sourceUrl} target="_blank" rel="noreferrer" style={linkButton}>Open source</a> : null}
                {selected.officialSource.applyUrl ? <a href={selected.officialSource.applyUrl} target="_blank" rel="noreferrer" style={linkButton}>Open apply URL</a> : null}
                {selected.pack?.motivationDraft ? <button style={smallButton} onClick={() => copyText(selected.pack.motivationDraft)}>Copy motivation</button> : null}
              </div>

              <section style={subPanel}>
                <h3>Execution fields</h3>
                <div style={formGrid}>
                  <Select label="Execution status" value={selected.execution.executionStatus} options={executionStatuses} onChange={(v) => patchExecution("executionStatus", v)} />
                  <Select label="Outcome status" value={selected.execution.outcomeStatus} options={outcomeStatuses} onChange={(v) => patchExecution("outcomeStatus", v)} />
                  <Input label="Application method" value={selected.execution.applicationMethod} onChange={(v) => patchExecution("applicationMethod", v)} placeholder="official portal / email / walk-in / other" />
                  <Input label="Started at" value={selected.execution.startedAt} onChange={(v) => patchExecution("startedAt", v)} placeholder="YYYY-MM-DD HH:mm" />
                  <Input label="Submitted at" value={selected.execution.submittedAt} onChange={(v) => patchExecution("submittedAt", v)} placeholder="YYYY-MM-DD HH:mm" />
                  <Input label="Proof type" value={selected.execution.proofType} onChange={(v) => patchExecution("proofType", v)} placeholder="screenshot / email / reference number" />
                  <Input label="Proof reference" value={selected.execution.proofReference} onChange={(v) => patchExecution("proofReference", v)} />
                  <Input label="Follow-up date" value={selected.execution.followUpDate} onChange={(v) => patchExecution("followUpDate", v)} placeholder="YYYY-MM-DD" />
                </div>

                <TextArea label="Proof notes" value={selected.execution.proofNotes} onChange={(v) => patchExecution("proofNotes", v)} />
                <TextArea label="Outcome notes" value={selected.execution.outcomeNotes} onChange={(v) => patchExecution("outcomeNotes", v)} />
                <TextArea label="Executor notes" value={selected.execution.executorNotes} onChange={(v) => patchExecution("executorNotes", v)} />

                <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                  Save PJ23 record
                </button>
              </section>

              <section style={subPanel}>
                <h3>Manual checklist</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {selected.checklist.map((item) => (
                    <label key={item.key} style={checkLabel}>
                      <input type="checkbox" checked={item.completed} onChange={(e) => patchChecklist(item.key, e.target.checked)} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section style={subPanel}>
                <h3>CV focus</h3>
                <ul style={listStyle}>{(selected.pack?.cvFocus ?? []).map((item: string) => <li key={item}>{item}</li>)}</ul>
              </section>

              <section style={subPanel}>
                <h3>Motivation draft</h3>
                <pre style={pre}>{selected.pack?.motivationDraft ?? ""}</pre>
              </section>

              <section style={subPanel}>
                <h3>Proof rules</h3>
                <ul style={listStyle}>{selected.proofRules.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>

              <section style={subPanel}>
                <h3>Safety boundary</h3>
                <p style={muted}>
                  PJ23 does not submit applications automatically, send email, send WhatsApp, contact employers,
                  touch payments, bypass login, bypass OTP, or bypass CAPTCHA.
                </p>
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
  minHeight: 84,
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

const smallButton = {
  border: 0,
  borderRadius: 999,
  background: "#d7ad49",
  color: "#111",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer"
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

const pre = {
  whiteSpace: "pre-wrap" as const,
  color: "#d8caa8",
  background: "rgba(0,0,0,.25)",
  padding: 12,
  borderRadius: 12,
  maxHeight: 320,
  overflow: "auto"
};

const listStyle = {
  color: "#d8caa8",
  lineHeight: 1.55,
  paddingLeft: 22
};