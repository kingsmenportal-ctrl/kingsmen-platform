"use client";

import { useEffect, useMemo, useState } from "react";

type CandidateProfile = Record<string, unknown> | null;

type ShortlistRow = {
  title?: string;
  company?: string;
  sector?: string;
  location?: string;
  sourceUrl?: string;
  status?: string;
  score?: number;
  band?: string;
  cvSlot?: string;
  motivationSlot?: string;
  reasons?: string[];
  risks?: string[];
  nextAction?: string;
  original?: Record<string, unknown>;
  [key: string]: unknown;
};

type TemplateOption = {
  id: string;
  name: string;
  tone: string;
  bestFor: string;
  structure: string;
};

type ApplyPack = {
  id: string;
  generated_at: string;
  boundary: string;
  source: {
    title: string;
    company: string;
    sector: string;
    location: string;
    score: number;
    band: string;
    sourceUrl: string;
  };
  cvSlot: string;
  motivationSlot: string;
  template: TemplateOption;
  atsKeywords: string[];
  truthRules: string[];
  cvDraft: string;
  motivationLetterDraft: string;
  preflightChecklist: string[];
  blockers: string[];
  nextAction: string;
};

const PERSONAL_JOBS_03_SHORTLIST_KEY = "kingsmen.personalJobs03.shortlist.v1";
const PERSONAL_JOBS_04_APPLY_PACKS_KEY = "kingsmen.personalJobs04.applyPacks.v1";
const PERSONAL_JOBS_04_NO_SEND_BOUNDARY =
  "PERSONAL_JOBS_04_NO_SEND_BOUNDARY: draft-only local apply packs; no applications, emails, WhatsApps, payment actions, portal submissions, or employer contact are sent.";
const PERSONAL_JOBS_04_SLOT_COUNT_PROOF = {
  cvSlots: [
    "CV-01", "CV-02", "CV-03", "CV-04", "CV-05",
    "CV-06", "CV-07", "CV-08", "CV-09", "CV-10",
    "CV-11", "CV-12", "CV-13", "CV-14", "CV-15"
  ],
  motivationLetterSlots: [
    "ML-01", "ML-02", "ML-03", "ML-04", "ML-05",
    "ML-06", "ML-07", "ML-08", "ML-09", "ML-10",
    "ML-11", "ML-12", "ML-13", "ML-14", "ML-15"
  ]
};

const templateOptions: TemplateOption[] = [
  {
    id: "executive-classic",
    name: "Executive Classic",
    tone: "Formal, reserved, confident",
    bestFor: "Banks, corporate graduate roles, formal office posts, administration, finance, governance",
    structure: "Profile summary, capability pillars, experience proof, education, technical and soft skills"
  },
  {
    id: "ats-plain",
    name: "ATS Plain",
    tone: "Clean, direct, keyword-rich",
    bestFor: "Online portals, applicant tracking systems, high-volume listings, company career sites",
    structure: "Headline, summary, skills, experience, education, certificates, references available on request"
  },
  {
    id: "retail-service",
    name: "Retail & Service",
    tone: "Warm, reliable, customer-focused",
    bestFor: "Retail, customer service, hospitality, call centre, front desk and sales roles",
    structure: "Customer strengths, reliability, communication, sales/service evidence, availability"
  },
  {
    id: "admin-precision",
    name: "Administrative Precision",
    tone: "Organised, accurate, office-ready",
    bestFor: "Admin assistant, receptionist, clerk, data capture, office support, finance admin",
    structure: "Accuracy, document handling, communication, scheduling, computer literacy, confidentiality"
  },
  {
    id: "learnership-entry",
    name: "Learnership Entry",
    tone: "Hungry, teachable, disciplined",
    bestFor: "Learnerships, internships, apprenticeships, entry-level programmes and youth opportunities",
    structure: "Learning attitude, discipline, education, transferable strengths, growth motivation"
  },
  {
    id: "general-worker",
    name: "General Worker",
    tone: "Practical, dependable, safety-aware",
    bestFor: "Warehouse, logistics, general worker, operations, stockroom, cleaning, production support",
    structure: "Reliability, stamina, teamwork, safety, punctuality, task discipline"
  },
  {
    id: "digital-support",
    name: "Digital Support",
    tone: "Modern, capable, problem-solving",
    bestFor: "IT support, data entry, online admin, remote support, junior digital roles",
    structure: "Digital tools, problem solving, communication, learning speed, documentation"
  },
  {
    id: "hospitality-care",
    name: "Hospitality & Care",
    tone: "Respectful, calm, service-minded",
    bestFor: "Hospitality, healthcare support, care work, reception, tourism and people-facing work",
    structure: "Service conduct, empathy, patience, teamwork, hygiene, professionalism"
  }
];

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).join(" ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(textValue).join(" ");
  return "";
}

