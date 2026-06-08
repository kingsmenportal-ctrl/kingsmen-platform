"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { PersonalJobs12SafeProfile } from "./page";

type SourceDefinition = {
  id: string;
  name: string;
  homeUrl: string;
  sourceType: "job_board" | "professional_network" | "company_career_search" | "public_search";
  directSearch: boolean;
  trustBand: "KNOWN_PUBLIC_SOURCE" | "USER_REVIEW_REQUIRED";
  instruction: string;
};

type SourceMission = {
  id: string;
  sourceId: string;
  sourceName: string;
  url: string;
  searchText: string;
  locationText: string;
  verificationChecklist: string[];
  openedAt?: string;
  status: "READY" | "OPENED" | "REVIEWED" | "CAPTURED";
};

type CapturedLead = {
  id: string;
  capturedAt: string;
  importedBy: "PERSONAL-JOBS-12";
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  sourceName: string;
  sourceRunnerSessionId: string;
  sourceConfidence: "high" | "medium" | "low";
  verificationStatus: "source_reviewed_by_user";
  leadQuality: "verified_candidate_capture" | "research_first";
  status: "captured";
  notes: string;
  nextAction: string;
};

const SESSION_KEY = "kingsmen.personalJobs12.sourceRunnerSessions.v1";
const PJ02_LEADS_KEY = "kingsmen.personalJobs02.externalLeads.v1";

const SOURCES: SourceDefinition[] = [
  {
    id: "indeed-za",
    name: "Indeed South Africa",
    homeUrl: "https://za.indeed.com/",
    sourceType: "job_board",
    directSearch: true,
    trustBand: "KNOWN_PUBLIC_SOURCE",
    instruction: "Use direct search. Open the result page, inspect listings manually, then capture only real opportunities."
  },
  {
    id: "pnet-za",
    name: "PNet South Africa",
    homeUrl: "https://www.pnet.co.za/",
    sourceType: "job_board",
    directSearch: false,
    trustBand: "KNOWN_PUBLIC_SOURCE",
    instruction: "Open PNet, search manually using the prepared phrase, then capture only listings with a visible employer/source."
  },
  {
    id: "careers24-za",
    name: "Careers24",
    homeUrl: "https://www.careers24.com/",
    sourceType: "job_board",
    directSearch: false,
    trustBand: "KNOWN_PUBLIC_SOURCE",
    instruction: "Open Careers24, search manually, then capture only listings with enough role, company, location, and source detail."
  },
  {
    id: "careerjunction-za",
    name: "CareerJunction",
    homeUrl: "https://www.careerjunction.co.za/",
    sourceType: "job_board",
    directSearch: false,
    trustBand: "KNOWN_PUBLIC_SOURCE",
    instruction: "Open CareerJunction and search manually. Capture only opportunities that can be reviewed again later."
  },
  {
    id: "company-careers-search",
    name: "Company Career Pages",
    homeUrl: "https://www.google.com/search",
    sourceType: "company_career_search",
    directSearch: true,
    trustBand: "USER_REVIEW_REQUIRED",
    instruction: "Use this to find direct company career pages. Prefer official company domains over reposted adverts."
  }
];

function safeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function encode(value: string): string {
  return encodeURIComponent(value.trim());
}

function buildSourceUrl(source: SourceDefinition, keywords: string, location: string): string {
  const q = encode(keywords || "jobs");
  const l = encode(location || "South Africa");

  if (source.id === "indeed-za") {
    return `https://za.indeed.com/jobs?q=${q}&l=${l}`;
  }

  if (source.id === "company-careers-search") {
    return `https://www.google.com/search?q=${encode(`${keywords} careers jobs ${location} official company vacancies`)}`;
  }

  return source.homeUrl;
}

function verificationChecklistFor(source: SourceDefinition): string[] {
  const base = [
    "Role title is visible.",
    "Company or recruiter name is visible.",
    "Location or remote status is visible.",
    "Source URL can be reopened later.",
    "No upfront fee, deposit, paid training promise, or suspicious payment request.",
    "No private-only WhatsApp process unless backed by an official company/source page."
  ];

  if (source.sourceType === "company_career_search") {
    return [
      "Prefer official company career page or official domain.",
      "Avoid reposts that hide the employer.",
      ...base
    ];
  }

  return base;
}

