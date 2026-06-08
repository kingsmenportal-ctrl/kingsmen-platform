"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { PersonalJobs11SafeProfile } from "./page";

type ImportedLead = {
  id: string;
  importedAt: string;
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  sourceName: string;
  rawText: string;
  salaryHint: string;
  deadlineHint: string;
  workMode: "remote" | "hybrid" | "onsite" | "unknown";
  confidence: "high" | "medium" | "low";
  duplicateRisk: "new" | "possible_duplicate";
  verificationStatus: "unverified_import";
  nextAction: string;
};

type ImportBatch = {
  schema: string;
  importedAt: string;
  localOnly: boolean;
  noSendBoundary: boolean;
  sourceLabel: string;
  importMode: string;
  rawInputLength: number;
  leads: ImportedLead[];
};

const IMPORT_HISTORY_KEY = "kingsmen.personalJobs11.searchImportBatches.v1";
const PJ02_LEADS_KEY = "kingsmen.personalJobs02.externalLeads.v1";

function safeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function extractUrls(text: string): string[] {
  return unique(text.match(/https?:\/\/[^\s<>"')]+/gi) || []);
}

function firstLine(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)[0] || "";
}

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function guessSourceName(url: string, fallback: string): string {
  if (!url) return fallback || "manual paste";

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return fallback || "manual paste";
  }
}

function guessWorkMode(text: string): ImportedLead["workMode"] {
  const t = text.toLowerCase();

  if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(t)) return "remote";
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\bonsite\b|\bon-site\b|\boffice based\b|\bin office\b/.test(t)) return "onsite";

  return "unknown";
}

function guessSalary(text: string): string {
  const salaryPatterns = [
    /R\s?\d[\d\s,.]*(?:\s?-\s?R?\s?\d[\d\s,.]*)?(?:\s?(?:per month|pm|monthly|per annum|pa|yearly|a year))?/i,
    /\b\d{4,6}\s?(?:per month|pm|monthly|per annum|pa|yearly|a year)\b/i,
    /\bCTC\b.{0,30}/i,
    /\bsalary\b.{0,45}/i,
    /\bstipend\b.{0,45}/i
  ];

  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match?.[0]) return match[0].trim();
  }

  return "";
}

function guessDeadline(text: string): string {
  const deadlinePatterns = [
    /\bclosing date\b.{0,70}/i,
    /\bdeadline\b.{0,70}/i,
    /\bapply by\b.{0,70}/i,
    /\bcloses\b.{0,70}/i,
    /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
  ];

  for (const pattern of deadlinePatterns) {
    const match = text.match(pattern);
    if (match?.[0]) return match[0].trim();
  }

  return "";
}

function guessLocation(text: string, fallback: string): string {
  const knownLocations = [
    "Johannesburg",
    "Sandton",
    "Midrand",
    "Pretoria",
    "Centurion",
    "Cape Town",
    "Durban",
    "Gqeberha",
    "Port Elizabeth",
    "Bloemfontein",
    "Polokwane",
    "Mbombela",
    "Nelspruit",
    "Kimberley",
    "East London",
    "Remote",
    "South Africa"
  ];

  const found = knownLocations.find((place) => new RegExp(`\\b${place}\\b`, "i").test(text));
  return found || fallback || "South Africa";
}

function guessCompany(lines: string[], url: string): string {
  const companySignals = [
    /^company\s*[:\-]\s*(.+)$/i,
    /^employer\s*[:\-]\s*(.+)$/i,
    /^organisation\s*[:\-]\s*(.+)$/i,
    /^organization\s*[:\-]\s*(.+)$/i,
    /^at\s+(.+)$/i
  ];

  for (const line of lines) {
    for (const pattern of companySignals) {
      const match = line.match(pattern);
      if (match?.[1]) return cleanLine(match[1]).slice(0, 90);
    }
  }

  const source = guessSourceName(url, "");
  if (source && !/(indeed|linkedin|google|facebook|jobs|careers|pnet|careerjunction)/i.test(source)) {
    return source;
  }

  const possible = lines.find((line) => {
    const l = line.toLowerCase();
    return line.length > 2 && line.length < 90 && !l.includes("http") && !l.includes("apply") && !l.includes("salary") && !l.includes("deadline");
  });

  return possible ? cleanLine(possible).slice(0, 90) : "Unknown company";
}