function firstString(record: CandidateProfile, keys: string[], fallback: string): string {
  if (!record || typeof record !== "object") return fallback;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return fallback;
}

function rowString(row: ShortlistRow, key: keyof ShortlistRow, fallback: string): string {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normaliseRows(raw: unknown): ShortlistRow[] {
  if (Array.isArray(raw)) return raw.filter((entry): entry is ShortlistRow => Boolean(entry && typeof entry === "object"));

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.rows)) return record.rows.filter((entry): entry is ShortlistRow => Boolean(entry && typeof entry === "object"));
    if (Array.isArray(record.shortlist)) return record.shortlist.filter((entry): entry is ShortlistRow => Boolean(entry && typeof entry === "object"));
    if (Array.isArray(record.items)) return record.items.filter((entry): entry is ShortlistRow => Boolean(entry && typeof entry === "object"));
  }

  return [];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractAtsKeywords(row: ShortlistRow, candidate: CandidateProfile): string[] {
  const title = rowString(row, "title", "");
  const sector = rowString(row, "sector", "");
  const opportunity = textValue(row).toLowerCase();
  const profile = textValue(candidate ?? {}).toLowerCase();

  const dictionary = [
    "administration",
    "customer service",
    "communication",
    "computer literacy",
    "data capture",
    "Microsoft Office",
    "email communication",
    "filing",
    "accuracy",
    "teamwork",
    "time management",
    "reliability",
    "sales",
    "retail",
    "stock control",
    "cash handling",
    "warehouse",
    "logistics",
    "learnership",
    "internship",
    "problem solving",
    "front desk",
    "reception",
    "hospitality",
    "healthcare support",
    "safety",
    "punctuality",
    "reporting",
    "attention to detail",
    "South African work readiness"
  ];

  const matched = dictionary.filter((keyword) => {
    const k = keyword.toLowerCase();
    return opportunity.includes(k) || profile.includes(k) || title.toLowerCase().includes(k) || sector.toLowerCase().includes(k);
  });

  const titleWords = title
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 3)
    .slice(0, 8);

  const sectorWords = sector
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 3)
    .slice(0, 6);

  return unique([...titleWords, ...sectorWords, ...matched]).slice(0, 24);
}

function inferStrengths(candidate: CandidateProfile): string[] {
  const profile = textValue(candidate ?? {}).toLowerCase();
  const strengths: string[] = [];

  if (profile.includes("admin") || profile.includes("office")) strengths.push("office administration and organised document handling");
  if (profile.includes("customer") || profile.includes("service")) strengths.push("customer-facing communication and service conduct");
  if (profile.includes("computer") || profile.includes("data") || profile.includes("microsoft")) strengths.push("computer literacy and accurate information handling");
  if (profile.includes("retail") || profile.includes("sales")) strengths.push("retail, sales or client-service readiness");
  if (profile.includes("warehouse") || profile.includes("logistics")) strengths.push("warehouse, logistics or operational task discipline");
  if (profile.includes("learnership") || profile.includes("internship")) strengths.push("teachable entry-level growth mindset");
  if (profile.includes("driver") || profile.includes("delivery")) strengths.push("transport, delivery or field-readiness where legally eligible");
  if (profile.includes("security")) strengths.push("safety awareness and controlled environment readiness");

  return strengths.length
    ? strengths
    : [
        "reliability, punctuality and willingness to learn",
        "clear communication and professional conduct",
        "adaptability across entry-level South African work opportunities"
      ];
}

