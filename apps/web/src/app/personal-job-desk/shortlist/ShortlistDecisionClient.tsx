"use client";

import { useEffect, useMemo, useState } from "react";

type CandidateProfile = Record<string, unknown> | null;

type LeadRecord = {
  id?: string;
  title?: string;
  role?: string;
  company?: string;
  employer?: string;
  sector?: string;
  location?: string;
  sourceType?: string;
  sourceUrl?: string;
  url?: string;
  deadline?: string;
  status?: string;
  proofNote?: string;
  notes?: string;
  [key: string]: unknown;
};

type ScoreRow = {
  original: LeadRecord;
  title: string;
  company: string;
  sector: string;
  location: string;
  sourceUrl: string;
  status: string;
  score: number;
  band: "CROWN_TARGET" | "STRONG_ROUTE" | "WATCHLIST" | "RESEARCH_FIRST";
  cvSlot: string;
  motivationSlot: string;
  reasons: string[];
  risks: string[];
  nextAction: string;
};

const PERSONAL_JOBS_02_EXTERNAL_LEADS_KEY = "kingsmen.personalJobs02.externalLeads.v1";
const PERSONAL_JOBS_03_SHORTLIST_KEY = "kingsmen.personalJobs03.shortlist.v1";
const PERSONAL_JOBS_03_NO_SEND_BOUNDARY =
  "PERSONAL_JOBS_03_NO_SEND_BOUNDARY: local scoring only; no applications, emails, WhatsApps, payments, or portal submissions are sent.";

const slotOptions = [
  { cv: "CV-01", ml: "ML-01" },
  { cv: "CV-02", ml: "ML-02" },
  { cv: "CV-03", ml: "ML-03" },
  { cv: "CV-04", ml: "ML-04" },
  { cv: "CV-05", ml: "ML-05" },
  { cv: "CV-06", ml: "ML-06" },
  { cv: "CV-07", ml: "ML-07" },
  { cv: "CV-08", ml: "ML-08" },
  { cv: "CV-09", ml: "ML-09" },
  { cv: "CV-10", ml: "ML-10" },
  { cv: "CV-11", ml: "ML-11" },
  { cv: "CV-12", ml: "ML-12" },
  { cv: "CV-13", ml: "ML-13" },
  { cv: "CV-14", ml: "ML-14" },
  { cv: "CV-15", ml: "ML-15" }
];

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).join(" ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(textValue).join(" ");
  return "";
}

function leadValue(lead: LeadRecord, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = lead[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function normaliseLeadList(raw: unknown): LeadRecord[] {
  if (Array.isArray(raw)) return raw.filter((entry): entry is LeadRecord => Boolean(entry && typeof entry === "object"));

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.leads)) return record.leads.filter((entry): entry is LeadRecord => Boolean(entry && typeof entry === "object"));
    if (Array.isArray(record.items)) return record.items.filter((entry): entry is LeadRecord => Boolean(entry && typeof entry === "object"));
  }

  return [];
}

function sourceConfidence(sourceType: string, sourceUrl: string): number {
  const sourceText = `${sourceType} ${sourceUrl}`.toLowerCase();

  if (sourceText.includes("official") || sourceText.includes("career") || sourceText.includes("company")) return 18;
  if (sourceText.includes("linkedin") || sourceText.includes("indeed") || sourceText.includes("pnet") || sourceText.includes("careers24")) return 12;
  if (sourceText.includes("facebook") || sourceText.includes("whatsapp") || sourceText.includes("rumour")) return 4;

  return 8;
}

function hasDeadlineRisk(deadline: string): boolean {
  if (!deadline || deadline === "No deadline captured") return true;

  const parsed = Date.parse(deadline);
  if (!Number.isFinite(parsed)) return true;

  const days = Math.ceil((parsed - Date.now()) / 86400000);
  return days < 0 || days <= 3;
}

function extractCandidateKeywords(candidate: CandidateProfile): string[] {
  const profileText = textValue(candidate ?? {}).toLowerCase();

  const known = [
    "admin",
    "assistant",
    "customer",
    "service",
    "retail",
    "sales",
    "warehouse",
    "general worker",
    "learnership",
    "internship",
    "junior",
    "support",
    "office",
    "data",
    "computer",
    "it",
    "security",
    "hospitality",
    "driver"
  ];

  const matched = known.filter((keyword) => profileText.includes(keyword));
  return Array.from(new Set([...matched, "admin", "assistant", "customer", "retail", "learnership", "junior", "general worker"]));
}