function guessTitle(lines: string[], text: string): string {
  const titleSignals = [
    /^job title\s*[:\-]\s*(.+)$/i,
    /^title\s*[:\-]\s*(.+)$/i,
    /^position\s*[:\-]\s*(.+)$/i,
    /^role\s*[:\-]\s*(.+)$/i,
    /^vacancy\s*[:\-]\s*(.+)$/i
  ];

  for (const line of lines) {
    for (const pattern of titleSignals) {
      const match = line.match(pattern);
      if (match?.[1]) return cleanLine(match[1]).slice(0, 110);
    }
  }

  const roleWords = /(assistant|administrator|clerk|cashier|driver|learner|intern|graduate|consultant|agent|support|technician|operator|developer|analyst|sales|service|receptionist|general worker|call centre|data capturer|warehouse|store|retail|admin|security|trainee)/i;
  const likely = lines.find((line) => line.length >= 4 && line.length <= 120 && roleWords.test(line));

  if (likely) return cleanLine(likely).slice(0, 110);

  const first = cleanLine(firstLine(text));
  return first ? first.slice(0, 110) : "Imported job lead";
}

function splitIntoBlocks(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const separated = text
    .split(/\n\s*\n|={3,}|-{3,}|JOB\s*\d+\s*[:.)-]?/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 8);

  if (separated.length > 1) return separated;

  const urls = extractUrls(text);
  if (urls.length <= 1) return [text];

  const blocks: string[] = [];
  let current = "";

  for (const line of text.split("\n")) {
    if (line.match(/https?:\/\//i) && current.trim().length > 30) {
      blocks.push(current.trim());
      current = line;
    } else {
      current += `${line}\n`;
    }
  }

  if (current.trim()) blocks.push(current.trim());

  return blocks.length ? blocks : [text];
}

function buildLead(block: string, profileLocation: string, fallbackSource: string, existingFingerprints: Set<string>): ImportedLead {
  const urls = extractUrls(block);
  const sourceUrl = urls[0] || "";
  const lines = block
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => !/^https?:\/\//i.test(line));

  const title = guessTitle(lines, block);
  const company = guessCompany(lines, sourceUrl);
  const location = guessLocation(block, profileLocation);
  const salaryHint = guessSalary(block);
  const deadlineHint = guessDeadline(block);
  const sourceName = guessSourceName(sourceUrl, fallbackSource);
  const workMode = guessWorkMode(block);

  const strongSignals = [title, company, sourceUrl, salaryHint, deadlineHint].filter(Boolean).length;
  const confidence: ImportedLead["confidence"] = strongSignals >= 4 ? "high" : strongSignals >= 2 ? "medium" : "low";
  const fingerprint = `${title.toLowerCase()}|${company.toLowerCase()}|${sourceUrl.toLowerCase()}`;
  const duplicateRisk = existingFingerprints.has(fingerprint) ? "possible_duplicate" : "new";

  return {
    id: safeId("pj11-lead"),
    importedAt: new Date().toISOString(),
    title,
    company,
    location,
    sourceUrl,
    sourceName,
    rawText: block.slice(0, 4000),
    salaryHint,
    deadlineHint,
    workMode,
    confidence,
    duplicateRisk,
    verificationStatus: "unverified_import",
    nextAction:
      duplicateRisk === "possible_duplicate"
        ? "Review duplicate risk before adding to active campaign."
        : "Verify source, then score in PERSONAL-JOBS-03."
  };
}

function normalizeExistingLeads(value: unknown): ImportedLead[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as ImportedLead[];

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["leads", "items", "rows", "records"]) {
      if (Array.isArray(record[key])) return record[key] as ImportedLead[];
    }
  }

  return [];
}

function readJsonArray(key: string): ImportedLead[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return normalizeExistingLeads(JSON.parse(raw));
  } catch {
    return [];
  }
}