function buildCvDraft(row: ShortlistRow, candidate: CandidateProfile, template: TemplateOption, atsKeywords: string[]): string {
  const candidateName = firstString(candidate, ["fullName", "name", "legalName", "preferredName"], "Candidate");
  const title = rowString(row, "title", "Target Role");
  const company = rowString(row, "company", "Target Company");
  const sector = rowString(row, "sector", "Target Sector");
  const strengths = inferStrengths(candidate);

  return [
    `CV DIRECTION: ${template.name}`,
    ``,
    `Target CV Pair: ${rowString(row, "cvSlot", "CV-01")}`,
    `Candidate: ${candidateName}`,
    `Target role: ${title}`,
    `Target organisation: ${company}`,
    `Sector: ${sector}`,
    ``,
    `HEADLINE`,
    `${candidateName} - ${title} Candidate | ${sector} | Reliable, disciplined and South African work-ready`,
    ``,
    `PROFILE SUMMARY`,
    `Truth-safe draft: I am positioning myself for the ${title} opportunity at ${company}. My CV should present me as dependable, teachable, well-organised and ready to contribute. The final wording must only include skills, experience, education, certificates and achievements that are true and supported by my real profile.`,
    ``,
    `STRENGTHS TO EMPHASISE ONLY IF TRUE`,
    strengths.map((strength) => `- ${strength}`).join("\n"),
    ``,
    `ATS KEYWORDS TO WEAVE IN NATURALLY`,
    atsKeywords.length ? atsKeywords.map((keyword) => `- ${keyword}`).join("\n") : "- Add role keywords after reviewing the job advert.",
    ``,
    `EXPERIENCE POSITIONING`,
    `- Rewrite every previous responsibility so it speaks to the ${title} role without inventing duties.`,
    `- Start bullets with action words such as assisted, organised, supported, handled, communicated, recorded, prepared, maintained, resolved or coordinated.`,
    `- Convert vague duties into proof-based lines only when real proof exists: volume handled, tools used, customers served, documents prepared, stock counted, calls answered, reports created or deadlines met.`,
    `- Remove unrelated noise unless it proves discipline, reliability, communication, teamwork, accuracy or service conduct.`,
    ``,
    `EDUCATION AND CERTIFICATES`,
    `- Keep qualification names truthful and exactly as issued.`,
    `- Include short courses, licences or certificates only if they are real and can be shown when asked.`,
    `- Do not claim a completed qualification that is still in progress.`,
    ``,
    `TEMPLATE RULE`,
    `${template.structure}`,
    ``,
    `TRUTH LOCK`,
    `Never invent experience, qualifications, references, certificates, skills, licences, addresses, employment dates or achievements. If evidence is missing, mark it as missing instead of pretending it exists.`
  ].join("\n");
}

