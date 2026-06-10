"use client";

import { useEffect, useMemo, useState } from "react";

type Thread = {
  threadId: string;
  trackerId: string;
  workbenchId: string;
  packId: string;
  threadStatus: string;
  questionCategory: string;
  priority: string;
  candidate: {
    candidateAcknowledged: boolean;
    candidateQuestion: string;
    lastCandidateNoteAt: string;
  };
  context: {
    candidateStatus: string;
    candidateMessage: string;
    opportunity: any;
    proof: any;
    outcome: any;
    timeline: any;
  };
  operator: {
    operatorResponseDraft: string;
    operatorResponseFinal: string;
    approvedForManualSend: boolean;
    manualSendChannel: string;
    manualSentAt: string;
    manualSendProof: string;
    internalNotes: string;
  };
  responseRules: string[];
};

type InboxOutput = {
  status?: string;
  generatedAt?: string;
  threadCount?: number;
  summary?: any;
  threads?: Thread[];
};

const threadStatuses = [
  "NO_QUESTION",
  "CANDIDATE_QUESTION_PENDING",
  "OPERATOR_RESPONSE_DRAFTED",
  "RESPONSE_APPROVED_FOR_MANUAL_SEND",
  "RESPONSE_MARKED_SENT_WITH_PROOF",
  "CLOSED"
];

const questionCategories = [
  "STATUS_QUESTION",
  "PROOF_REQUEST",
  "DEADLINE_QUESTION",
  "DOCUMENT_QUESTION",
  "OUTCOME_QUESTION",
  "GENERAL"
];

