"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type LeadStatus =
  | "Found"
  | "Reviewed"
  | "Prepared"
  | "Applied"
  | "Follow Up"
  | "Interview"
  | "Rejected"
  | "Offer"
  | "Closed";

type SourceType =
  | "Indeed"
  | "LinkedIn"
  | "Company Career Page"
  | "Facebook"
  | "WhatsApp Group"
  | "Email"
  | "Referral"
  | "Walk-in"
  | "Other";

type PJ02Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  company: string;
  roleTitle: string;
  opportunityLink: string;
  sourceType: SourceType;
  location: string;
  workMode: "On-site" | "Hybrid" | "Remote" | "Unknown";
  deadline: string;
  salaryText: string;
  requirementsText: string;
  fitReason: string;
  riskNotes: string;
  confidence: "Low" | "Medium" | "High";
  status: LeadStatus;
  nextAction: string;
  cvSlot: string;
  motivationLetterSlot: string;
  proofNote: string;
};

type NormalizerReport = {
  schema: string;
  generatedAt: string;
  localOnly: true;
  noSendBoundary: true;
  totalBefore: number;
  exactBefore: number;
  repairedCount: number;
  exactAfter: number;
  backupKey: string;
  targetKey: string;
  examples: Array<{
    beforeShape: string[];
    after: Pick<PJ02Lead, "company" | "roleTitle" | "opportunityLink" | "sourceType" | "confidence" | "status" | "cvSlot" | "motivationLetterSlot">;
  }>;
};

const PJ02_KEY = "kingsmen.personalJobs02.externalLeads.v1";
const BACKUP_KEY = "kingsmen.personalJobs13.normalizerBackups.v1";
const REPORT_KEY = "kingsmen.personalJobs13.normalizerReports.v1";
const PERSONAL_JOBS_13_SLOT_COUNT_PROOF = "15 slots: CV-01..CV-15 / ML-01..ML-15";

const STATUS_VALUES: LeadStatus[] = [
  "Found",
  "Reviewed",
  "Prepared",
  "Applied",
  "Follow Up",
  "Interview",
  "Rejected",
  "Offer",
  "Closed"
];

const SOURCE_VALUES: SourceType[] = [
  "Indeed",
  "LinkedIn",
  "Company Career Page",
  "Facebook",
  "WhatsApp Group",
  "Email",
  "Referral",
  "Walk-in",
  "Other"
];

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pick(raw: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = safeString(raw[key]);
    if (value) return value;
  }

  return fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

function slot(index: number, prefix: "CV" | "ML"): string {
  return `${prefix}-${String((index % 15) + 1).padStart(2, "0")}`;
}

function mapStatus(value: unknown): LeadStatus {
  const text = safeString(value);

  if (STATUS_VALUES.includes(text as LeadStatus)) return text as LeadStatus;

  const lower = text.toLowerCase();

  if (lower.includes("applied") || lower.includes("submitted")) return "Applied";
  if (lower.includes("interview")) return "Interview";
  if (lower.includes("offer")) return "Offer";
  if (lower.includes("reject")) return "Rejected";
  if (lower.includes("follow")) return "Follow Up";
  if (lower.includes("prepared") || lower.includes("pack")) return "Prepared";
  if (lower.includes("review")) return "Reviewed";

  return "Found";
}

function mapConfidence(value: unknown): "Low" | "Medium" | "High" {
  const lower = safeString(value).toLowerCase();

  if (lower.includes("high") || lower.includes("strong")) return "High";
  if (lower.includes("low") || lower.includes("weak") || lower.includes("research")) return "Low";

  return "Medium";
}

function mapWorkMode(value: unknown): "On-site" | "Hybrid" | "Remote" | "Unknown" {
  const lower = safeString(value).toLowerCase();

  if (lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh")) return "Remote";
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("office")) return "On-site";

  return "Unknown";
}

