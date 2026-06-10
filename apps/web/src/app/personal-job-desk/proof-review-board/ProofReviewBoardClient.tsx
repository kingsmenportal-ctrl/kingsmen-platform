"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewItem = {
  reviewId: string;
  worklistId: string;
  queueId: string;
  workflowId: string;
  threadId: string;
  trackerId: string;
  packId: string;
  reviewStatus: string;
  priorityBand: string;
  priorityScore: number;
  context: any;
  proof: {
    proofReference: string;
    proofType: string;
    proofLocation: string;
    proofCapturedAt: string;
    proofNotes: string;
    proofIsSensitive: boolean;
    proofVisibleToCandidate: boolean;
  };
  reviewDecision: {
    decision: string;
    decidedBy: string;
    decidedAt: string;
    decisionNote: string;
    rejectionReason: string;
  };
  statusAdvance: {
    targetStatus: string;
    advanceApproved: boolean;
    advancedAt: string;
    advancedBy: string;
    advancementProof: string;
    advancementNote: string;
  };
  controls: {
    canAdvanceStatus: boolean;
    requiresProof: boolean;
    requiresFounderDecision: boolean;
    requiresHumanAction: boolean;
    autoMutatesTracker: boolean;
    autoMutatesWorklist: boolean;
    autoSendsCandidateMessage: boolean;
    autoContactsEmployer: boolean;
  };
  auditRules: string[];
};

type BoardOutput = {
  status?: string;
  generatedAt?: string;
  reviewItemCount?: number;
  summary?: any;
  reviewItems?: ReviewItem[];
};