function buildMotivationDraft(row: ShortlistRow, candidate: CandidateProfile, template: TemplateOption, atsKeywords: string[]): string {
  const candidateName = firstString(candidate, ["fullName", "name", "legalName", "preferredName"], "Candidate");
  const title = rowString(row, "title", "the advertised role");
  const company = rowString(row, "company", "your organisation");
  const sector = rowString(row, "sector", "this field");
  const location = rowString(row, "location", "the advertised location");
  const strengths = inferStrengths(candidate).slice(0, 3);

  return [
    `MOTIVATION LETTER DRAFT: ${template.name}`,
    ``,
    `Target Letter Pair: ${rowString(row, "motivationSlot", "ML-01")}`,
    ``,
    `Dear Hiring Team,`,
    ``,
    `I am writing to express my interest in the ${title} opportunity at ${company}. I am drawn to this route because it sits within ${sector}, and I am ready to present myself with discipline, honesty and a willingness to contribute in ${location}.`,
    ``,
    `What I bring is not exaggerated. I bring ${strengths.join(", ")}. I understand that a strong application is not only about wanting the opportunity; it is about showing that I can be trusted, taught, guided and measured against real workplace expectations.`,
    ``,
    `For this role, my CV should be read together with the following strengths: ${atsKeywords.slice(0, 8).join(", ") || "role-relevant strengths to be confirmed from the advert"}. I am prepared to follow instructions, communicate professionally, respect deadlines, and represent myself truthfully throughout the process.`,
    ``,
    `I would appreciate the opportunity to be considered for ${title}. I am available to provide any required documents, confirm my details, and attend the next stage of the process if shortlisted.`,
    ``,
    `Yours faithfully,`,
    `${candidateName}`,
    ``,
    `LETTER SAFETY NOTE`,
    `Before sending, replace any generic line with real proof from the candidate profile. Do not add false work history, false education, false references, false certificates, false licences, or false availability.`
  ].join("\n");
}

function generateApplyPack(row: ShortlistRow, candidate: CandidateProfile, template: TemplateOption, index: number): ApplyPack {
  const title = rowString(row, "title", "Untitled opportunity");
  const company = rowString(row, "company", "Company not captured");
  const sector = rowString(row, "sector", "Unclassified sector");
  const location = rowString(row, "location", "Location not captured");
  const sourceUrl = rowString(row, "sourceUrl", "No source URL captured");
  const band = rowString(row, "band", "RESEARCH_FIRST");
  const score = typeof row.score === "number" ? row.score : 0;
  const cvSlot = rowString(row, "cvSlot", `CV-${String((index % 15) + 1).padStart(2, "0")}`);
  const motivationSlot = rowString(row, "motivationSlot", `ML-${String((index % 15) + 1).padStart(2, "0")}`);
  const atsKeywords = extractAtsKeywords(row, candidate);

  const blockers = [
    sourceUrl === "No source URL captured" ? "Missing source URL: verify the opportunity before applying." : "",
    band === "RESEARCH_FIRST" ? "Research-first band: do not spend a prime application slot before source and fit improve." : "",
    score < 45 ? "Low local score: review fit before generating final documents." : ""
  ].filter(Boolean);

  return {
    id: `PJ04-${Date.now()}-${index + 1}`,
    generated_at: new Date().toISOString(),
    boundary: PERSONAL_JOBS_04_NO_SEND_BOUNDARY,
    source: {
      title,
      company,
      sector,
      location,
      score,
      band,
      sourceUrl
    },
    cvSlot,
    motivationSlot,
    template,
    atsKeywords,
    truthRules: [
      "Never invent experience.",
      "Never invent qualifications.",
      "Never invent references.",
      "Never invent certificates.",
      "Never invent licences.",
      "Never invent achievements.",
      "Use South African compliant, truthful, role-specific wording.",
      "Keep the CV ATS-ready and readable without design tricks."
    ],
    cvDraft: buildCvDraft(row, candidate, template, atsKeywords),
    motivationLetterDraft: buildMotivationDraft(row, candidate, template, atsKeywords),
    preflightChecklist: [
      "Verify official source link before applying.",
      "Confirm closing date, location, salary/stipend if available, and requirements.",
      "Check ID, certificate, proof of address, CV and references only where genuinely required.",
      "Tailor CV headline to the exact role.",
      "Tailor motivation letter opening to the exact organisation.",
      "Remove claims that cannot be proven.",
      "Export pack locally and review manually before any submission."
    ],
    blockers,
    nextAction:
      blockers.length === 0
        ? "Review the draft, improve it with real proof, then prepare the final application manually."
        : "Clear blockers before treating this as an application-ready pack."
  };
}

function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(text);
  }
}

