"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type SafePersonalProfile = {
  fullName?: string;
  targetRole?: string;
  location?: string;
  headline?: string;
  priority?: string;
};

type AnyRecord = Record<string, unknown>;

type CampaignData = {
  leads: AnyRecord[];
  shortlist: AnyRecord[];
  applyPacks: AnyRecord[];
  submissions: AnyRecord[];
  followUps: AnyRecord[];
};

type OutcomeStatus =
  | "STILL_SEARCHING"
  | "WAITING_RESPONSE"
  | "INTERVIEW_ACTIVE"
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "OFFER_DECLINED"
  | "UNSUCCESSFUL"
  | "CLOSED_NO_RESPONSE"
  | "HIRED";

type OfferDecision =
  | "NO_OFFER_YET"
  | "TAKE_NOW"
  | "NEGOTIATE"
  | "WAIT_FOR_BETTER"
  | "DECLINE_RISK"
  | "NEEDS_INFORMATION";

type OutcomeRecord = {
  id: string;
  sourceId: string;
  opportunityTitle: string;
  companyName: string;
  status: OutcomeStatus;
  offerDecision: OfferDecision;
  salaryText: string;
  startDate: string;
  proofReference: string;
  riskNotes: string;
  finalDecision: string;
  nextAction: string;
  updatedAt: string;
};

const KEYS = {
  leads: "kingsmen.personalJobs02.externalLeads.v1",
  shortlist: "kingsmen.personalJobs03.shortlist.v1",
  applyPacks: "kingsmen.personalJobs04.applyPacks.v1",
  submissions: "kingsmen.personalJobs05.submissions.v1",
  followUps: "kingsmen.personalJobs06.followUps.v1",
  outcomes: "kingsmen.personalJobs07.outcomeLedger.v1"
} as const;

const outcomeStatuses: OutcomeStatus[] = [
  "STILL_SEARCHING",
  "WAITING_RESPONSE",
  "INTERVIEW_ACTIVE",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "OFFER_DECLINED",
  "UNSUCCESSFUL",
  "CLOSED_NO_RESPONSE",
  "HIRED"
];

const offerDecisions: OfferDecision[] = [
  "NO_OFFER_YET",
  "TAKE_NOW",
  "NEGOTIATE",
  "WAIT_FOR_BETTER",
  "DECLINE_RISK",
  "NEEDS_INFORMATION"
];

function parseList(raw: string | null): AnyRecord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === "object") as AnyRecord[];
    if (Array.isArray(parsed?.leads)) return parsed.leads;
    if (Array.isArray(parsed?.rows)) return parsed.rows;
    if (Array.isArray(parsed?.packs)) return parsed.packs;
    if (Array.isArray(parsed?.records)) return parsed.records;
    if (Array.isArray(parsed?.submissions)) return parsed.submissions;
    if (Array.isArray(parsed?.ledger)) return parsed.ledger;
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed?.outcomes)) return parsed.outcomes;

    return [];
  } catch {
    return [];
  }
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function readString(record: AnyRecord, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();

    if (value && typeof value === "object") {
      const nested = value as AnyRecord;
      for (const nestedKey of keys) {
        const nestedValue = nested[nestedKey];
        if (typeof nestedValue === "string" && nestedValue.trim()) return nestedValue.trim();
      }
    }
  }

  return fallback;
}

function readNumber(record: AnyRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }

  return fallback;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateText: string): number | null {
  if (!dateText) return null;
  const target = new Date(dateText).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - new Date(todayIso()).getTime()) / 86400000);
}

function inferOutcomeStatus(record: AnyRecord): OutcomeStatus {
  const raw = `${readString(record, ["status", "outcome", "state"], "")} ${readString(record, ["recruiterResponse", "proofNote", "notes"], "")}`.toUpperCase();

  if (raw.includes("OFFER_ACCEPTED") || raw.includes("HIRED")) return "HIRED";
  if (raw.includes("OFFER_RECEIVED") || raw.includes("OFFER")) return "OFFER_RECEIVED";
  if (raw.includes("INTERVIEW")) return "INTERVIEW_ACTIVE";
  if (raw.includes("REJECT") || raw.includes("UNSUCCESSFUL")) return "UNSUCCESSFUL";
  if (raw.includes("CLOSED_NO_RESPONSE") || raw.includes("CLOSED")) return "CLOSED_NO_RESPONSE";
  if (raw.includes("WAITING") || raw.includes("FOLLOW_UP")) return "WAITING_RESPONSE";

  return "STILL_SEARCHING";
}