function scoreOpportunity(lead: LeadRecord, candidate: CandidateProfile, index: number): ScoreRow {
  const title = leadValue(lead, ["title", "role", "jobTitle", "opportunityTitle"], "Untitled opportunity");
  const company = leadValue(lead, ["company", "employer", "institution", "organisation", "organization"], "Company not captured");
  const sector = leadValue(lead, ["sector", "category", "route", "industry"], "Unclassified sector");
  const location = leadValue(lead, ["location", "city", "province"], "Location not captured");
  const status = leadValue(lead, ["status", "leadStatus"], "NEW");
  const sourceType = leadValue(lead, ["sourceType", "source", "origin"], "Unclassified source");
  const sourceUrl = leadValue(lead, ["sourceUrl", "url", "link"], "No source URL captured");
  const deadline = leadValue(lead, ["deadline", "closingDate", "closing_date"], "No deadline captured");
  const proofNote = leadValue(lead, ["proofNote", "proof", "notes"], "");

  const opportunityText = textValue(lead).toLowerCase();
  const matchedKeywords = extractCandidateKeywords(candidate).filter((keyword) => opportunityText.includes(keyword.toLowerCase()));

  const reasons: string[] = [];
  const risks: string[] = [];

  let score = 30;

  score += Math.min(28, matchedKeywords.length * 7);

  if (matchedKeywords.length > 0) {
    reasons.push(`Matched profile direction: ${matchedKeywords.slice(0, 5).join(", ")}.`);
  } else {
    risks.push("No strong profile keyword match was found yet.");
  }

  const confidenceScore = sourceConfidence(sourceType, sourceUrl);
  score += confidenceScore;

  if (confidenceScore >= 12) reasons.push("Source confidence is usable for serious review.");
  else risks.push("Source must be verified before this becomes a serious target.");

  if (sourceUrl !== "No source URL captured") {
    score += 8;
    reasons.push("A source link exists for manual verification.");
  } else {
    risks.push("Missing source link blocks safe application movement.");
  }

  if (proofNote.trim().length > 6) {
    score += 7;
    reasons.push("Proof note exists for evidence review.");
  } else {
    risks.push("Proof note is weak or missing.");
  }

  if (hasDeadlineRisk(deadline)) {
    score -= 10;
    risks.push("Deadline is missing, expired, unclear, or close.");
  } else {
    score += 7;
    reasons.push("Deadline appears usable for planning.");
  }

  if (status.toLowerCase().includes("reject") || status.toLowerCase().includes("closed")) {
    score -= 25;
    risks.push("Lead status suggests this route may already be closed or rejected.");
  }

  score = Math.max(0, Math.min(100, score));

  const band =
    score >= 75
      ? "CROWN_TARGET"
      : score >= 60
        ? "STRONG_ROUTE"
        : score >= 45
          ? "WATCHLIST"
          : "RESEARCH_FIRST";

  const slot = slotOptions[index % slotOptions.length];

  const nextAction =
    band === "CROWN_TARGET"
      ? "Prepare a tailored CV and motivation letter, verify the source, then decide whether to apply."
      : band === "STRONG_ROUTE"
        ? "Review requirements and improve proof before moving into application preparation."
        : band === "WATCHLIST"
          ? "Keep this lead visible, but do not spend a prime CV slot until source and fit improve."
          : "Research first. Do not apply yet.";

  return {
    original: lead,
    title,
    company,
    sector,
    location,
    sourceUrl,
    status,
    score,
    band,
    cvSlot: slot.cv,
    motivationSlot: slot.ml,
    reasons,
    risks,
    nextAction
  };
}

function bandLabel(band: ScoreRow["band"]) {
  if (band === "CROWN_TARGET") return "Crown Target";
  if (band === "STRONG_ROUTE") return "Strong Route";
  if (band === "WATCHLIST") return "Watchlist";
  return "Research First";
}