function mapSourceType(raw: Record<string, unknown>): SourceType {
  const joined = [
    raw.sourceType,
    raw.sourceName,
    raw.sourceUrl,
    raw.opportunityLink,
    raw.importedBy,
    raw.notes,
    raw.rawText
  ].map(safeString).join(" ").toLowerCase();

  if (joined.includes("indeed")) return "Indeed";
  if (joined.includes("linkedin")) return "LinkedIn";
  if (joined.includes("facebook")) return "Facebook";
  if (joined.includes("whatsapp")) return "WhatsApp Group";
  if (joined.includes("email")) return "Email";
  if (joined.includes("referral")) return "Referral";
  if (joined.includes("walk")) return "Walk-in";
  if (joined.includes("career") || joined.includes("company") || joined.includes("pnet") || joined.includes("careers24") || joined.includes("careerjunction")) {
    return "Company Career Page";
  }

  const direct = safeString(raw.sourceType);
  if (SOURCE_VALUES.includes(direct as SourceType)) return direct as SourceType;

  return "Other";
}

function isExactPJ02Lead(value: unknown): value is PJ02Lead {
  if (!value || typeof value !== "object") return false;

  const raw = value as Record<string, unknown>;

  const requiredStringKeys = [
    "id",
    "createdAt",
    "updatedAt",
    "company",
    "roleTitle",
    "opportunityLink",
    "sourceType",
    "location",
    "workMode",
    "deadline",
    "salaryText",
    "requirementsText",
    "fitReason",
    "riskNotes",
    "confidence",
    "status",
    "nextAction",
    "cvSlot",
    "motivationLetterSlot",
    "proofNote"
  ];

  return requiredStringKeys.every((key) => typeof raw[key] === "string") &&
    STATUS_VALUES.includes(raw.status as LeadStatus) &&
    SOURCE_VALUES.includes(raw.sourceType as SourceType) &&
    ["On-site", "Hybrid", "Remote", "Unknown"].includes(String(raw.workMode)) &&
    ["Low", "Medium", "High"].includes(String(raw.confidence));
}

function normalizeLead(value: unknown, index: number): PJ02Lead {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const now = nowIso();

  const company = pick(raw, ["company", "employer", "organisation", "organization", "sourceName"], "Unknown company");
  const roleTitle = pick(raw, ["roleTitle", "title", "jobTitle", "position", "role"], "Imported job lead");
  const opportunityLink = pick(raw, ["opportunityLink", "sourceUrl", "url", "link"], "");
  const importedBy = pick(raw, ["importedBy", "verificationStatus"], "");
  const sourceName = pick(raw, ["sourceName", "sourceType"], "");
  const rawText = pick(raw, ["requirementsText", "rawText", "notes", "description"], "");

  const verificationNotes = [
    pick(raw, ["riskNotes"], ""),
    pick(raw, ["duplicateRisk"], ""),
    pick(raw, ["verificationStatus"], ""),
    importedBy ? `Imported by ${importedBy}.` : "",
    sourceName ? `Source: ${sourceName}.` : ""
  ].filter(Boolean).join(" ");

  return {
    id: pick(raw, ["id"], `lead-normalized-${Date.now()}-${index}`),
    createdAt: pick(raw, ["createdAt", "capturedAt", "importedAt"], now),
    updatedAt: now,
    company,
    roleTitle,
    opportunityLink,
    sourceType: mapSourceType(raw),
    location: pick(raw, ["location", "locationText", "city", "province"], "South Africa"),
    workMode: mapWorkMode(raw.workMode),
    deadline: pick(raw, ["deadline", "deadlineHint", "closingDate"], ""),
    salaryText: pick(raw, ["salaryText", "salaryHint", "salary", "stipend"], ""),
    requirementsText: rawText.slice(0, 1800),
    fitReason: pick(raw, ["fitReason"], `Imported lead normalized for PJ02. Review fit for ${roleTitle} at ${company}.`),
    riskNotes: verificationNotes || "Imported lead. Verify the source, employer, deadline, fee safety, requirements, and application method before applying.",
    confidence: mapConfidence(raw.confidence || raw.sourceConfidence || raw.leadQuality),
    status: mapStatus(raw.status),
    nextAction: pick(raw, ["nextAction"], "Review fit, prepare tailored CV, prepare matching motivation letter, then apply with proof."),
    cvSlot: pick(raw, ["cvSlot"], slot(index, "CV")),
    motivationLetterSlot: pick(raw, ["motivationLetterSlot"], slot(index, "ML")),
    proofNote: pick(raw, ["proofNote"], opportunityLink ? `Source link captured: ${opportunityLink}` : "No source link captured yet. Add proof before applying.")
  };
}

