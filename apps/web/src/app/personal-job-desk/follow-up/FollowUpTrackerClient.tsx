"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type SafePersonalProfile = {
  fullName?: string;
  targetRole?: string;
  location?: string;
  headline?: string;
  priority?: string;
  skills?: string[];
};

type SubmissionLedgerItem = {
  id: string;
  opportunityTitle: string;
  companyName: string;
  platform?: string;
  proofReference?: string;
  nextFollowUpDate?: string;
};

type FollowUpStatus =
  | "WAITING_RESPONSE"
  | "FOLLOW_UP_DUE"
  | "RECRUITER_REPLIED"
  | "INTERVIEW_INVITED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_PREP_READY"
  | "OFFER_RECEIVED"
  | "REJECTED"
  | "CLOSED_NO_RESPONSE";

type FollowUpRecord = {
  id: string;
  submissionId: string;
  opportunityTitle: string;
  companyName: string;
  platform?: string;
  status: FollowUpStatus;
  followUpDate: string;
  interviewDate?: string;
  recruiterResponse?: string;
  proofReference?: string;
  interviewPrepNotes: string;
  nextAction: string;
  riskFlag: string;
  updatedAt: string;
};

const INPUT_KEY = "kingsmen.personalJobs05.submissions.v1";
const OUTPUT_KEY = "kingsmen.personalJobs06.followUps.v1";

const statusOptions: FollowUpStatus[] = [
  "WAITING_RESPONSE",
  "FOLLOW_UP_DUE",
  "RECRUITER_REPLIED",
  "INTERVIEW_INVITED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_PREP_READY",
  "OFFER_RECEIVED",
  "REJECTED",
  "CLOSED_NO_RESPONSE"
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function parseList(raw: string | null): unknown[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.records)) return parsed.records;
    if (Array.isArray(parsed?.submissions)) return parsed.submissions;
    if (Array.isArray(parsed?.ledger)) return parsed.ledger;
    if (Array.isArray(parsed?.items)) return parsed.items;
    return [];
  } catch {
    return [];
  }
}

function normalizeSubmission(item: unknown, index: number): SubmissionLedgerItem {
  const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    id: safeText(record.id, `submission-${index + 1}`),
    opportunityTitle: safeText(record.opportunityTitle || record.title || record.role || record.jobTitle, `Opportunity ${index + 1}`),
    companyName: safeText(record.companyName || record.company || record.employer, "Unknown company"),
    platform: safeText(record.platform || record.source || record.portal, "Manual source"),
    proofReference: safeText(record.proofReference || record.proof || record.confirmation, ""),
    nextFollowUpDate: safeText(record.nextFollowUpDate || record.followUpDate, "")
  };
}

function createPrep(profile: SafePersonalProfile, submission: SubmissionLedgerItem): string {
  const skills = Array.isArray(profile.skills) && profile.skills.length > 0
    ? profile.skills.slice(0, 6).join(", ")
    : "communication, reliability, willingness to learn, computer literacy";

  return [
    `Interview angle for ${submission.companyName}:`,
    `- Role target: ${submission.opportunityTitle}`,
    `- Candidate positioning: ${profile.targetRole || "job seeker"} in ${profile.location || "South Africa"}`,
    `- Strengths to prepare: ${skills}`,
    "- Prepare a truthful 60-second introduction.",
    "- Prepare one example of solving a problem, helping a customer, learning quickly, or handling pressure.",
    "- Prepare salary, availability, transport, shift, and document readiness answers.",
    "- Do not invent experience, qualifications, references, certificates, or skills."
  ].join("\n");
}

function createRecord(profile: SafePersonalProfile, submission: SubmissionLedgerItem, index: number): FollowUpRecord {
  const proof = submission.proofReference || "";

  return {
    id: `follow-up-${submission.id || index + 1}`,
    submissionId: submission.id,
    opportunityTitle: submission.opportunityTitle,
    companyName: submission.companyName,
    platform: submission.platform,
    status: proof ? "WAITING_RESPONSE" : "FOLLOW_UP_DUE",
    followUpDate: submission.nextFollowUpDate || addDaysIso(3),
    interviewDate: "",
    recruiterResponse: "",
    proofReference: proof,
    interviewPrepNotes: createPrep(profile, submission),
    nextAction: proof
      ? "Wait for response, then follow up politely if no reply by the follow-up date."
      : "Capture truthful proof first, then start follow-up tracking.",
    riskFlag: proof ? "NORMAL" : "MISSING_PROOF_REFERENCE",
    updatedAt: new Date().toISOString()
  };
}