export default function ShortlistDecisionClient({ candidate }: { candidate: CandidateProfile }) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bandFilter, setBandFilter] = useState("ALL");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PERSONAL_JOBS_02_EXTERNAL_LEADS_KEY);
      setLeads(raw ? normaliseLeadList(JSON.parse(raw)) : []);
    } catch {
      setLeads([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const scoredRows = useMemo(() => {
    return leads.map((lead, index) => scoreOpportunity(lead, candidate, index)).sort((a, b) => b.score - a.score);
  }, [candidate, leads]);

  const visibleRows = scoredRows.filter((row) => bandFilter === "ALL" || row.band === bandFilter);

  function exportShortlist() {
    const payload = {
      schema: "kingsmen.personal-jobs-03-shortlist-export.v1",
      generated_at: new Date().toISOString(),
      boundary: PERSONAL_JOBS_03_NO_SEND_BOUNDARY,
      source_key: PERSONAL_JOBS_02_EXTERNAL_LEADS_KEY,
      shortlist_key: PERSONAL_JOBS_03_SHORTLIST_KEY,
      rows: scoredRows
    };

    window.localStorage.setItem(PERSONAL_JOBS_03_SHORTLIST_KEY, JSON.stringify(payload, null, 2));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "personal-jobs-03-shortlist.local.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateLeadStatus(target: LeadRecord, status: string) {
    const updated = leads.map((lead) => (lead === target ? { ...lead, status } : lead));
    setLeads(updated);
    window.localStorage.setItem(PERSONAL_JOBS_02_EXTERNAL_LEADS_KEY, JSON.stringify(updated, null, 2));
  }

  return (
    <section style={{ maxWidth: "1220px", margin: "0 auto" }}>
      <header style={{ marginBottom: "26px" }}>
        <p style={{ color: "#d6b25e", letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "12px", fontWeight: 900 }}>
          PERSONAL-JOBS-03 · Local Decision Desk
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: 1.05, margin: "8px 0 12px" }}>
          Fit Scoring & Shortlist
        </h1>
        <p style={{ maxWidth: "860px", color: "rgba(248,236,208,0.78)", fontSize: "16px", lineHeight: 1.7 }}>
          This local desk ranks captured job leads by fit, source confidence, deadline clarity, proof quality, and readiness.
          It recommends the CV and motivation-letter pair to prepare, but it does not send or submit anything.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginBottom: "18px" }}>
        {[
          ["Total Leads", scoredRows.length],
          ["Crown Targets", scoredRows.filter((row) => row.band === "CROWN_TARGET").length],
          ["Strong Routes", scoredRows.filter((row) => row.band === "STRONG_ROUTE").length],
          ["Needs Research", scoredRows.filter((row) => row.band === "RESEARCH_FIRST").length]
        ].map(([label, value]) => (
          <article key={label} style={{ border: "1px solid rgba(214,178,94,0.24)", borderRadius: "22px", padding: "18px", background: "rgba(255,255,255,0.045)" }}>
            <p style={{ margin: 0, color: "rgba(248,236,208,0.62)", fontSize: "12px", textTransform: "uppercase" }}>{label}</p>
            <strong style={{ display: "block", marginTop: "8px", fontSize: "30px", color: "#f8d77a" }}>{value}</strong>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "space-between", marginBottom: "20px", border: "1px solid rgba(214,178,94,0.18)", borderRadius: "20px", padding: "14px", background: "rgba(0,0,0,0.26)" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            ["ALL", "All"],
            ["CROWN_TARGET", "Crown Targets"],
            ["STRONG_ROUTE", "Strong Routes"],
            ["WATCHLIST", "Watchlist"],
            ["RESEARCH_FIRST", "Research First"]
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setBandFilter(value)}
              style={{
                border: "1px solid rgba(214,178,94,0.28)",
                borderRadius: "999px",
                padding: "10px 14px",
                background: bandFilter === value ? "rgba(214,178,94,0.22)" : "rgba(255,255,255,0.04)",
                color: bandFilter === value ? "#f8d77a" : "#f8ecd0",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={exportShortlist}
          disabled={scoredRows.length === 0}
          style={{
            border: "1px solid rgba(214,178,94,0.54)",
            borderRadius: "999px",
            padding: "11px 16px",
            background: "linear-gradient(135deg, rgba(214,178,94,0.25), rgba(214,178,94,0.08))",
            color: "#f8d77a",
            fontWeight: 900,
            cursor: scoredRows.length === 0 ? "not-allowed" : "pointer"
          }}
        >
          Export Local Shortlist JSON
        </button>
      </div>

      {!loaded ? (
        <p>Loading local leads...</p>
      ) : scoredRows.length === 0 ? (
        <article style={{ border: "1px solid rgba(214,178,94,0.26)", borderRadius: "26px", padding: "24px", background: "rgba(255,255,255,0.045)" }}>
          <h2 style={{ marginTop: 0 }}>No external leads captured yet.</h2>
          <p style={{ color: "rgba(248,236,208,0.72)", lineHeight: 1.7 }}>
            Go to /personal-job-desk/opportunities and capture job leads first. Once leads exist, this page will rank them.
          </p>
        </article>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {visibleRows.map((row, index) => (
            <article key={`${row.title}-${row.company}-${index}`} style={{ border: "1px solid rgba(214,178,94,0.22)", borderRadius: "26px", padding: "20px", background: row.band === "CROWN_TARGET" ? "linear-gradient(135deg, rgba(214,178,94,0.16), rgba(255,255,255,0.035))" : "rgba(255,255,255,0.045)" }}>
              <div style={{ display: "flex", gap: "16px", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: "0 0 8px", color: "#d6b25e", fontWeight: 900, textTransform: "uppercase", fontSize: "12px" }}>
                    {bandLabel(row.band)} · Score {row.score}/100
                  </p>
                  <h2 style={{ margin: 0, fontSize: "24px" }}>{row.title}</h2>
                  <p style={{ margin: "8px 0 0", color: "rgba(248,236,208,0.72)" }}>
                    {row.company} · {row.sector} · {row.location}
                  </p>
                </div>

                <div style={{ textAlign: "right", minWidth: "150px" }}>
                  <strong style={{ color: "#f8d77a", display: "block" }}>{row.cvSlot}</strong>
                  <strong style={{ color: "#f8d77a", display: "block" }}>{row.motivationSlot}</strong>
                  <span style={{ color: "rgba(248,236,208,0.58)", fontSize: "12px" }}>recommended prep pair</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "16px" }}>
                <div>
                  <h3 style={{ color: "#f8d77a", fontSize: "14px" }}>Why it ranks here</h3>
                  <ul style={{ color: "rgba(248,236,208,0.76)", lineHeight: 1.6 }}>
                    {row.reasons.length ? row.reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>No strong reasons captured yet.</li>}
                  </ul>
                </div>

                <div>
                  <h3 style={{ color: "#f8d77a", fontSize: "14px" }}>Risks before applying</h3>
                  <ul style={{ color: "rgba(248,236,208,0.76)", lineHeight: 1.6 }}>
                    {row.risks.length ? row.risks.map((risk) => <li key={risk}>{risk}</li>) : <li>No major local risk detected.</li>}
                  </ul>
                </div>
              </div>

              <p style={{ marginTop: "14px", borderTop: "1px solid rgba(214,178,94,0.18)", paddingTop: "14px", color: "rgba(248,236,208,0.78)" }}>
                <strong style={{ color: "#f8d77a" }}>Next action:</strong> {row.nextAction}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}>
                <button onClick={() => updateLeadStatus(row.original, "TARGET")} style={{ border: "1px solid rgba(214,178,94,0.42)", borderRadius: "999px", padding: "10px 13px", background: "rgba(214,178,94,0.16)", color: "#f8d77a", fontWeight: 800, cursor: "pointer" }}>
                  Mark Crown Target
                </button>
                <button onClick={() => updateLeadStatus(row.original, "RESEARCH")} style={{ border: "1px solid rgba(248,236,208,0.18)", borderRadius: "999px", padding: "10px 13px", background: "rgba(255,255,255,0.04)", color: "#f8ecd0", fontWeight: 800, cursor: "pointer" }}>
                  Needs Research
                </button>
                <button onClick={() => updateLeadStatus(row.original, "DECLINED_LOCAL")} style={{ border: "1px solid rgba(248,236,208,0.18)", borderRadius: "999px", padding: "10px 13px", background: "rgba(255,255,255,0.04)", color: "#f8ecd0", fontWeight: 800, cursor: "pointer" }}>
                  Decline Locally
                </button>
              </div>

              <p style={{ marginTop: "12px", color: "rgba(248,236,208,0.5)", fontSize: "12px" }}>
                Boundary: {PERSONAL_JOBS_03_NO_SEND_BOUNDARY}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
