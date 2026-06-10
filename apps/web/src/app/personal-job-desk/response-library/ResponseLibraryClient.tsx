"use client";

import { useEffect, useMemo, useState } from "react";

type Template = {
  templateKey: string;
  category: string;
  title: string;
  body: string;
  requiredProofRule: string;
  allowedChannels: string[];
};

type Workflow = {
  workflowId: string;
  threadId: string;
  trackerId: string;
  packId: string;
  questionCategory: string;
  responseStatus: string;
  selectedTemplateKey: string;
  candidateQuestion: string;
  context: any;
  operatorDraft: string;
  finalResponse: string;
  approval: {
    approvedForManualSend: boolean;
    approvedBy: string;
    approvedAt: string;
  };
  manualSend: {
    channel: string;
    sentAt: string;
    manualSendProof: string;
    sentBy: string;
    proofCaptured: boolean;
  };
  responseChecklist: Array<{
    key: string;
    label: string;
    required: boolean;
    completed: boolean;
  }>;
};

type LibraryOutput = {
  status?: string;
  generatedAt?: string;
  responseWorkflowCount?: number;
  summary?: any;
  templates?: Template[];
  responseWorkflows?: Workflow[];
};

const responseStatuses = [
  "NO_RESPONSE_NEEDED",
  "DRAFT_AVAILABLE",
  "FINAL_READY_FOR_APPROVAL",
  "APPROVED_FOR_MANUAL_SEND",
  "MANUAL_SEND_PROOF_CAPTURED",
  "CLOSED"
];