function buildOutcomeFromFollowUp(record: AnyRecord, index: number): OutcomeRecord {
  const title = readString(record, ["opportunityTitle", "title", "role", "jobTitle"], `Opportunity ${index + 1}`);
  const company = readString(record, ["companyName", "company", "employer"], "Unknown company");
  const status = inferOutcomeStatus(record);
  const proof = readString(record, ["proofReference", "proof", "confirmation"], "");

  return {
    id: `outcome-${readString(record, ["id"], String(index + 1))}`,
    sourceId: readString(record, ["id", "submissionId"], `source-${index + 1}`),
    opportunityTitle: title,
    companyName: company,
    status,
    offerDecision: status === "OFFER_RECEIVED" ? "NEEDS_INFORMATION" : "NO_OFFER_YET",
    salaryText: "",
    startDate: "",
    proofReference: proof,
    riskNotes: proof ? "Normal proof review." : "Missing proof reference.",
    finalDecision: "",
    nextAction:
      status === "OFFER_RECEIVED"
        ? "Capture offer details, verify employer legitimacy, compare salary, transport, start date, contract, and risk before accepting."
        : status === "INTERVIEW_ACTIVE"
          ? "Prepare interview answers and confirm attendance details manually."
          : "Keep applying, follow up safely, and update the ledger when responses arrive.",
    updatedAt: new Date().toISOString()
  };
}

function buildOfferDecision(record: OutcomeRecord): string {
  if (record.status !== "OFFER_RECEIVED" && record.status !== "OFFER_ACCEPTED" && record.status !== "HIRED") {
    return "No offer decision required yet.";
  }

  if (record.offerDecision === "TAKE_NOW") {
    return "Take now if the offer is legitimate, written, affordable to reach, and better than continued unemployment risk.";
  }

  if (record.offerDecision === "NEGOTIATE") {
    return "Negotiate only on realistic points: start date, shift, transport, salary clarity, documents, or probation terms.";
  }

  if (record.offerDecision === "WAIT_FOR_BETTER") {
    return "Wait only if there are stronger active interviews or the offer has weak conditions.";
  }

  if (record.offerDecision === "DECLINE_RISK") {
    return "Decline if there are fees, suspicious requests, unsafe location, unclear employer identity, or unverifiable terms.";
  }

  return "Capture missing information first: written offer, salary, start date, location, hours, contract type, and proof.";
}