export default function ApplyPackBuilderClient({ candidate }: { candidate: CandidateProfile }) {
  const [rows, setRows] = useState<ShortlistRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateOptions[1].id);
  const [packs, setPacks] = useState<ApplyPack[]>([]);

  useEffect(() => {
    try {
      const rawShortlist = window.localStorage.getItem(PERSONAL_JOBS_03_SHORTLIST_KEY);
      const parsed = rawShortlist ? JSON.parse(rawShortlist) : null;
      setRows(normaliseRows(parsed));

      const rawPacks = window.localStorage.getItem(PERSONAL_JOBS_04_APPLY_PACKS_KEY);
      setPacks(rawPacks ? normalisePacks(JSON.parse(rawPacks)) : []);
    } catch {
      setRows([]);
      setPacks([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const selectedTemplate = useMemo(
    () => templateOptions.find((template) => template.id === selectedTemplateId) ?? templateOptions[1],
    [selectedTemplateId]
  );

  const selectedRow = rows[selectedIndex] ?? rows[0];

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aScore = typeof a.score === "number" ? a.score : 0;
      const bScore = typeof b.score === "number" ? b.score : 0;
      return bScore - aScore;
    });
  }, [rows]);

  function normalisePacks(raw: unknown): ApplyPack[] {
    if (Array.isArray(raw)) return raw.filter((entry): entry is ApplyPack => Boolean(entry && typeof entry === "object"));
    if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).packs)) {
      return ((raw as Record<string, unknown>).packs as unknown[]).filter((entry): entry is ApplyPack => Boolean(entry && typeof entry === "object"));
    }
    return [];
  }

  function savePacks(nextPacks: ApplyPack[]) {
    setPacks(nextPacks);
    window.localStorage.setItem(
      PERSONAL_JOBS_04_APPLY_PACKS_KEY,
      JSON.stringify(
        {
          schema: "kingsmen.personal-jobs-04-apply-packs.v1",
          generated_at: new Date().toISOString(),
          boundary: PERSONAL_JOBS_04_NO_SEND_BOUNDARY,
          source_key: PERSONAL_JOBS_03_SHORTLIST_KEY,
          apply_pack_key: PERSONAL_JOBS_04_APPLY_PACKS_KEY,
          packs: nextPacks
        },
        null,
        2
      )
    );
  }

  function generateSelectedPack() {
    if (!selectedRow) return;
    const pack = generateApplyPack(selectedRow, candidate, selectedTemplate, selectedIndex);
    savePacks([pack, ...packs.filter((existing) => existing.source.title !== pack.source.title || existing.source.company !== pack.source.company)]);
  }

  function generateTopFifteen() {
    const topRows = sortedRows.slice(0, 15);
    const generated = topRows.map((row, index) => {
      const template = templateOptions[index % templateOptions.length];
      return generateApplyPack(row, candidate, template, index);
    });
    savePacks(generated);
  }

  function exportPacks() {
    const payload = {
      schema: "kingsmen.personal-jobs-04-apply-pack-export.v1",
      exported_at: new Date().toISOString(),
      boundary: PERSONAL_JOBS_04_NO_SEND_BOUNDARY,
      packs
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "personal-jobs-04-apply-packs.local.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section style={{ maxWidth: "1260px", margin: "0 auto" }}>
      <header style={{ marginBottom: "26px" }}>
        <p style={{ color: "#d6b25e", letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "12px", fontWeight: 900 }}>
          PERSONAL-JOBS-04 Â· CV & Motivation Letter Atelier
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: 1.05, margin: "8px 0 12px" }}>
          Apply Pack Builder
        </h1>
        <p style={{ maxWidth: "900px", color: "rgba(248,236,208,0.78)", fontSize: "16px", lineHeight: 1.7 }}>
          Build truthful, ATS-ready, South African, role-specific CV and motivation-letter drafts from your local shortlist.
          This is preparation only. It does not send, submit, email, WhatsApp, pay, or contact any employer.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginBottom: "18px" }}>
        {[
          ["Shortlist Rows", rows.length],
          ["Apply Packs", packs.length],
          ["CV Capacity", 15],
          ["Letter Capacity", 15]
        ].map(([label, value]) => (
          <article key={label} style={{ border: "1px solid rgba(214,178,94,0.24)", borderRadius: "22px", padding: "18px", background: "rgba(255,255,255,0.045)" }}>
            <p style={{ margin: 0, color: "rgba(248,236,208,0.62)", fontSize: "12px", textTransform: "uppercase" }}>{label}</p>
            <strong style={{ display: "block", marginTop: "8px", fontSize: "30px", color: "#f8d77a" }}>{value}</strong>
          </article>
        ))}
      </div>

      {!loaded ? (
        <p>Loading local shortlist...</p>
      ) : rows.length === 0 ? (
        <article style={{ border: "1px solid rgba(214,178,94,0.26)", borderRadius: "26px", padding: "24px", background: "rgba(255,255,255,0.045)" }}>
          <h2 style={{ marginTop: 0 }}>No shortlist found yet.</h2>
          <p style={{ color: "rgba(248,236,208,0.72)", lineHeight: 1.7 }}>
            Go to /personal-job-desk/shortlist first. Generate or export a shortlist from captured opportunities, then return here to build apply packs.
          </p>
        </article>
      ) : (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "16px", alignItems: "start", marginBottom: "18px" }}>
            <article style={{ border: "1px solid rgba(214,178,94,0.22)", borderRadius: "26px", padding: "18px", background: "rgba(255,255,255,0.045)" }}>
              <h2 style={{ marginTop: 0 }}>Select opportunity</h2>
              <select
                value={selectedIndex}
                onChange={(event) => setSelectedIndex(Number(event.target.value))}
                style={{
                  width: "100%",
                  borderRadius: "16px",
                  border: "1px solid rgba(214,178,94,0.32)",
                  background: "rgba(0,0,0,0.35)",
                  color: "#f8ecd0",
                  padding: "12px"
                }}
              >
                {rows.map((row, index) => (
                  <option key={`${rowString(row, "title", "row")}-${index}`} value={index}>
                    {rowString(row, "title", "Untitled")} Â· {rowString(row, "company", "Company")} Â· Score {typeof row.score === "number" ? row.score : 0}
                  </option>
                ))}
              </select>

              {selectedRow ? (
                <div style={{ marginTop: "16px", color: "rgba(248,236,208,0.78)", lineHeight: 1.65 }}>
                  <strong style={{ color: "#f8d77a" }}>{rowString(selectedRow, "title", "Untitled opportunity")}</strong>
                  <p>{rowString(selectedRow, "company", "Company not captured")} Â· {rowString(selectedRow, "sector", "Sector not captured")}</p>
                  <p>Band: {rowString(selectedRow, "band", "RESEARCH_FIRST")} Â· Score: {typeof selectedRow.score === "number" ? selectedRow.score : 0}/100</p>
                  <p>Recommended pair: {rowString(selectedRow, "cvSlot", "CV-01")} + {rowString(selectedRow, "motivationSlot", "ML-01")}</p>
                </div>
              ) : null}
            </article>

            <article style={{ border: "1px solid rgba(214,178,94,0.22)", borderRadius: "26px", padding: "18px", background: "rgba(255,255,255,0.045)" }}>
              <h2 style={{ marginTop: 0 }}>Choose template language</h2>
              <div style={{ display: "grid", gap: "10px" }}>
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    style={{
                      textAlign: "left",
                      border: "1px solid rgba(214,178,94,0.24)",
                      borderRadius: "18px",
                      padding: "12px",
                      background: selectedTemplateId === template.id ? "rgba(214,178,94,0.18)" : "rgba(0,0,0,0.22)",
                      color: "#f8ecd0",
                      cursor: "pointer"
                    }}
                  >
                    <strong style={{ color: "#f8d77a" }}>{template.name}</strong>
                    <span style={{ display: "block", color: "rgba(248,236,208,0.68)", marginTop: "4px" }}>{template.bestFor}</span>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", border: "1px solid rgba(214,178,94,0.18)", borderRadius: "20px", padding: "14px", background: "rgba(0,0,0,0.26)" }}>
            <button onClick={generateSelectedPack} style={buttonGold}>
              Generate Selected Apply Pack
            </button>
            <button onClick={generateTopFifteen} style={buttonDark}>
              Generate Top 15 CV + Letter Packs
            </button>
            <button onClick={exportPacks} disabled={packs.length === 0} style={buttonDark}>
              Export Apply Packs JSON
            </button>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            {packs.length === 0 ? (
              <article style={{ border: "1px solid rgba(214,178,94,0.22)", borderRadius: "26px", padding: "20px", background: "rgba(255,255,255,0.045)" }}>
                <h2 style={{ marginTop: 0 }}>No apply packs generated yet.</h2>
                <p style={{ color: "rgba(248,236,208,0.72)", lineHeight: 1.7 }}>
                  Generate one selected pack or build the top 15. Every output remains local and draft-only.
                </p>
              </article>
            ) : (
              packs.map((pack) => (
                <article key={pack.id} style={{ border: "1px solid rgba(214,178,94,0.22)", borderRadius: "26px", padding: "20px", background: "rgba(255,255,255,0.045)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ color: "#d6b25e", margin: "0 0 8px", textTransform: "uppercase", fontWeight: 900, fontSize: "12px" }}>
                        {pack.cvSlot} + {pack.motivationSlot} Â· {pack.template.name}
                      </p>
                      <h2 style={{ margin: 0 }}>{pack.source.title}</h2>
                      <p style={{ color: "rgba(248,236,208,0.7)" }}>{pack.source.company} Â· {pack.source.sector} Â· Score {pack.source.score}/100</p>
                    </div>
                    <strong style={{ color: "#f8d77a" }}>{pack.source.band}</strong>
                  </div>

                  {pack.blockers.length > 0 ? (
                    <div style={{ marginTop: "12px", border: "1px solid rgba(255,190,120,0.26)", borderRadius: "18px", padding: "12px", background: "rgba(255,120,60,0.08)" }}>
                      <strong style={{ color: "#f8d77a" }}>Blockers before sending manually</strong>
                      <ul style={{ color: "rgba(248,236,208,0.76)", lineHeight: 1.55 }}>
                        {pack.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "16px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ color: "#f8d77a" }}>CV Direction</h3>
                        <button onClick={() => copyText(pack.cvDraft)} style={smallButton}>Copy</button>
                      </div>
                      <textarea readOnly value={pack.cvDraft} style={textArea} />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ color: "#f8d77a" }}>Motivation Letter</h3>
                        <button onClick={() => copyText(pack.motivationLetterDraft)} style={smallButton}>Copy</button>
                      </div>
                      <textarea readOnly value={pack.motivationLetterDraft} style={textArea} />
                    </div>
                  </div>

                  <p style={{ marginTop: "14px", color: "rgba(248,236,208,0.58)", fontSize: "12px" }}>
                    Boundary: {pack.boundary}
                  </p>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

const buttonGold = {
  border: "1px solid rgba(214,178,94,0.54)",
  borderRadius: "999px",
  padding: "12px 16px",
  background: "linear-gradient(135deg, rgba(214,178,94,0.28), rgba(214,178,94,0.08))",
  color: "#f8d77a",
  fontWeight: 900,
  cursor: "pointer"
};

const buttonDark = {
  border: "1px solid rgba(248,236,208,0.18)",
  borderRadius: "999px",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  color: "#f8ecd0",
  fontWeight: 850,
  cursor: "pointer"
};

const smallButton = {
  border: "1px solid rgba(214,178,94,0.38)",
  borderRadius: "999px",
  padding: "8px 12px",
  background: "rgba(214,178,94,0.12)",
  color: "#f8d77a",
  fontWeight: 850,
  cursor: "pointer"
};

const textArea = {
  width: "100%",
  minHeight: "360px",
  borderRadius: "18px",
  border: "1px solid rgba(214,178,94,0.18)",
  background: "rgba(0,0,0,0.34)",
  color: "#f8ecd0",
  padding: "14px",
  lineHeight: 1.55,
  resize: "vertical" as const
};