export default function FollowUpInboxClient() {
  const [inbox, setInbox] = useState<InboxOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const threads = useMemo(() => inbox?.threads ?? [], [inbox]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return threads;
    return threads.filter((thread) => thread.threadStatus === filter || thread.questionCategory === filter);
  }, [threads, filter]);

  const selected = useMemo(() => {
    return threads.find((thread) => thread.threadId === selectedId) ?? filtered[0] ?? null;
  }, [threads, filtered, selectedId]);

  useEffect(() => {
    loadInbox();
  }, []);

  async function loadInbox() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/follow-up-inbox", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ25 load failed.");
      setInbox(json);
      setSelectedId(json.threads?.[0]?.threadId ?? "");
      setMessage(`PJ25 loaded ${json.threadCount} follow-up threads.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ25 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchThread(key: keyof Thread, value: string) {
    if (!selected || !inbox?.threads) return;

    const updatedThreads = inbox.threads.map((thread) => {
      if (thread.threadId !== selected.threadId) return thread;
      return { ...thread, [key]: value };
    });

    setInbox({ ...inbox, threads: updatedThreads });
  }

  function patchOperator(key: keyof Thread["operator"], value: string | boolean) {
    if (!selected || !inbox?.threads) return;

    const updatedThreads = inbox.threads.map((thread) => {
      if (thread.threadId !== selected.threadId) return thread;
      return {
        ...thread,
        operator: {
          ...thread.operator,
          [key]: value
        }
      };
    });

    setInbox({ ...inbox, threads: updatedThreads });
  }

  async function saveSelected(thread: Thread) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/follow-up-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.threadId,
          thread: {
            threadStatus: thread.threadStatus,
            questionCategory: thread.questionCategory,
            operator: thread.operator
          }
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ25 save failed.");

      setInbox(json.inbox);
      setSelectedId(json.thread.threadId);
      setMessage("Saved follow-up thread.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ25 save failed.");
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
        <p style={eyebrow}>PERSONAL-JOBS-25</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Follow-Up Inbox</h1>
        <p style={muted}>Candidate questions and operator response queue. No automatic sending.</p>
        <button onClick={loadInbox} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh inbox"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Threads" value={inbox?.summary?.totalThreads ?? 0} />
        <Stat label="Pending" value={inbox?.summary?.candidateQuestionsPending ?? 0} />
        <Stat label="Drafted" value={inbox?.summary?.operatorDrafted ?? 0} />
        <Stat label="Approved" value={inbox?.summary?.approvedForManualSend ?? 0} />
        <Stat label="Sent proof" value={inbox?.summary?.markedSentWithProof ?? 0} />
        <Stat label="No question" value={inbox?.summary?.noQuestion ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Queue</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All threads</option>
            {threadStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            {questionCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((thread) => (
              <button
                key={thread.threadId}
                onClick={() => setSelectedId(thread.threadId)}
                style={{
                  ...queueCard,
                  outline: selected?.threadId === thread.threadId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{thread.context?.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{thread.context?.opportunity?.company || "Unknown company"} - {thread.questionCategory}</span>
                <small>{thread.threadStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No follow-up thread selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.threadStatus}</p>
              <h2>{selected.context?.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.context?.opportunity?.company || "Unknown company"} - {selected.context?.candidateStatus}</p>

              <section style={subPanel}>
                <h3>Candidate question</h3>
                <p style={messageBox}>{selected.candidate.candidateQuestion || "No candidate question yet."}</p>
                <p style={muted}>Last note: {selected.candidate.lastCandidateNoteAt || "None"}</p>
              </section>

              <section style={subPanel}>
                <h3>Context</h3>
                <p style={muted}>{selected.context?.candidateMessage || ""}</p>
                <p style={muted}>Proof captured: {selected.context?.proof?.proofCaptured ? "Yes" : "No"}</p>
                <p style={muted}>Outcome: {selected.context?.outcome?.outcomeStatus || "NONE"}</p>
              </section>

              <section style={subPanel}>
                <h3>Operator response</h3>
                <div style={formGrid}>
                  <Select label="Thread status" value={selected.threadStatus} options={threadStatuses} onChange={(v) => patchThread("threadStatus", v)} />
                  <Select label="Question category" value={selected.questionCategory} options={questionCategories} onChange={(v) => patchThread("questionCategory", v)} />
                  <Input label="Manual send channel" value={selected.operator.manualSendChannel} onChange={(v) => patchOperator("manualSendChannel", v)} placeholder="in-app / email / WhatsApp manual / phone" />
                  <Input label="Manual sent at" value={selected.operator.manualSentAt} onChange={(v) => patchOperator("manualSentAt", v)} placeholder="YYYY-MM-DD HH:mm" />
                  <Input label="Manual send proof" value={selected.operator.manualSendProof} onChange={(v) => patchOperator("manualSendProof", v)} placeholder="copy/paste proof reference" />
                </div>

                <TextArea label="Draft response" value={selected.operator.operatorResponseDraft} onChange={(v) => patchOperator("operatorResponseDraft", v)} />
                <TextArea label="Final approved response" value={selected.operator.operatorResponseFinal} onChange={(v) => patchOperator("operatorResponseFinal", v)} />
                <TextArea label="Internal notes" value={selected.operator.internalNotes} onChange={(v) => patchOperator("internalNotes", v)} />

                <label style={checkLabel}>
                  <input
                    type="checkbox"
                    checked={selected.operator.approvedForManualSend}
                    onChange={(e) => patchOperator("approvedForManualSend", e.target.checked)}
                  />
                  Approved for manual send
                </label>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                    Save thread
                  </button>
                  <button style={buttonSecondary} onClick={() => copyText(selected.operator.operatorResponseFinal || selected.operator.operatorResponseDraft)}>
                    Copy response
                  </button>
                </div>
              </section>

              <section style={subPanel}>
                <h3>Rules</h3>
                <ul style={listStyle}>{selected.responseRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
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

const messageBox = {
  color: "#f8f0db",
  lineHeight: 1.6,
  background: "rgba(215,173,73,.12)",
  border: "1px solid rgba(215,173,73,.28)",
  borderRadius: 16,
  padding: 14
};