function computeTodayCommands(data: CampaignData, outcomes: OutcomeRecord[]): string[] {
  const commands: string[] = [];

  const overdue = data.followUps.filter((record) => {
    const date = readString(record, ["followUpDate", "nextFollowUpDate"], "");
    const delta = daysUntil(date);
    return delta !== null && delta < 0;
  });

  const dueToday = data.followUps.filter((record) => {
    const date = readString(record, ["followUpDate", "nextFollowUpDate"], "");
    const delta = daysUntil(date);
    return delta === 0;
  });

  const interviews = data.followUps.filter((record) => inferOutcomeStatus(record) === "INTERVIEW_ACTIVE");
  const offers = outcomes.filter((record) => record.status === "OFFER_RECEIVED");
  const weakProof = data.submissions.filter((record) => !readString(record, ["proofReference", "proof", "confirmation"], ""));

  if (offers.length > 0) commands.push(`Decide on ${offers.length} offer(s): verify written terms, risk, salary, transport, and start date.`);
  if (interviews.length > 0) commands.push(`Prepare for ${interviews.length} interview-stage route(s): practise truthful examples and confirm attendance details.`);
  if (overdue.length > 0) commands.push(`Clear ${overdue.length} overdue follow-up(s) today using the saved proof and manual route notes.`);
  if (dueToday.length > 0) commands.push(`Handle ${dueToday.length} follow-up(s) due today.`);
  if (weakProof.length > 0) commands.push(`Repair ${weakProof.length} submission proof gap(s) before trusting the campaign dashboard.`);
  if (data.applyPacks.length < 5) commands.push("Build more apply packs from the shortlist so the campaign does not depend on too few routes.");
  if (data.leads.length < 10) commands.push("Add more external job leads. A small lead pool weakens speed and choice.");
  if (commands.length === 0) commands.push("Keep campaign movement alive: add leads, prepare packs, submit manually, and track proof.");

  return commands;
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

function saveOutcomes(records: OutcomeRecord[]): void {
  localStorage.setItem(
    KEYS.outcomes,
    JSON.stringify(
      {
        schema: "kingsmen.personal-jobs-07-outcome-ledger.v1",
        generatedAt: new Date().toISOString(),
        localOnly: true,
        noSendBoundary: true,
        outcomes: records
      },
      null,
      2
    )
  );
}

export default function OutcomeCommandDashboardClient({
  initialProfile
}: {
  initialProfile: SafePersonalProfile;
}) {
  const [data, setData] = useState<CampaignData>({
    leads: [],
    shortlist: [],
    applyPacks: [],
    submissions: [],
    followUps: []
  });

  const [outcomes, setOutcomes] = useState<OutcomeRecord[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const loaded: CampaignData = {
      leads: parseList(localStorage.getItem(KEYS.leads)),
      shortlist: parseList(localStorage.getItem(KEYS.shortlist)),
      applyPacks: parseList(localStorage.getItem(KEYS.applyPacks)),
      submissions: parseList(localStorage.getItem(KEYS.submissions)),
      followUps: parseList(localStorage.getItem(KEYS.followUps))
    };

    const savedOutcomes = parseList(localStorage.getItem(KEYS.outcomes)) as OutcomeRecord[];

    const seeded =
      savedOutcomes.length > 0
        ? savedOutcomes
        : loaded.followUps.map((record, index) => buildOutcomeFromFollowUp(record, index));

    setData(loaded);
    setOutcomes(seeded);
    setActiveId(seeded[0]?.id || "");

    if (savedOutcomes.length === 0 && seeded.length > 0) {
      saveOutcomes(seeded);
    }
  }, []);

  useEffect(() => {
    saveOutcomes(outcomes);
  }, [outcomes]);

  const activeOutcome = outcomes.find((record) => record.id === activeId) || outcomes[0];

  const summary = useMemo(() => {
    return {
      leads: data.leads.length,
      shortlist: data.shortlist.length,
      applyPacks: data.applyPacks.length,
      submissions: data.submissions.length,
      followUps: data.followUps.length,
      interviews: outcomes.filter((record) => record.status === "INTERVIEW_ACTIVE").length,
      offers: outcomes.filter((record) => record.status === "OFFER_RECEIVED").length,
      hired: outcomes.filter((record) => record.status === "HIRED" || record.status === "OFFER_ACCEPTED").length,
      rejected: outcomes.filter((record) => record.status === "UNSUCCESSFUL" || record.status === "REJECTED").length
    };
  }, [data, outcomes]);

  const todayCommands = useMemo(() => computeTodayCommands(data, outcomes), [data, outcomes]);

  function patchOutcome(id: string, patch: Partial<OutcomeRecord>): void {
    setOutcomes((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              ...patch,
              finalDecision:
                patch.offerDecision || patch.status
                  ? buildOfferDecision({ ...record, ...patch })
                  : record.finalDecision,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
  }

  function seedOutcomesFromFollowUps(): void {
    const seeded = data.followUps.map((record, index) => buildOutcomeFromFollowUp(record, index));
    setOutcomes(seeded);
    setActiveId(seeded[0]?.id || "");
  }

  function exportOutcomeLedger(): void {
    exportJson("personal-jobs-07-outcome-ledger.local.json", {
      schema: "kingsmen.personal-jobs-07-outcome-ledger-export.v1",
      generatedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      reads: KEYS,
      outcomes,
      todayCommands
    });
  }

  return (
    <section data-kingsmen-personal-jobs-07-command-dashboard="true" data-kingsmen-personal-jobs-07-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "13px" }}>
        {[
          ["Leads", summary.leads],
          ["Shortlist", summary.shortlist],
          ["Apply packs", summary.applyPacks],
          ["Submissions", summary.submissions],
          ["Follow-ups", summary.followUps],
          ["Interviews", summary.interviews],
          ["Offers", summary.offers],
          ["Hired", summary.hired],
          ["Rejected", summary.rejected]
        ].map(([label, value]) => (
          <article key={label} style={cardStyle}>
            <p style={{ margin: 0, color: "rgba(248,237,210,0.62)", fontSize: "12px", textTransform: "uppercase" }}>{label}</p>
            <strong style={{ display: "block", marginTop: "8px", fontSize: "30px", color: "#f8d77a" }}>{value}</strong>
          </article>
        ))}
      </div>

      <section style={panelStyle}>
        <p style={{ margin: 0, color: "#d6b25e", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, fontSize: "12px" }}>
          Today’s command
        </p>
        <h2 style={{ margin: "8px 0 10px", fontSize: "28px" }}>
          {initialProfile.fullName || "Local candidate"} · {initialProfile.targetRole || "Job seeker"}
        </h2>
        <p style={{ margin: "0 0 14px", color: "rgba(248,237,210,0.72)", lineHeight: 1.6 }}>
          {initialProfile.headline || "Keep the job campaign moving through proof, follow-up, interviews and outcomes."}
        </p>

        <ol style={{ margin: 0, paddingLeft: "22px", color: "rgba(248,237,210,0.82)", lineHeight: 1.7 }}>
          {todayCommands.map((command) => (
            <li key={command}>{command}</li>
          ))}
        </ol>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.95fr) minmax(320px, 1.45fr)", gap: "18px" }}>
        <aside style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, color: "#f8d77a" }}>Outcome ledger</h2>
            <button type="button" onClick={seedOutcomesFromFollowUps} style={smallButtonStyle}>
              Re-seed
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {outcomes.length === 0 ? (
              <p style={{ color: "rgba(248,237,210,0.68)", lineHeight: 1.6 }}>
                No follow-up records found yet. Complete PERSONAL-JOBS-06 follow-up tracking first.
              </p>
            ) : (
              outcomes.map((record) => (
                <button key={record.id} type="button" onClick={() => setActiveId(record.id)} style={watchButtonStyle(record.id === activeOutcome?.id)}>
                  <strong style={{ display: "block" }}>{record.opportunityTitle}</strong>
                  <span style={{ display: "block", marginTop: "5px", color: "rgba(248,237,210,0.68)" }}>
                    {record.companyName} · {record.status.replaceAll("_", " ")}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <article style={panelStyle}>
          {activeOutcome ? (
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900 }}>
                  {activeOutcome.companyName}
                </p>
                <h2 style={{ margin: "8px 0 6px", fontSize: "30px" }}>{activeOutcome.opportunityTitle}</h2>
                <p style={{ margin: 0, color: "rgba(248,237,210,0.72)" }}>
                  Outcome: {activeOutcome.status.replaceAll("_", " ")} · Decision: {activeOutcome.offerDecision.replaceAll("_", " ")}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Outcome status</span>
                  <select value={activeOutcome.status} onChange={(event) => patchOutcome(activeOutcome.id, { status: event.target.value as OutcomeStatus })} style={inputStyle}>
                    {outcomeStatuses.map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>Offer decision</span>
                  <select value={activeOutcome.offerDecision} onChange={(event) => patchOutcome(activeOutcome.id, { offerDecision: event.target.value as OfferDecision })} style={inputStyle}>
                    {offerDecisions.map((decision) => (
                      <option key={decision} value={decision}>{decision.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  <span style={labelTextStyle}>Start date</span>
                  <input type="date" value={activeOutcome.startDate} onChange={(event) => patchOutcome(activeOutcome.id, { startDate: event.target.value })} style={inputStyle} />
                </label>
              </div>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Salary / offer terms</span>
                <textarea value={activeOutcome.salaryText} onChange={(event) => patchOutcome(activeOutcome.id, { salaryText: event.target.value })} rows={3} placeholder="Capture salary, stipend, hours, transport, contract type, probation, benefits or missing terms." style={textareaStyle} />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Proof reference</span>
                <input value={activeOutcome.proofReference} onChange={(event) => patchOutcome(activeOutcome.id, { proofReference: event.target.value })} placeholder="Offer letter file, email subject, screenshot name, reference number, interview invite proof." style={inputStyle} />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Risk notes</span>
                <textarea value={activeOutcome.riskNotes} onChange={(event) => patchOutcome(activeOutcome.id, { riskNotes: event.target.value })} rows={3} placeholder="Fees, unclear employer, unsafe route, transport risk, contract uncertainty, suspicious request, missing written proof." style={textareaStyle} />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Final decision reasoning</span>
                <textarea value={activeOutcome.finalDecision || buildOfferDecision(activeOutcome)} onChange={(event) => patchOutcome(activeOutcome.id, { finalDecision: event.target.value })} rows={4} style={textareaStyle} />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Next action</span>
                <textarea value={activeOutcome.nextAction} onChange={(event) => patchOutcome(activeOutcome.id, { nextAction: event.target.value })} rows={3} style={textareaStyle} />
              </label>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => patchOutcome(activeOutcome.id, { status: "OFFER_RECEIVED", offerDecision: "NEEDS_INFORMATION" })} style={buttonStyle}>Mark offer received</button>
                <button type="button" onClick={() => patchOutcome(activeOutcome.id, { status: "OFFER_ACCEPTED", offerDecision: "TAKE_NOW" })} style={buttonStyle}>Mark accepted</button>
                <button type="button" onClick={() => patchOutcome(activeOutcome.id, { status: "UNSUCCESSFUL" })} style={buttonStyle}>Mark unsuccessful</button>
                <button type="button" onClick={exportOutcomeLedger} style={buttonStyle}>Export outcome ledger</button>
              </div>

              <p style={{ margin: 0, color: "rgba(248,237,210,0.62)", lineHeight: 1.6 }}>
                Local boundary: this dashboard stores outcomes in browser storage only. It does not contact employers,
                send messages, submit applications, touch payments, or sync to external systems.
              </p>
            </div>
          ) : (
            <p style={{ color: "rgba(248,237,210,0.7)" }}>No active outcome selected.</p>
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

const smallButtonStyle: CSSProperties = {
  ...buttonStyle,
  padding: "8px 12px",
  fontSize: "12px"
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