function buildMissions(keywords: string, location: string, selectedSourceIds: string[]): SourceMission[] {
  const sources = SOURCES.filter((source) => selectedSourceIds.includes(source.id));

  return sources.map((source) => ({
    id: safeId("pj12-mission"),
    sourceId: source.id,
    sourceName: source.name,
    url: buildSourceUrl(source, keywords, location),
    searchText: keywords,
    locationText: location,
    verificationChecklist: verificationChecklistFor(source),
    status: "READY"
  }));
}

function readExistingLeads(): CapturedLead[] {
  try {
    const raw = localStorage.getItem(PJ02_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed as CapturedLead[];
    if (Array.isArray(parsed?.leads)) return parsed.leads as CapturedLead[];
    if (Array.isArray(parsed?.items)) return parsed.items as CapturedLead[];
    if (Array.isArray(parsed?.rows)) return parsed.rows as CapturedLead[];

    return [];
  } catch {
    return [];
  }
}

function fingerprint(lead: Partial<CapturedLead>): string {
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

export default function SourceRunnerClient({ initialProfile }: { initialProfile: PersonalJobs12SafeProfile }) {
  const [keywords, setKeywords] = useState(initialProfile.targetRole || "admin assistant");
  const [location, setLocation] = useState(initialProfile.location || "South Africa");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(SOURCES.map((source) => source.id));
  const [missions, setMissions] = useState<SourceMission[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [pj02Count, setPj02Count] = useState(0);
  const [copied, setCopied] = useState(false);

  const [leadTitle, setLeadTitle] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadLocation, setLeadLocation] = useState(initialProfile.location || "South Africa");
  const [leadUrl, setLeadUrl] = useState("");
  const [leadSourceName, setLeadSourceName] = useState("");
  const [leadNotes, setLeadNotes] = useState("");

  function refreshCounts(): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const sessions = raw ? JSON.parse(raw) : [];
      setSessionCount(Array.isArray(sessions) ? sessions.length : 0);
    } catch {
      setSessionCount(0);
    }

    setPj02Count(readExistingLeads().length);
  }

  useEffect(() => {
    refreshCounts();
  }, []);

  const selectedSources = useMemo(() => SOURCES.filter((source) => selectedSourceIds.includes(source.id)), [selectedSourceIds]);

  function toggleSource(sourceId: string): void {
    setSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId]
    );
  }

  function createMissions(): void {
    const nextMissions = buildMissions(keywords, location, selectedSourceIds);
    setMissions(nextMissions);
    const sessionId = safeId("pj12-session");
    setActiveSessionId(sessionId);

    const session = {
      schema: "kingsmen.personal-jobs-12-source-runner-session.v1",
      sessionId,
      createdAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      keywords,
      location,
      missions: nextMissions,
      sourceCount: nextMissions.length
    };

    const raw = localStorage.getItem(SESSION_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(existing) ? [session, ...existing].slice(0, 50) : [session];

    localStorage.setItem(SESSION_KEY, JSON.stringify(next, null, 2));
    refreshCounts();
  }

  function openMission(mission: SourceMission): void {
    window.open(mission.url, "_blank", "noopener,noreferrer");

    setMissions((current) =>
      current.map((item) =>
        item.id === mission.id
          ? { ...item, status: "OPENED", openedAt: new Date().toISOString() }
          : item
      )
    );
  }

  function markMissionReviewed(missionId: string): void {
    setMissions((current) =>
      current.map((item) =>
        item.id === missionId ? { ...item, status: "REVIEWED" } : item
      )
    );
  }

  function useMissionForCapture(mission: SourceMission): void {
    setLeadSourceName(mission.sourceName);
    setLeadLocation(mission.locationText);
    setLeadUrl(mission.url);
  }

  function captureLeadToPj02(): void {
    const existing = readExistingLeads();

    const lead: CapturedLead = {
      id: safeId("pj12-lead"),
      capturedAt: new Date().toISOString(),
      importedBy: "PERSONAL-JOBS-12",
      title: leadTitle.trim() || "Captured job lead",
      company: leadCompany.trim() || "Unknown company",
      location: leadLocation.trim() || location,
      sourceUrl: leadUrl.trim(),
      sourceName: leadSourceName.trim() || "Source runner",
      sourceRunnerSessionId: activeSessionId || "manual-source-run",
      sourceConfidence: leadUrl.trim() ? "high" : "medium",
      verificationStatus: "source_reviewed_by_user",
      leadQuality: leadUrl.trim() ? "verified_candidate_capture" : "research_first",
      status: "captured",
      notes: leadNotes.trim(),
      nextAction: "Score in PERSONAL-JOBS-03, then build an apply pack if the route is strong."
    };

    const existingFingerprints = new Set(existing.map(fingerprint));
    if (existingFingerprints.has(fingerprint(lead))) {
      window.alert("Possible duplicate already exists in PJ02. Review before adding again.");
      return;
    }

    localStorage.setItem(PJ02_LEADS_KEY, JSON.stringify([lead, ...existing], null, 2));

    setLeadTitle("");
    setLeadCompany("");
    setLeadUrl("");
    setLeadNotes("");
    refreshCounts();
  }

  async function copyMissionPack(): Promise<void> {
    const payload = {
      schema: "kingsmen.personal-jobs-12-source-mission-copy.v1",
      copiedAt: new Date().toISOString(),
      keywords,
      location,
      localOnly: true,
      noSendBoundary: true,
      missions
    };

    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section data-kingsmen-personal-jobs-12-source-runner="true" data-kingsmen-personal-jobs-12-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Source runner officer</p>
        <h2 style={{ margin: "8px 0", color: "#f8d77a", fontSize: "31px" }}>
          {initialProfile.fullName} Â· {initialProfile.targetRole}
        </h2>
        <p style={{ margin: 0, color: "rgba(248,237,210,0.74)", lineHeight: 1.7 }}>
          {initialProfile.priority}
        </p>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Search mission</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>Choose sources and build a search run</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" }}>
          <label style={cardStyle}>
            <span style={smallLabelStyle}>Role keywords</span>
            <input value={keywords} onChange={(event) => setKeywords(event.target.value)} style={inputStyle} />
          </label>

          <label style={cardStyle}>
            <span style={smallLabelStyle}>Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} style={inputStyle} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px", marginTop: "14px" }}>
          {SOURCES.map((source) => {
            const checked = selectedSourceIds.includes(source.id);

            return (
              <button key={source.id} type="button" onClick={() => toggleSource(source.id)} style={sourceCardStyle(checked)}>
                <span style={smallLabelStyle}>{source.trustBand}</span>
                <strong style={{ display: "block", color: "#f8d77a", marginTop: "8px", fontSize: "18px" }}>{source.name}</strong>
                <span style={{ display: "block", marginTop: "8px", color: "rgba(248,237,210,0.66)", lineHeight: 1.5 }}>
                  {source.instruction}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
          <button type="button" onClick={createMissions} style={buttonStyle}>Create source run</button>
          <button type="button" onClick={copyMissionPack} style={buttonStyle}>{copied ? "Copied" : "Copy mission JSON"}</button>
          <button type="button" onClick={() => exportJson("personal-jobs-12-source-runner.local.json", { keywords, location, missions })} style={buttonStyle}>Export mission JSON</button>
          <a href="/personal-job-desk/import-search" style={buttonLinkStyle}>Open PJ11 import desk</a>
          <a href="/personal-job-desk/opportunities" style={buttonLinkStyle}>Open PJ02 leads</a>
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Runner readings</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginTop: "10px" }}>
          <article style={cardStyle}><span style={smallLabelStyle}>Selected sources</span><strong style={metricStyle}>{selectedSources.length}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Current missions</span><strong style={metricStyle}>{missions.length}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Saved sessions</span><strong style={metricStyle}>{sessionCount}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>PJ02 lead count</span><strong style={metricStyle}>{pj02Count}</strong></article>
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Mission deck</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>Open, review, then capture only real opportunities</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          {missions.length === 0 ? (
            <article style={warningStyle}>Create a source run first. This desk opens source pages; it does not harvest listings automatically.</article>
          ) : (
            missions.map((mission) => (
              <article key={mission.id} style={missionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ maxWidth: "820px" }}>
                    <span style={smallLabelStyle}>{mission.status} Â· {mission.sourceName}</span>
                    <h3 style={{ margin: "7px 0", color: "#f8d77a", fontSize: "22px" }}>{mission.searchText} Â· {mission.locationText}</h3>
                    <p style={{ margin: 0, color: "rgba(248,237,210,0.72)", lineHeight: 1.6 }}>
                      {mission.url}
                    </p>

                    <ul style={{ margin: "10px 0 0", paddingLeft: "20px", color: "rgba(248,237,210,0.68)", lineHeight: 1.6 }}>
                      {mission.verificationChecklist.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={() => openMission(mission)} style={buttonStyle}>Open source</button>
                    <button type="button" onClick={() => markMissionReviewed(mission.id)} style={buttonStyle}>Mark reviewed</button>
                    <button type="button" onClick={() => useMissionForCapture(mission)} style={buttonStyle}>Use for capture</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Verified lead capture</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>Capture a lead after you inspect the source</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" }}>
          <label style={cardStyle}><span style={smallLabelStyle}>Job title</span><input value={leadTitle} onChange={(event) => setLeadTitle(event.target.value)} style={inputStyle} /></label>
          <label style={cardStyle}><span style={smallLabelStyle}>Company</span><input value={leadCompany} onChange={(event) => setLeadCompany(event.target.value)} style={inputStyle} /></label>
          <label style={cardStyle}><span style={smallLabelStyle}>Location</span><input value={leadLocation} onChange={(event) => setLeadLocation(event.target.value)} style={inputStyle} /></label>
          <label style={cardStyle}><span style={smallLabelStyle}>Source name</span><input value={leadSourceName} onChange={(event) => setLeadSourceName(event.target.value)} style={inputStyle} /></label>
        </div>

        <label style={{ ...cardStyle, display: "block", marginTop: "12px" }}>
          <span style={smallLabelStyle}>Source URL</span>
          <input value={leadUrl} onChange={(event) => setLeadUrl(event.target.value)} style={inputStyle} />
        </label>

        <label style={{ ...cardStyle, display: "block", marginTop: "12px" }}>
          <span style={smallLabelStyle}>Verification notes</span>
          <textarea value={leadNotes} onChange={(event) => setLeadNotes(event.target.value)} style={textareaStyle} placeholder="What did you verify? Employer name, deadline, no fee, requirements, location, official source, salary/stipend if visible." />
        </label>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
          <button type="button" onClick={captureLeadToPj02} style={buttonStyle}>Capture verified lead to PJ02</button>
          <a href="/personal-job-desk/shortlist" style={buttonLinkStyle}>Score in PJ03</a>
          <a href="/personal-job-desk/daily-loop" style={buttonLinkStyle}>Run daily loop</a>
        </div>
      </section>

      <section style={warningStyle}>
        <strong>Hard boundary:</strong> PERSONAL-JOBS-12 opens real source pages under your control and stores source-run sessions locally. It does not contact employers.
        It does not auto-submit applications, send messages, contact employers, process payments, use secrets, run background bots,
        extract website content automatically, deploy to Oracle, or claim production readiness.
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

const missionCardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.22)",
  borderRadius: "22px",
  padding: "17px",
  background: "linear-gradient(135deg, rgba(214,178,94,0.10), rgba(255,255,255,0.035))"
};

function sourceCardStyle(active: boolean): CSSProperties {
  return {
    textAlign: "left",
    border: active ? "1px solid rgba(214,178,94,0.70)" : "1px solid rgba(214,178,94,0.18)",
    borderRadius: "22px",
    padding: "17px",
    background: active ? "rgba(214,178,94,0.12)" : "rgba(255,255,255,0.035)",
    color: "#f8edd2",
    cursor: "pointer"
  };
}

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
  minHeight: "130px",
  marginTop: "9px",
  border: "1px solid rgba(214,178,94,0.28)",
  borderRadius: "16px",
  padding: "13px",
  background: "rgba(0,0,0,0.30)",
  color: "#f8edd2",
  fontWeight: 700,
  fontSize: "15px",
  lineHeight: 1.6,
  resize: "vertical"
};