export default function ResponseLibraryClient() {
  const [library, setLibrary] = useState<LibraryOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const workflows = useMemo(() => library?.responseWorkflows ?? [], [library]);
  const templates = useMemo(() => library?.templates ?? [], [library]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return workflows;
    return workflows.filter((workflow) => workflow.responseStatus === filter || workflow.questionCategory === filter);
  }, [workflows, filter]);

  const selected = useMemo(() => {
    return workflows.find((workflow) => workflow.workflowId === selectedId) ?? filtered[0] ?? null;
  }, [workflows, filtered, selectedId]);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/response-library", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ26 load failed.");
      setLibrary(json);
      setSelectedId(json.responseWorkflows?.[0]?.workflowId ?? "");
      setMessage(`PJ26 loaded ${json.responseWorkflowCount} response workflows.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ26 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchWorkflow(key: keyof Workflow, value: string) {
    if (!selected || !library?.responseWorkflows) return;

    const updated = library.responseWorkflows.map((workflow) => {
      if (workflow.workflowId !== selected.workflowId) return workflow;
      return { ...workflow, [key]: value };
    });

    setLibrary({ ...library, responseWorkflows: updated });
  }

  function patchApproval(key: keyof Workflow["approval"], value: string | boolean) {
    if (!selected || !library?.responseWorkflows) return;

    const updated = library.responseWorkflows.map((workflow) => {
      if (workflow.workflowId !== selected.workflowId) return workflow;
      return {
        ...workflow,
        approval: {
          ...workflow.approval,
          [key]: value
        }
      };
    });

    setLibrary({ ...library, responseWorkflows: updated });
  }

  function patchManualSend(key: keyof Workflow["manualSend"], value: string) {
    if (!selected || !library?.responseWorkflows) return;

    const updated = library.responseWorkflows.map((workflow) => {
      if (workflow.workflowId !== selected.workflowId) return workflow;
      return {
        ...workflow,
        manualSend: {
          ...workflow.manualSend,
          [key]: value
        }
      };
    });

    setLibrary({ ...library, responseWorkflows: updated });
  }

  function applyTemplate(template: Template) {
    if (!selected) return;

    const title = selected.context?.opportunity?.title || "this opportunity";
    const company = selected.context?.opportunity?.company || "the employer";
    const candidateStatus = selected.context?.candidateStatus || "REVIEW_REQUIRED";

    const body = template.body
      .replaceAll("{{title}}", title)
      .replaceAll("{{company}}", company)
      .replaceAll("{{candidateStatus}}", candidateStatus);

    patchWorkflow("selectedTemplateKey", template.templateKey);
    patchWorkflow("operatorDraft", body);
  }

  async function saveSelected(workflow: Workflow) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/response-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: workflow.workflowId, workflow })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ26 save failed.");

      setLibrary(json.library);
      setSelectedId(json.workflow.workflowId);
      setMessage("Saved PJ26 response workflow.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ26 save failed.");
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
        <p style={eyebrow}>PERSONAL-JOBS-26</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Response Library</h1>
        <p style={muted}>Reusable operator templates and manual-send proof workflow. No automatic sending.</p>
        <button onClick={loadLibrary} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh library"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Workflows" value={library?.summary?.totalWorkflows ?? 0} />
        <Stat label="Templates" value={library?.summary?.templateCount ?? 0} />
        <Stat label="No response" value={library?.summary?.noResponseNeeded ?? 0} />
        <Stat label="Drafts" value={library?.summary?.draftAvailable ?? 0} />
        <Stat label="Approved" value={library?.summary?.approvedForManualSend ?? 0} />
        <Stat label="Proof sent" value={library?.summary?.manualSendProofCaptured ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Response queue</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All workflows</option>
            {responseStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            <option value="STATUS_QUESTION">STATUS_QUESTION</option>
            <option value="PROOF_REQUEST">PROOF_REQUEST</option>
            <option value="DEADLINE_QUESTION">DEADLINE_QUESTION</option>
            <option value="DOCUMENT_QUESTION">DOCUMENT_QUESTION</option>
            <option value="OUTCOME_QUESTION">OUTCOME_QUESTION</option>
            <option value="GENERAL">GENERAL</option>
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((workflow) => (
              <button
                key={workflow.workflowId}
                onClick={() => setSelectedId(workflow.workflowId)}
                style={{
                  ...queueCard,
                  outline: selected?.workflowId === workflow.workflowId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{workflow.context?.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{workflow.questionCategory}</span>
                <small>{workflow.responseStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No response workflow selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.responseStatus}</p>
              <h2>{selected.context?.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.context?.opportunity?.company || "Unknown company"} - {selected.questionCategory}</p>

              <section style={subPanel}>
                <h3>Candidate question</h3>
                <p style={messageBox}>{selected.candidateQuestion || "No candidate question yet."}</p>
              </section>

              <section style={subPanel}>
                <h3>Templates</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {templates.map((template) => (
                    <button key={template.templateKey} style={templateCard} onClick={() => applyTemplate(template)}>
                      <strong>{template.title}</strong>
                      <span>{template.category}</span>
                      <small>{template.requiredProofRule}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section style={subPanel}>
                <h3>Response workflow</h3>
                <div style={formGrid}>
                  <Select label="Response status" value={selected.responseStatus} options={responseStatuses} onChange={(v) => patchWorkflow("responseStatus", v)} />
                  <Input label="Approved by" value={selected.approval.approvedBy} onChange={(v) => patchApproval("approvedBy", v)} />
                  <Input label="Approved at" value={selected.approval.approvedAt} onChange={(v) => patchApproval("approvedAt", v)} />
                  <Input label="Manual channel" value={selected.manualSend.channel} onChange={(v) => patchManualSend("channel", v)} placeholder="in-app / email manual / WhatsApp urgent-only" />
                  <Input label="Sent at" value={selected.manualSend.sentAt} onChange={(v) => patchManualSend("sentAt", v)} placeholder="YYYY-MM-DD HH:mm" />
                  <Input label="Sent by" value={selected.manualSend.sentBy} onChange={(v) => patchManualSend("sentBy", v)} />
                  <Input label="Manual send proof" value={selected.manualSend.manualSendProof} onChange={(v) => patchManualSend("manualSendProof", v)} />
                </div>

                <TextArea label="Operator draft" value={selected.operatorDraft} onChange={(v) => patchWorkflow("operatorDraft", v)} />
                <TextArea label="Final response" value={selected.finalResponse} onChange={(v) => patchWorkflow("finalResponse", v)} />

                <label style={checkLabel}>
                  <input
                    type="checkbox"
                    checked={selected.approval.approvedForManualSend}
                    onChange={(e) => patchApproval("approvedForManualSend", e.target.checked)}
                  />
                  Approved for manual send
                </label>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                    Save workflow
                  </button>
                  <button style={buttonSecondary} onClick={() => copyText(selected.finalResponse || selected.operatorDraft)}>
                    Copy response
                  </button>
                </div>
              </section>

              <section style={subPanel}>
                <h3>Checklist</h3>
                <ul style={listStyle}>{selected.responseChecklist.map((item) => <li key={item.key}>{item.completed ? "✅" : "⚠️"} {item.label}</li>)}</ul>
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

const templateCard = {
  textAlign: "left" as const,
  border: "1px solid rgba(255,215,122,.18)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(215,173,73,.08)",
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

const messageBox = {
  color: "#f8f0db",
  lineHeight: 1.6,
  background: "rgba(215,173,73,.12)",
  border: "1px solid rgba(215,173,73,.28)",
  borderRadius: 16,
  padding: 14
};