function daysUntil(dateText: string): number | null {
  if (!dateText) return null;
  const target = new Date(dateText).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - new Date(todayIso()).getTime()) / 86400000);
}

function urgency(record: FollowUpRecord): string {
  const delta = daysUntil(record.followUpDate);
  if (record.status === "OFFER_RECEIVED") return "Victory lane";
  if (["INTERVIEW_INVITED", "INTERVIEW_SCHEDULED", "INTERVIEW_PREP_READY"].includes(record.status)) return "Interview priority";
  if (delta === null) return "Needs date";
  if (delta < 0) return "Overdue";
  if (delta === 0) return "Due today";
  if (delta <= 2) return "Due soon";
  return "On watch";
}

function exportJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function FollowUpTrackerClient({ initialProfile }: { initialProfile: SafePersonalProfile }) {
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const submissions = parseList(localStorage.getItem(INPUT_KEY)).map(normalizeSubmission);
    const saved = parseList(localStorage.getItem(OUTPUT_KEY)) as FollowUpRecord[];

    if (saved.length > 0) {
      setRecords(saved);
      setActiveId(saved[0]?.id || "");
      return;
    }

    const seeded = submissions.map((submission, index) => createRecord(initialProfile, submission, index));
    setRecords(seeded);
    setActiveId(seeded[0]?.id || "");
    localStorage.setItem(OUTPUT_KEY, JSON.stringify(seeded, null, 2));
  }, [initialProfile]);

  useEffect(() => {
    localStorage.setItem(OUTPUT_KEY, JSON.stringify(records, null, 2));
  }, [records]);

  const activeRecord = records.find((record) => record.id === activeId) || records[0];

  const stats = useMemo(() => ({
    total: records.length,
    overdue: records.filter((record) => urgency(record) === "Overdue").length,
    interview: records.filter((record) => ["INTERVIEW_INVITED", "INTERVIEW_SCHEDULED", "INTERVIEW_PREP_READY"].includes(record.status)).length,
    offers: records.filter((record) => record.status === "OFFER_RECEIVED").length
  }), [records]);

  function patchRecord(id: string, patch: Partial<FollowUpRecord>): void {
    setRecords((current) => current.map((record) =>
      record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record
    ));
  }

  function scheduleFollowUp(id: string, days: number): void {
    patchRecord(id, {
      followUpDate: addDaysIso(days),
      status: days <= 0 ? "FOLLOW_UP_DUE" : "WAITING_RESPONSE",
      nextAction: days <= 0
        ? "Follow up today using the saved manual proof and truthful application context."
        : `Follow up in ${days} day(s) if no recruiter response arrives.`
    });
  }

  function exportFollowUpLedger(): void {
    exportJson("personal-jobs-06-follow-up-ledger.local.json", {
      schema: "kingsmen.personal-jobs-06-follow-up-ledger.v1",
      generatedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      readsLocalStorageKey: INPUT_KEY,
      writesLocalStorageKey: OUTPUT_KEY,
      records
    });
  }

  return (
    <section data-kingsmen-personal-jobs-06-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
        {[
          ["Tracked routes", String(stats.total)],
          ["Overdue follow-ups", String(stats.overdue)],
          ["Interview lane", String(stats.interview)],
          ["Offers captured", String(stats.offers)]
        ].map(([label, value]) => (
          <article key={label} style={cardStyle}>
            <p style={{ margin: 0, color: "rgba(248,237,210,0.62)", fontSize: "12px" }}>{label}</p>
            <strong style={{ display: "block", marginTop: "8px", fontSize: "34px", color: "#f8d77a" }}>{value}</strong>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.92fr) minmax(320px, 1.5fr)", gap: "18px" }}>
        <aside style={panelStyle}>
          <h2 style={{ margin: "0 0 12px", color: "#f8d77a" }}>Response watchlist</h2>

          <div style={{ display: "grid", gap: "10px" }}>
            {records.length === 0 ? (
              <p style={{ color: "rgba(248,237,210,0.68)", lineHeight: 1.6 }}>
                No submissions found yet. Complete PERSONAL-JOBS-05 first, then return here.
              </p>
            ) : (
              records.map((record) => (
                <button key={record.id} type="button" onClick={() => setActiveId(record.id)} style={watchButtonStyle(record.id === activeRecord?.id)}>
                  <strong style={{ display: "block" }}>{record.opportunityTitle}</strong>
                  <span style={{ display: "block", marginTop: "5px", color: "rgba(248,237,210,0.68)" }}>
                    {record.companyName} · {urgency(record)}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <article style={panelStyle}>
          {activeRecord ? (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900 }}>
                  {activeRecord.companyName} · {activeRecord.platform || "Manual source"}
                </p>
                <h2 style={{ margin: "8px 0 6px", fontSize: "30px" }}>{activeRecord.opportunityTitle}</h2>
                <p style={{ margin: 0, color: "rgba(248,237,210,0.72)" }}>
                  Status: {activeRecord.status.replaceAll("_", " ")} · Urgency: {urgency(activeRecord)}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Follow-up date</span>
                  <input type="date" value={activeRecord.followUpDate} onChange={(event) => patchRecord(activeRecord.id, { followUpDate: event.target.value, status: "WAITING_RESPONSE" })} style={inputStyle} />
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>Interview date</span>
                  <input type="date" value={activeRecord.interviewDate || ""} onChange={(event) => patchRecord(activeRecord.id, { interviewDate: event.target.value, status: event.target.value ? "INTERVIEW_SCHEDULED" : activeRecord.status })} style={inputStyle} />
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>Response status</span>
                  <select value={activeRecord.status} onChange={(event) => patchRecord(activeRecord.id, { status: event.target.value as FollowUpStatus })} style={inputStyle}>
                    {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </label>
              </div>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Recruiter / employer response</span>
                <textarea value={activeRecord.recruiterResponse || ""} onChange={(event) => patchRecord(activeRecord.id, { recruiterResponse: event.target.value, status: event.target.value.trim() ? "RECRUITER_REPLIED" : activeRecord.status })} rows={4} placeholder="Paste the truthful response summary here. Do not invent replies." style={textareaStyle} />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Interview preparation notes</span>
                <textarea value={activeRecord.interviewPrepNotes} onChange={(event) => patchRecord(activeRecord.id, { interviewPrepNotes: event.target.value })} rows={8} style={{ ...textareaStyle, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }} />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Next action</span>
                <textarea value={activeRecord.nextAction} onChange={(event) => patchRecord(activeRecord.id, { nextAction: event.target.value })} rows={3} style={textareaStyle} />
              </label>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => scheduleFollowUp(activeRecord.id, 0)} style={buttonStyle}>Due today</button>
                <button type="button" onClick={() => scheduleFollowUp(activeRecord.id, 3)} style={buttonStyle}>Follow up in 3 days</button>
                <button type="button" onClick={() => scheduleFollowUp(activeRecord.id, 7)} style={buttonStyle}>Follow up in 7 days</button>
                <button type="button" onClick={() => patchRecord(activeRecord.id, { status: "INTERVIEW_PREP_READY", nextAction: "Practise introduction, role fit, examples, availability, salary, and questions for the employer." })} style={buttonStyle}>Mark interview prep ready</button>
                <button type="button" onClick={exportFollowUpLedger} style={buttonStyle}>Export follow-up ledger</button>
              </div>

              <p style={{ margin: 0, color: "rgba(248,237,210,0.62)", lineHeight: 1.6 }}>
                Local boundary: this desk stores follow-up records in browser storage only. It does not contact
                recruiters, send messages, submit applications, touch payments, or sync to any external calendar.
              </p>
            </div>
          ) : (
            <p style={{ color: "rgba(248,237,210,0.7)" }}>No active follow-up record selected.</p>
          )}
        </article>
      </div>
    </section>
  );
}

const cardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.2)",
  borderRadius: "22px",
  padding: "18px",
  background: "rgba(255,255,255,0.04)"
};

const panelStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.2)",
  borderRadius: "28px",
  padding: "18px",
  background: "rgba(0,0,0,0.22)"
};

const labelStyle: CSSProperties = { display: "grid", gap: "7px" };
const labelTextStyle: CSSProperties = { color: "#d6b25e", fontWeight: 800 };

const inputStyle: CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(214,178,94,0.28)",
  padding: "12px",
  background: "rgba(0,0,0,0.28)",
  color: "#f8edd2"
};

const textareaStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px solid rgba(214,178,94,0.24)",
  padding: "13px",
  background: "rgba(0,0,0,0.24)",
  color: "#f8edd2",
  lineHeight: 1.55
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.38)",
  borderRadius: "999px",
  padding: "11px 15px",
  background: "rgba(214,178,94,0.12)",
  color: "#f8d77a",
  fontWeight: 900,
  cursor: "pointer"
};

function watchButtonStyle(active: boolean): CSSProperties {
  return {
    textAlign: "left",
    border: active ? "1px solid rgba(214,178,94,0.78)" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: "18px",
    padding: "13px",
    background: active ? "rgba(214,178,94,0.13)" : "rgba(255,255,255,0.035)",
    color: "#f8edd2",
    cursor: "pointer"
  };
}