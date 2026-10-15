"use client";

import { useEffect, useMemo, useState } from "react";

type LedgerRecord = {
  ledgerId: string;
  packId: string;
  actionState: string;
  pack: {
    title: string;
    company: string;
    location: string;
    sourceUrl: string;
    applyUrl: string;
    fitScore: number;
    pj20bQualityScore: number;
    matchedTerms: string[];
    cvFocus: string[];
    motivationDraft: string;
    manualApplySteps: string[];
    proofToCapture: string[];
    reviewWarnings: string[];
  };
  review: {
    reviewStatus: string;
    candidateApproved: boolean;
    founderReviewed: boolean;
    applicationMethod: string;
    submittedAt: string;
    proofType: string;
    proofReference: string;
    proofNotes: string;
    outcomeStatus: string;
    outcomeNotes: string;
    followUpDate: string;
    interviewAt: string;
    nextAction: string;
    responseHistory: string;
    reviewerNotes: string;
  };
};

type LedgerOutput = {
  status?: string;
  generatedAt?: string;
  reviewRecordCount?: number;
  summary?: any;
  records?: LedgerRecord[];
};

const reviewStatuses = [
  "PENDING_REVIEW",
  "NEEDS_PROFILE_FIX",
  "APPROVED_TO_APPLY_MANUALLY",
  "SUBMITTED_PROOF_CAPTURED",
  "REJECTED_NOT_APPLYING",
  "OUTCOME_INTERVIEW",
  "OUTCOME_REJECTED",
  "OUTCOME_OFFER",
  "NO_RESPONSE_FOLLOWUP"
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

export default function ReviewLedgerClient() {
  const [ledger, setLedger] = useState<LedgerOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const records = useMemo(() => ledger?.records ?? [], [ledger]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (filter === "ALL") return records;
    if (filter === "OVERDUE_FOLLOW_UPS") return records.filter((r) => r.review.followUpDate && r.review.followUpDate < today && !["INTERVIEW", "REJECTED", "OFFER", "WITHDRAWN"].includes(r.review.outcomeStatus));
    if (filter === "UPCOMING_INTERVIEWS") return records.filter((r) => r.review.interviewAt && !Number.isNaN(Date.parse(r.review.interviewAt)) && Date.parse(r.review.interviewAt) >= Date.now());
    return records.filter((record) => record.actionState === filter || record.review.reviewStatus === filter);
  }, [records, filter]);

  const selected = useMemo(() => {
    return records.find((record) => record.ledgerId === selectedId) ?? filtered[0] ?? null;
  }, [records, filtered, selectedId]);

  useEffect(() => {
    loadLedger();
  }, []);

  async function loadLedger() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/review-ledger", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ22 load failed.");
      setLedger(json);
      setSelectedId(json.records?.[0]?.ledgerId ?? "");
      setMessage(`PJ22 loaded ${json.reviewRecordCount} review records.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ22 load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSelected(record: LedgerRecord) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/review-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ledgerId: record.ledgerId, review: record.review })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ22 save failed.");

      setLedger(json.ledger);
      setSelectedId(json.record.ledgerId);
      setMessage("Saved review/proof/outcome record.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ22 save failed.");
    } finally {
      setLoading(false);
    }
  }

  function patchSelected(key: keyof LedgerRecord["review"], value: string | boolean) {
    if (!selected || !ledger?.records) return;

    const updatedRecords = ledger.records.map((record) => {
      if (record.ledgerId !== selected.ledgerId) return record;
      return {
        ...record,
        review: {
          ...record.review,
          [key]: value
        }
      };
    });

    setLedger({ ...ledger, records: updatedRecords });
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard.");
  }

  return (
    <main style={main}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-22</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Human Review Selector / Proof Capture / Outcome Ledger</h1>
        <p style={muted}>
          Review PJ21 application packs, record approval, capture submission proof, and track outcomes.
          PJ22 does not send applications or contact employers automatically.
        </p>
        <button onClick={loadLedger} disabled={loading} style={button}>
          {loading ? "Working..." : "Refresh ledger"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Total records" value={ledger?.summary?.totalRecords ?? 0} />
        <Stat label="Waiting review" value={ledger?.summary?.waitingHumanReview ?? 0} />
        <Stat label="Ready manual" value={ledger?.summary?.readyForManualSubmission ?? 0} />
        <Stat label="Proof captured" value={ledger?.summary?.proofCaptured ?? 0} />
        <Stat label="Outcomes" value={ledger?.summary?.outcomesRecorded ?? 0} />
        <Stat label="Overdue follow-ups" value={ledger?.summary?.followUpsOverdue ?? 0} />
        <Stat label="Follow-ups due today" value={ledger?.summary?.followUpsDueToday ?? 0} />
        <Stat label="Upcoming interviews" value={ledger?.summary?.interviewsScheduled ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Review queue</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            <option value="ALL">All records</option>
            <option value="WAITING_HUMAN_REVIEW">Waiting human review</option>
            <option value="READY_FOR_MANUAL_SUBMISSION">Ready manual submission</option>
            <option value="PROOF_CAPTURED">Proof captured</option>
            <option value="OUTCOME_RECORDED">Outcome recorded</option>
            <option value="OVERDUE_FOLLOW_UPS">Overdue follow-ups</option>
            <option value="UPCOMING_INTERVIEWS">Upcoming interviews</option>
            <option value="BLOCKED_PROFILE_FIX">Blocked profile fix</option>
            {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((record) => (
              <button
                key={record.ledgerId}
                onClick={() => setSelectedId(record.ledgerId)}
                style={{
                  ...queueCard,
                  outline: selected?.ledgerId === record.ledgerId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{record.pack.title || "Untitled role"}</strong>
                <span>{record.pack.company || "Unknown company"} - {record.pack.location || "Unknown location"}</span>
                <small>{record.actionState}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No review record selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.actionState}</p>
              <h2>{selected.pack.title || "Untitled role"}</h2>
              <p style={muted}>{selected.pack.company || "Unknown company"} - {selected.pack.location || "Unknown location"}</p>
              <p style={muted}>Fit score: {selected.pack.fitScore}/100 | PJ20B quality: {selected.pack.pj20bQualityScore}/100</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {selected.pack.sourceUrl ? <a href={selected.pack.sourceUrl} target="_blank" rel="noreferrer" style={linkButton}>Open source</a> : null}
                <button style={smallButton} onClick={() => copyText(selected.pack.motivationDraft)}>Copy motivation</button>
              </div>

              <section style={subPanel}>
                <h3>Review controls</h3>
                <div style={formGrid}>
                  <Select label="Review status" value={selected.review.reviewStatus} options={reviewStatuses} onChange={(v) => patchSelected("reviewStatus", v)} />
                  <Select label="Outcome status" value={selected.review.outcomeStatus} options={outcomeStatuses} onChange={(v) => patchSelected("outcomeStatus", v)} />
                  <Input label="Application method" value={selected.review.applicationMethod} onChange={(v) => patchSelected("applicationMethod", v)} placeholder="official portal / email / walk-in / other" />
                  <Input label="Submitted at" value={selected.review.submittedAt} onChange={(v) => patchSelected("submittedAt", v)} placeholder="YYYY-MM-DD HH:mm or note" />
                  <Input label="Proof type" value={selected.review.proofType} onChange={(v) => patchSelected("proofType", v)} placeholder="screenshot / email / reference number" />
                  <Input label="Proof reference" value={selected.review.proofReference} onChange={(v) => patchSelected("proofReference", v)} />
                  <Input label="Follow-up date" value={selected.review.followUpDate} onChange={(v) => patchSelected("followUpDate", v)} placeholder="YYYY-MM-DD" />
                  <Input label="Interview date/time" value={selected.review.interviewAt} onChange={(v) => patchSelected("interviewAt", v)} placeholder="ISO timestamp or YYYY-MM-DDTHH:mm" />
                  <Input label="Next action" value={selected.review.nextAction} onChange={(v) => patchSelected("nextAction", v)} placeholder="e.g. Call recruiter after deadline" />
                </div>

                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.review.candidateApproved} onChange={(e) => patchSelected("candidateApproved", e.target.checked)} />
                  Candidate approved this exact pack
                </label>

                <label style={checkLabel}>
                  <input type="checkbox" checked={selected.review.founderReviewed} onChange={(e) => patchSelected("founderReviewed", e.target.checked)} />
                  Founder/operator reviewed
                </label>

                <TextArea label="Proof notes" value={selected.review.proofNotes} onChange={(v) => patchSelected("proofNotes", v)} />
                <TextArea label="Outcome notes" value={selected.review.outcomeNotes} onChange={(v) => patchSelected("outcomeNotes", v)} />
                <TextArea label="Response history (append dated entries)" value={selected.review.responseHistory} onChange={(v) => patchSelected("responseHistory", v)} />
                <p style={muted}>Keep a dated note for each employer response or attempted follow-up. This is a manually maintained log, not a live employer inbox.</p>
                <TextArea label="Reviewer notes" value={selected.review.reviewerNotes} onChange={(v) => patchSelected("reviewerNotes", v)} />

                <button style={button} disabled={loading} onClick={() => saveSelected(selected)}>
                  Save ledger record
                </button>
              </section>

              <section style={subPanel}>
                <h3>CV focus</h3>
                <ul style={listStyle}>{selected.pack.cvFocus.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>

              <section style={subPanel}>
                <h3>Motivation draft</h3>
                <pre style={pre}>{selected.pack.motivationDraft}</pre>
              </section>

              <section style={subPanel}>
                <h3>Manual apply steps</h3>
                <ol style={listStyle}>{selected.pack.manualApplySteps.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>

              <section style={subPanel}>
                <h3>Proof to capture</h3>
                <ul style={listStyle}>{selected.pack.proofToCapture.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>

              <section style={subPanel}>
                <h3>Safety boundary</h3>
                <p style={muted}>
                  PJ22 records approval, proof, and outcomes only. It does not submit applications, send email,
                  send WhatsApp, contact employers, touch payments, bypass login, bypass OTP, or bypass CAPTCHA.
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
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
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
  color: "#d8caa8",
  marginTop: 14
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