function readPJ02Raw(): unknown[] {
  try {
    const raw = localStorage.getItem(PJ02_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value, null, 2));
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

export default function ImportNormalizerClient() {
  const [rawLeads, setRawLeads] = useState<unknown[]>([]);
  const [normalizedLeads, setNormalizedLeads] = useState<PJ02Lead[]>([]);
  const [lastReport, setLastReport] = useState<NormalizerReport | null>(null);
  const [message, setMessage] = useState("");

  function scanPJ02(): void {
    const current = readPJ02Raw();
    const normalized = current.map((lead, index) => normalizeLead(lead, index));

    setRawLeads(current);
    setNormalizedLeads(normalized);
    setMessage(`Scanned ${current.length} PJ02 lead(s).`);
  }

  useEffect(() => {
    scanPJ02();
  }, []);

  const stats = useMemo(() => {
    const exactBefore = rawLeads.filter(isExactPJ02Lead).length;
    const exactAfter = normalizedLeads.filter(isExactPJ02Lead).length;

    return {
      totalBefore: rawLeads.length,
      exactBefore,
      repairedCount: Math.max(0, rawLeads.length - exactBefore),
      exactAfter
    };
  }, [rawLeads, normalizedLeads]);

  function createReport(): NormalizerReport {
    return {
      schema: "kingsmen.personal-jobs-13-normalizer-report.v1",
      generatedAt: nowIso(),
      localOnly: true,
      noSendBoundary: true,
      totalBefore: stats.totalBefore,
      exactBefore: stats.exactBefore,
      repairedCount: stats.repairedCount,
      exactAfter: stats.exactAfter,
      backupKey: BACKUP_KEY,
      targetKey: PJ02_KEY,
      examples: normalizedLeads.slice(0, 5).map((lead, index) => ({
        beforeShape: Object.keys((rawLeads[index] || {}) as Record<string, unknown>).slice(0, 20),
        after: {
          company: lead.company,
          roleTitle: lead.roleTitle,
          opportunityLink: lead.opportunityLink,
          sourceType: lead.sourceType,
          confidence: lead.confidence,
          status: lead.status,
          cvSlot: lead.cvSlot,
          motivationLetterSlot: lead.motivationLetterSlot
        }
      }))
    };
  }

  function backupOnly(): void {
    const backup = {
      schema: "kingsmen.personal-jobs-13-backup.v1",
      createdAt: nowIso(),
      targetKey: PJ02_KEY,
      rawLeads
    };

    const raw = localStorage.getItem(BACKUP_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    writeJson(BACKUP_KEY, Array.isArray(existing) ? [backup, ...existing].slice(0, 20) : [backup]);

    setMessage("Backup saved. PJ02 was not changed.");
  }

  function normalizeAndSave(): void {
    const backup = {
      schema: "kingsmen.personal-jobs-13-backup.v1",
      createdAt: nowIso(),
      targetKey: PJ02_KEY,
      rawLeads
    };

    const backupRaw = localStorage.getItem(BACKUP_KEY);
    const existingBackups = backupRaw ? JSON.parse(backupRaw) : [];
    writeJson(BACKUP_KEY, Array.isArray(existingBackups) ? [backup, ...existingBackups].slice(0, 20) : [backup]);

    writeJson(PJ02_KEY, normalizedLeads);

    const report = createReport();
    const reportRaw = localStorage.getItem(REPORT_KEY);
    const existingReports = reportRaw ? JSON.parse(reportRaw) : [];
    writeJson(REPORT_KEY, Array.isArray(existingReports) ? [report, ...existingReports].slice(0, 20) : [report]);

    setLastReport(report);
    setRawLeads(normalizedLeads);
    setMessage(`PJ02 normalized. ${report.exactAfter}/${report.totalBefore} lead(s) now match the PJ02 schema.`);
  }

  return (
    <section data-kingsmen-personal-jobs-13-normalizer="true" data-kingsmen-personal-jobs-13-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Schema target</p>
        <h2 style={{ margin: "8px 0", color: "#f8d77a", fontSize: "31px" }}>
          PJ02 exact opportunity ledger shape
        </h2>
        <p style={{ margin: 0, color: "rgba(248,237,210,0.74)", lineHeight: 1.7 }}>
          PJ13 repairs imported PJ11/PJ12 leads into the exact PJ02 fields so shortlist, apply-pack, submission, follow-up, outcome, and daily loop pages can read them cleanly.
        </p>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Repair readings</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginTop: "10px" }}>
          <article style={cardStyle}><span style={smallLabelStyle}>Total PJ02 leads</span><strong style={metricStyle}>{stats.totalBefore}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Exact before</span><strong style={metricStyle}>{stats.exactBefore}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Needs repair</span><strong style={metricStyle}>{stats.repairedCount}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Exact after preview</span><strong style={metricStyle}>{stats.exactAfter}</strong></article>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
          <button type="button" onClick={scanPJ02} style={buttonStyle}>Scan PJ02</button>
          <button type="button" onClick={backupOnly} style={buttonStyle}>Backup only</button>
          <button type="button" onClick={normalizeAndSave} style={buttonStyle}>Normalize and save PJ02</button>
          <button type="button" onClick={() => exportJson("personal-jobs-13-normalizer-preview.local.json", createReport())} style={buttonStyle}>Export preview</button>
          <a href="/personal-job-desk/opportunities" style={buttonLinkStyle}>Open PJ02</a>
          <a href="/personal-job-desk/shortlist" style={buttonLinkStyle}>Open PJ03</a>
          <a href="/personal-job-desk/source-runner" style={buttonLinkStyle}>Open PJ12</a>
        </div>

        {message ? <p style={{ margin: "14px 0 0", color: "#f8d77a", fontWeight: 900 }}>{message}</p> : null}
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Normalized preview</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>First normalized records</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          {normalizedLeads.length === 0 ? (
            <article style={warningStyle}>No PJ02 leads found yet. Capture leads through PJ11 or PJ12 first.</article>
          ) : (
            normalizedLeads.slice(0, 10).map((lead) => (
              <article key={lead.id} style={leadCardStyle}>
                <span style={smallLabelStyle}>{lead.sourceType} Â· {lead.status} Â· {lead.confidence}</span>
                <h3 style={{ margin: "7px 0", color: "#f8d77a", fontSize: "22px" }}>{lead.roleTitle}</h3>
                <p style={{ margin: 0, color: "rgba(248,237,210,0.76)", lineHeight: 1.6 }}>
                  {lead.company} Â· {lead.location} Â· {lead.workMode}
                </p>
                <p style={{ margin: "8px 0 0", color: "rgba(248,237,210,0.62)", lineHeight: 1.5 }}>
                  CV: {lead.cvSlot} Â· Motivation: {lead.motivationLetterSlot} Â· Link: {lead.opportunityLink || "missing"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      {lastReport ? (
        <section style={panelStyle}>
          <p style={eyebrowStyle}>Latest repair report</p>
          <h2 style={{ margin: "8px 0", color: "#f8d77a" }}>
            {lastReport.exactAfter}/{lastReport.totalBefore} PJ02 leads are exact after repair.
          </h2>
          <p style={{ margin: 0, color: "rgba(248,237,210,0.72)", lineHeight: 1.7 }}>
            Backup stored under {BACKUP_KEY}. Report stored under {REPORT_KEY}.
          </p>
        </section>
      ) : null}

      <section style={warningStyle}>
        <strong>Hard boundary:</strong> PERSONAL-JOBS-13 is a local schema normalizer only. It does not search the internet, open external pages, scrape, send applications, send email, send WhatsApp, contact employers, touch payments, sync calendars, start Docker, deploy to Oracle, or claim production readiness.
      </section>
    </section>
  );
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.20)",
  borderRadius: "28px",
  padding: "20px",
  background: "rgba(0,0,0,0.24)"
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.18)",
  borderRadius: "20px",
  padding: "16px",
  background: "rgba(255,255,255,0.035)"
};

const leadCardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.22)",
  borderRadius: "22px",
  padding: "17px",
  background: "linear-gradient(135deg, rgba(214,178,94,0.10), rgba(255,255,255,0.035))"
};

const warningStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.22)",
  borderRadius: "22px",
  padding: "16px",
  background: "rgba(214,178,94,0.08)",
  color: "rgba(248,237,210,0.78)",
  lineHeight: 1.65
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#d6b25e",
  fontSize: "12px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 900
};

const smallLabelStyle: CSSProperties = {
  color: "rgba(248,237,210,0.58)",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 900
};

const metricStyle: CSSProperties = {
  display: "block",
  marginTop: "8px",
  fontSize: "25px",
  color: "#f8d77a"
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

const buttonLinkStyle: CSSProperties = {
  ...buttonStyle,
  textDecoration: "none"
};