const reviewStatuses = [
  "WAITING_FOUNDER_DECISION",
  "NEEDS_PROOF",
  "READY_FOR_REVIEW",
  "APPROVED_FOR_STATUS_ADVANCE",
  "REJECTED_PROOF",
  "STATUS_ADVANCE_RECORDED",
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

export default function ProofReviewBoardClient() {
  const [board, setBoard] = useState<BoardOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => board?.reviewItems ?? [], [board]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) =>
      item.reviewStatus === filter ||
      item.priorityBand === filter ||
      item.statusAdvance.targetStatus === filter
    );
  }, [items, filter]);

  const selected = useMemo(() => {
    return items.find((item) => item.reviewId === selectedId) ?? filtered[0] ?? null;
  }, [items, filtered, selectedId]);

  useEffect(() => {
    loadBoard();
  }, []);

  async function loadBoard() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/proof-review-board", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ29 load failed.");
      setBoard(json);
      setSelectedId(json.reviewItems?.[0]?.reviewId ?? "");
      setMessage(`PJ29 loaded ${json.reviewItemCount} proof review items.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ29 load failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchItem(key: keyof ReviewItem, value: string) {
    if (!selected || !board?.reviewItems) return;

    const updated = board.reviewItems.map((item) => {
      if (item.reviewId !== selected.reviewId) return item;
      return { ...item, [key]: value };
    });

    setBoard({ ...board, reviewItems: updated });
  }

  function patchProof(key: keyof ReviewItem["proof"], value: string | boolean) {
    if (!selected || !board?.reviewItems) return;

    const updated = board.reviewItems.map((item) => {
      if (item.reviewId !== selected.reviewId) return item;
      return { ...item, proof: { ...item.proof, [key]: value } };
    });

    setBoard({ ...board, reviewItems: updated });
  }

  function patchDecision(key: keyof ReviewItem["reviewDecision"], value: string) {
    if (!selected || !board?.reviewItems) return;

    const updated = board.reviewItems.map((item) => {
      if (item.reviewId !== selected.reviewId) return item;
      return { ...item, reviewDecision: { ...item.reviewDecision, [key]: value } };
    });

    setBoard({ ...board, reviewItems: updated });
  }

  function patchAdvance(key: keyof ReviewItem["statusAdvance"], value: string | boolean) {
    if (!selected || !board?.reviewItems) return;

    const updated = board.reviewItems.map((item) => {
      if (item.reviewId !== selected.reviewId) return item;
      return { ...item, statusAdvance: { ...item.statusAdvance, [key]: value } };
    });

    setBoard({ ...board, reviewItems: updated });
  }

  async function saveSelected(item: ReviewItem) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/proof-review-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: item.reviewId, item })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ29 save failed.");

      setBoard(json.board);
      setSelectedId(json.item.reviewId);
      setMessage("Saved PJ29 proof review item.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ29 save failed.");
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
        <p style={eyebrow}>PERSONAL-JOBS-29</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Proof Review Board</h1>
        <p style={muted}>Proof and founder/operator decision gate before any status advancement. No automatic mutation or sending.</p>
        <button onClick={loadBoard} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh board"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Items" value={board?.summary?.totalItems ?? 0} />
        <Stat label="Waiting founder" value={board?.summary?.waitingFounderDecision ?? 0} />
        <Stat label="Needs proof" value={board?.summary?.needsProof ?? 0} />
        <Stat label="Ready review" value={board?.summary?.readyForReview ?? 0} />
        <Stat label="Approved" value={board?.summary?.approvedForStatusAdvance ?? 0} />
        <Stat label="Can advance" value={board?.summary?.canAdvanceStatus ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Review queue</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All items</option>
            {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            {targetStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            <option value="P0_URGENT">P0_URGENT</option>
            <option value="P1_HIGH">P1_HIGH</option>
            <option value="P2_NORMAL">P2_NORMAL</option>
            <option value="P3_LOW">P3_LOW</option>
            <option value="P4_WAIT">P4_WAIT</option>
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((item) => (
              <button
                key={item.reviewId}
                onClick={() => setSelectedId(item.reviewId)}
                style={{
                  ...queueCard,
                  outline: selected?.reviewId === item.reviewId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{item.context?.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{item.priorityBand} / {item.statusAdvance.targetStatus}</span>
                <small>{item.reviewStatus}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No proof review item selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.reviewStatus}</p>
              <h2>{selected.context?.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.context?.opportunity?.company || "Unknown company"} - target: {selected.statusAdvance.targetStatus}</p>

              <section style={subPanel}>
                <h3>Action packet</h3>
                <p style={messageBox}>{selected.context?.actionPacket?.operatorAction || "No action packet."}</p>
                <p style={muted}>Required proof: {selected.context?.actionPacket?.requiredProof || "None"}</p>
                <button style={buttonSecondary} onClick={() => copyText(selected.context?.actionPacket?.operatorAction || "")}>
                  Copy action
                </button>
              </section>

              <section style={subPanel}>
                <h3>Proof</h3>
                <div style={formGrid}>
                  <Input label="Proof reference" value={selected.proof.proofReference} onChange={(v) => patchProof("proofReference", v)} />
                  <Input label="Proof type" value={selected.proof.proofType} onChange={(v) => patchProof("proofType", v)} placeholder="screenshot / email / ref / portal / call note" />
                  <Input label="Proof location" value={selected.proof.proofLocation} onChange={(v) => patchProof("proofLocation", v)} />
                  <Input label="Proof captured at" value={selected.proof.proofCapturedAt} onChange={(v) => patchProof("proofCapturedAt", v)} />
                </div>
                <TextArea label="Proof notes" value={selected.proof.proofNotes} onChange={(v) => patchProof("proofNotes", v)} />
                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.proof.proofIsSensitive} onChange={(e) => patchProof("proofIsSensitive", e.target.checked)} />
                  Proof is sensitive/internal
                </label>
                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.proof.proofVisibleToCandidate} onChange={(e) => patchProof("proofVisibleToCandidate", e.target.checked)} />
                  Candidate may see proof summary
                </label>
              </section>

              <section style={subPanel}>
                <h3>Review decision</h3>
                <div style={formGrid}>
                  <Select label="Review status" value={selected.reviewStatus} options={reviewStatuses} onChange={(v) => patchItem("reviewStatus", v)} />
                  <Input label="Decision" value={selected.reviewDecision.decision} onChange={(v) => patchDecision("decision", v)} placeholder="approve / reject / block / defer" />
                  <Input label="Decided by" value={selected.reviewDecision.decidedBy} onChange={(v) => patchDecision("decidedBy", v)} />
                  <Input label="Decided at" value={selected.reviewDecision.decidedAt} onChange={(v) => patchDecision("decidedAt", v)} />
                </div>
                <TextArea label="Decision note" value={selected.reviewDecision.decisionNote} onChange={(v) => patchDecision("decisionNote", v)} />
                <TextArea label="Rejection reason" value={selected.reviewDecision.rejectionReason} onChange={(v) => patchDecision("rejectionReason", v)} />
              </section>

              <section style={subPanel}>
                <h3>Status advancement control</h3>
                <div style={formGrid}>
                  <Select label="Target status" value={selected.statusAdvance.targetStatus} options={targetStatuses} onChange={(v) => patchAdvance("targetStatus", v)} />
                  <Input label="Advanced by" value={selected.statusAdvance.advancedBy} onChange={(v) => patchAdvance("advancedBy", v)} />
                  <Input label="Advanced at" value={selected.statusAdvance.advancedAt} onChange={(v) => patchAdvance("advancedAt", v)} />
                  <Input label="Advancement proof" value={selected.statusAdvance.advancementProof} onChange={(v) => patchAdvance("advancementProof", v)} />
                </div>
                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.statusAdvance.advanceApproved} onChange={(e) => patchAdvance("advanceApproved", e.target.checked)} />
                  Approve status advancement
                </label>
                <TextArea label="Advancement note" value={selected.statusAdvance.advancementNote} onChange={(v) => patchAdvance("advancementNote", v)} />
                <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                  Save proof review
                </button>
              </section>

              <section style={subPanel}>
                <h3>Gate</h3>
                <ul style={listStyle}>
                  <li>Can advance status: {selected.controls.canAdvanceStatus ? "Yes" : "No"}</li>
                  <li>Requires proof: {selected.controls.requiresProof ? "Yes" : "No"}</li>
                  <li>Requires founder decision: {selected.controls.requiresFounderDecision ? "Yes" : "No"}</li>
                  <li>Auto mutates tracker: {selected.controls.autoMutatesTracker ? "Yes" : "No"}</li>
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

const messageBox = {
  color: "#f8f0db",
  lineHeight: 1.6,
  background: "rgba(215,173,73,.12)",
  border: "1px solid rgba(215,173,73,.28)",
  borderRadius: 16,
  padding: 14
};