function fingerprintLead(lead: Partial<ImportedLead>): string {
  return `${String(lead.title || "").toLowerCase()}|${String(lead.company || "").toLowerCase()}|${String(lead.sourceUrl || "").toLowerCase()}`;
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

export default function JobSearchImportClient({ initialProfile }: { initialProfile: PersonalJobs11SafeProfile }) {
  const [sourceLabel, setSourceLabel] = useState("manual paste");
  const [importMode, setImportMode] = useState("mixed job search paste");
  const [rawInput, setRawInput] = useState("");
  const [parsedLeads, setParsedLeads] = useState<ImportedLead[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [pj02Count, setPj02Count] = useState(0);
  const [lastBatch, setLastBatch] = useState<ImportBatch | null>(null);
  const [copied, setCopied] = useState(false);

  function refreshCounts(): void {
    try {
      const historyRaw = localStorage.getItem(IMPORT_HISTORY_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      setHistoryCount(Array.isArray(history) ? history.length : 0);
    } catch {
      setHistoryCount(0);
    }

    setPj02Count(readJsonArray(PJ02_LEADS_KEY).length);
  }

  useEffect(() => {
    refreshCounts();
  }, []);

  const importStats = useMemo(() => {
    const urls = extractUrls(rawInput).length;
    const high = parsedLeads.filter((lead) => lead.confidence === "high").length;
    const medium = parsedLeads.filter((lead) => lead.confidence === "medium").length;
    const low = parsedLeads.filter((lead) => lead.confidence === "low").length;
    const duplicates = parsedLeads.filter((lead) => lead.duplicateRisk === "possible_duplicate").length;

    return { urls, high, medium, low, duplicates };
  }, [rawInput, parsedLeads]);

  function parseImport(): void {
    const existing = readJsonArray(PJ02_LEADS_KEY);
    const fingerprints = new Set(existing.map(fingerprintLead));
    const blocks = splitIntoBlocks(rawInput);

    const leads = blocks
      .map((block) => buildLead(block, initialProfile.location, sourceLabel, fingerprints))
      .filter((lead) => lead.title.trim().length > 0 || lead.sourceUrl.trim().length > 0);

    setParsedLeads(leads);
  }

  function saveBatch(pushToPj02: boolean): void {
    const batch: ImportBatch = {
      schema: "kingsmen.personal-jobs-11-search-import-batch.v1",
      importedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      sourceLabel,
      importMode,
      rawInputLength: rawInput.length,
      leads: parsedLeads
    };

    const historyRaw = localStorage.getItem(IMPORT_HISTORY_KEY);
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const nextHistory = Array.isArray(history) ? [batch, ...history].slice(0, 50) : [batch];

    localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(nextHistory, null, 2));

    if (pushToPj02) {
      const existing = readJsonArray(PJ02_LEADS_KEY);
      const existingFingerprints = new Set(existing.map(fingerprintLead));
      const freshLeads = parsedLeads.filter((lead) => !existingFingerprints.has(fingerprintLead(lead)));

      const pj02Compatible = freshLeads.map((lead) => ({
        ...lead,
        importedBy: "PERSONAL-JOBS-11",
        status: "captured",
        sourceConfidence: lead.confidence,
        leadQuality: lead.confidence === "high" ? "strong_import" : lead.confidence === "medium" ? "usable_import" : "research_first",
        notes: lead.rawText,
        capturedAt: lead.importedAt
      }));

      localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify([...pj02Compatible, ...existing], null, 2));
    }

    setLastBatch(batch);
    refreshCounts();
  }

  async function copyBatch(): Promise<void> {
    const payload = lastBatch || {
      schema: "kingsmen.personal-jobs-11-search-import-copy.v1",
      copiedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      sourceLabel,
      importMode,
      leads: parsedLeads
    };

    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section data-kingsmen-personal-jobs-11-import-desk="true" data-kingsmen-personal-jobs-11-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Import officer</p>
        <h2 style={{ margin: "8px 0", color: "#f8d77a", fontSize: "31px" }}>
          {initialProfile.fullName} · {initialProfile.targetRole}
        </h2>
        <p style={{ margin: 0, color: "rgba(248,237,210,0.74)", lineHeight: 1.7 }}>
          {initialProfile.priority}
        </p>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Paste source</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>Drop job search results here</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "14px" }}>
          <label style={cardStyle}>
            <span style={smallLabelStyle}>Source label</span>
            <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} style={inputStyle} placeholder="Indeed, LinkedIn, company site, WhatsApp, Facebook..." />
          </label>

          <label style={cardStyle}>
            <span style={smallLabelStyle}>Import mode</span>
            <select value={importMode} onChange={(event) => setImportMode(event.target.value)} style={inputStyle}>
              <option>mixed job search paste</option>
              <option>job URLs only</option>
              <option>company career page snippets</option>
              <option>WhatsApp or Facebook lead text</option>
              <option>LinkedIn or Indeed copied results</option>
              <option>manual research notes</option>
            </select>
          </label>
        </div>

        <textarea
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          style={textareaStyle}
          placeholder={"Paste job URLs or copied listings here.\n\nExample:\nAdmin Assistant\nCompany: Example Retail\nLocation: Johannesburg\nSalary: R6500 per month\nClosing date: 2026-07-15\nhttps://example.com/careers/admin-assistant"}
        />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
          <button type="button" onClick={parseImport} style={buttonStyle}>Parse import</button>
          <button type="button" onClick={() => saveBatch(false)} disabled={parsedLeads.length === 0} style={buttonStyle}>Save import batch only</button>
          <button type="button" onClick={() => saveBatch(true)} disabled={parsedLeads.length === 0} style={buttonStyle}>Push clean leads to PJ02</button>
          <button type="button" onClick={() => exportJson("personal-jobs-11-import-batch.local.json", lastBatch || { sourceLabel, importMode, parsedLeads })} style={buttonStyle}>Export JSON</button>
          <button type="button" onClick={copyBatch} style={buttonStyle}>{copied ? "Copied" : "Copy JSON"}</button>
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Import readings</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginTop: "10px" }}>
          <article style={cardStyle}><span style={smallLabelStyle}>Parsed leads</span><strong style={metricStyle}>{parsedLeads.length}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>URLs detected</span><strong style={metricStyle}>{importStats.urls}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>High confidence</span><strong style={metricStyle}>{importStats.high}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Medium confidence</span><strong style={metricStyle}>{importStats.medium}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Low confidence</span><strong style={metricStyle}>{importStats.low}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Duplicate risk</span><strong style={metricStyle}>{importStats.duplicates}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Saved batches</span><strong style={metricStyle}>{historyCount}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>PJ02 lead count</span><strong style={metricStyle}>{pj02Count}</strong></article>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p style={eyebrowStyle}>Parsed opportunity leads</p>
            <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>Review before campaign use</h2>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/personal-job-desk/opportunities" style={buttonLinkStyle}>Open PJ02</a>
            <a href="/personal-job-desk/shortlist" style={buttonLinkStyle}>Open shortlist</a>
            <a href="/personal-job-desk/daily-loop" style={buttonLinkStyle}>Open daily loop</a>
          </div>
        </div>

        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          {parsedLeads.length === 0 ? (
            <article style={warningStyle}>
              Paste job text or URLs above, then click Parse import. This desk does not browse, scrape, apply, email, or contact employers by itself.
            </article>
          ) : (
            parsedLeads.map((lead, index) => (
              <article key={lead.id} style={leadCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ maxWidth: "820px" }}>
                    <span style={smallLabelStyle}>#{index + 1} · {lead.confidence} confidence · {lead.duplicateRisk}</span>
                    <h3 style={{ margin: "7px 0", color: "#f8d77a", fontSize: "22px" }}>{lead.title}</h3>
                    <p style={{ margin: 0, color: "rgba(248,237,210,0.78)", lineHeight: 1.65 }}>
                      {lead.company} · {lead.location} · {lead.workMode}
                    </p>
                    <p style={{ margin: "8px 0 0", color: "rgba(248,237,210,0.64)", lineHeight: 1.55 }}>
                      Salary: {lead.salaryHint || "not detected"} · Deadline: {lead.deadlineHint || "not detected"} · Source: {lead.sourceName}
                    </p>
                    <p style={{ margin: "8px 0 0", color: "#f0bd68", fontWeight: 900 }}>
                      {lead.nextAction}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    {lead.sourceUrl ? <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={buttonLinkStyle}>Open source</a> : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={warningStyle}>
        <strong>Hard boundary:</strong> PERSONAL-JOBS-11 is an import desk only. It does not search the internet by itself, scrape websites, send applications, send email, send WhatsApp, contact employers, touch payments, start Docker, deploy to Oracle, or claim production readiness. Imported leads remain unverified until you verify the source.
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
  color: "#f8d77a",
  textTransform: "capitalize"
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

const inputStyle: CSSProperties = {
  width: "100%",
  marginTop: "9px",
  border: "1px solid rgba(214,178,94,0.28)",
  borderRadius: "14px",
  padding: "11px",
  background: "rgba(0,0,0,0.28)",
  color: "#f8d77a",
  fontWeight: 900,
  fontSize: "15px"
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "260px",
  border: "1px solid rgba(214,178,94,0.28)",
  borderRadius: "18px",
  padding: "16px",
  background: "rgba(0,0,0,0.30)",
  color: "#f8edd2",
  fontWeight: 700,
  fontSize: "15px",
  lineHeight: 1.6,
  resize: "vertical"
};