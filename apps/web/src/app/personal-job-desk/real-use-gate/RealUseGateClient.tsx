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

type RouteStep = {
  module: string;
  title: string;
  route: string;
  purpose: string;
  expectedInput: string;
  expectedOutput: string;
  localStorageKey?: string;
  requiredBeforeRealUse: boolean;
};

type GateResult = {
  schema: string;
  generatedAt: string;
  localOnly: boolean;
  noSendBoundary: boolean;
  testedRoutes: Array<{
    module: string;
    route: string;
    openedByUser: boolean;
    dataFound: boolean;
    note: string;
  }>;
  commands: string[];
  readyForRealUse: boolean;
};

const ROUTES: RouteStep[] = [
  {
    module: "PERSONAL-JOBS-01",
    title: "Local Candidate Desk",
    route: "/personal-job-desk",
    purpose: "Load the private local candidate profile and show the campaign desk.",
    expectedInput: "Private local profile file.",
    expectedOutput: "Candidate context ready.",
    requiredBeforeRealUse: true
  },
  {
    module: "PERSONAL-JOBS-02",
    title: "Opportunity Intake",
    route: "/personal-job-desk/opportunities",
    purpose: "Capture outside job leads from Indeed, company portals, LinkedIn, referrals, WhatsApp screenshots, emails, or names heard by the user.",
    expectedInput: "External lead details.",
    expectedOutput: "Local lead list.",
    localStorageKey: "kingsmen.personalJobs02.externalLeads.v1",
    requiredBeforeRealUse: true
  },
  {
    module: "PERSONAL-JOBS-03",
    title: "Fit Scoring & Shortlist",
    route: "/personal-job-desk/shortlist",
    purpose: "Rank captured leads by source confidence, fit, deadline risk, proof quality, and campaign usefulness.",
    expectedInput: "PERSONAL-JOBS-02 lead list.",
    expectedOutput: "Local shortlist.",
    localStorageKey: "kingsmen.personalJobs03.shortlist.v1",
    requiredBeforeRealUse: true
  },
  {
    module: "PERSONAL-JOBS-04",
    title: "CV & Motivation Apply Pack Builder",
    route: "/personal-job-desk/apply-pack",
    purpose: "Create truthful, ATS-ready CV and motivation-letter packs with 15 CV slots and 15 motivation slots.",
    expectedInput: "Shortlisted opportunities.",
    expectedOutput: "Local apply packs.",
    localStorageKey: "kingsmen.personalJobs04.applyPacks.v1",
    requiredBeforeRealUse: true
  },
  {
    module: "PERSONAL-JOBS-05",
    title: "Manual Submission Evidence Ledger",
    route: "/personal-job-desk/submissions",
    purpose: "Track manual submissions, proof references, confirmation numbers, screenshots, and safety notes.",
    expectedInput: "Apply packs and manual submission proof.",
    expectedOutput: "Local submission ledger.",
    localStorageKey: "kingsmen.personalJobs05.submissions.v1",
    requiredBeforeRealUse: true
  },
  {
    module: "PERSONAL-JOBS-06",
    title: "Follow-Up Calendar & Interview Prep",
    route: "/personal-job-desk/follow-up",
    purpose: "Plan follow-ups, response tracking, interview readiness, and manual next actions.",
    expectedInput: "Submission ledger.",
    expectedOutput: "Local follow-up tracker.",
    localStorageKey: "kingsmen.personalJobs06.followUps.v1",
    requiredBeforeRealUse: true
  },
  {
    module: "PERSONAL-JOBS-07",
    title: "Outcome Ledger & Command Dashboard",
    route: "/personal-job-desk/outcomes",
    purpose: "Track interviews, offers, rejections, final decisions, proof, risks, and daily command moves.",
    expectedInput: "Follow-up tracker.",
    expectedOutput: "Local outcome ledger.",
    localStorageKey: "kingsmen.personalJobs07.outcomeLedger.v1",
    requiredBeforeRealUse: true
  }
];

const GATE_KEY = "kingsmen.personalJobs08.realUseGate.v1";

function parseStoredCount(key?: string): number {
  if (!key) return 0;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed.length;
    if (Array.isArray(parsed?.leads)) return parsed.leads.length;
    if (Array.isArray(parsed?.rows)) return parsed.rows.length;
    if (Array.isArray(parsed?.packs)) return parsed.packs.length;
    if (Array.isArray(parsed?.records)) return parsed.records.length;
    if (Array.isArray(parsed?.submissions)) return parsed.submissions.length;
    if (Array.isArray(parsed?.followUps)) return parsed.followUps.length;
    if (Array.isArray(parsed?.outcomes)) return parsed.outcomes.length;
    if (Array.isArray(parsed?.ledger)) return parsed.ledger.length;
    if (Array.isArray(parsed?.items)) return parsed.items.length;

    return Object.keys(parsed || {}).length > 0 ? 1 : 0;
  } catch {
    return 0;
  }
}

function buildCommands(counts: Record<string, number>): string[] {
  const commands: string[] = [];

  if ((counts["kingsmen.personalJobs02.externalLeads.v1"] || 0) < 5) {
    commands.push("Add more job leads before trusting the campaign. A tiny lead pool gives weak choice and weak speed.");
  }

  if ((counts["kingsmen.personalJobs03.shortlist.v1"] || 0) === 0) {
    commands.push("Run shortlist scoring so the system knows which routes deserve attention first.");
  }

  if ((counts["kingsmen.personalJobs04.applyPacks.v1"] || 0) === 0) {
    commands.push("Build at least one CV and motivation apply pack before manual submission.");
  }

  if ((counts["kingsmen.personalJobs05.submissions.v1"] || 0) === 0) {
    commands.push("Do not claim applications were sent. Record manual submission proof after each real application.");
  }

  if ((counts["kingsmen.personalJobs06.followUps.v1"] || 0) === 0) {
    commands.push("Create follow-up dates after submission so opportunities do not go cold.");
  }

  if ((counts["kingsmen.personalJobs07.outcomeLedger.v1"] || 0) === 0) {
    commands.push("Open the outcome dashboard after responses start arriving so interviews, offers, and rejections are not lost.");
  }

  if (commands.length === 0) {
    commands.push("The local campaign chain has data across the main gates. Continue applying, capturing proof, following up, and deciding safely.");
  }

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

export default function RealUseGateClient({
  initialProfile
}: {
  initialProfile: SafePersonalProfile;
}) {
  const [openedRoutes, setOpenedRoutes] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [lastGate, setLastGate] = useState<GateResult | null>(null);
  const [copied, setCopied] = useState(false);

  function refreshCounts(): void {
    const nextCounts: Record<string, number> = {};
    for (const route of ROUTES) {
      if (route.localStorageKey) {
        nextCounts[route.localStorageKey] = parseStoredCount(route.localStorageKey);
      }
    }
    setCounts(nextCounts);
  }

  useEffect(() => {
    refreshCounts();

    try {
      const saved = localStorage.getItem(GATE_KEY);
      if (saved) setLastGate(JSON.parse(saved));
    } catch {
      setLastGate(null);
    }
  }, []);

  const commands = useMemo(() => buildCommands(counts), [counts]);

  const completion = useMemo(() => {
    const dataSteps = ROUTES.filter((route) => route.localStorageKey);
    const withData = dataSteps.filter((route) => (counts[route.localStorageKey || ""] || 0) > 0).length;
    return {
      withData,
      totalDataSteps: dataSteps.length,
      percentage: dataSteps.length === 0 ? 0 : Math.round((withData / dataSteps.length) * 100)
    };
  }, [counts]);

  function markOpened(route: RouteStep): void {
    setOpenedRoutes((current) => ({
      ...current,
      [route.route]: true
    }));
  }

  function runGate(): void {
    refreshCounts();

    const testedRoutes = ROUTES.map((route) => {
      const dataFound = route.localStorageKey ? parseStoredCount(route.localStorageKey) > 0 : true;

      return {
        module: route.module,
        route: route.route,
        openedByUser: openedRoutes[route.route] === true,
        dataFound,
        note: route.localStorageKey
          ? dataFound
            ? "Local browser data found."
            : "No local browser data found yet."
          : "Route is a profile or navigation starting point."
      };
    });

    const nextCounts: Record<string, number> = {};
    for (const route of ROUTES) {
      if (route.localStorageKey) {
        nextCounts[route.localStorageKey] = parseStoredCount(route.localStorageKey);
      }
    }

    const nextCommands = buildCommands(nextCounts);
    const readyForRealUse =
      testedRoutes.every((row) => row.dataFound || row.module === "PERSONAL-JOBS-01") &&
      nextCommands.length === 1 &&
      nextCommands[0].startsWith("The local campaign chain has data");

    const gateResult: GateResult = {
      schema: "kingsmen.personal-jobs-08-real-use-gate.v1",
      generatedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      testedRoutes,
      commands: nextCommands,
      readyForRealUse
    };

    localStorage.setItem(GATE_KEY, JSON.stringify(gateResult, null, 2));
    setCounts(nextCounts);
    setLastGate(gateResult);
  }

  function exportGate(): void {
    const payload =
      lastGate ||
      ({
        schema: "kingsmen.personal-jobs-08-real-use-gate-export.v1",
        generatedAt: new Date().toISOString(),
        localOnly: true,
        noSendBoundary: true,
        message: "Gate has not been run yet."
      } as const);

    exportJson("personal-jobs-08-real-use-gate.local.json", payload);
  }

  async function copyGateReport(): Promise<void> {
    const payload = lastGate || {
      schema: "kingsmen.personal-jobs-08-real-use-gate-copy.v1",
      generatedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      message: "Gate has not been run yet."
    };

    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section
      data-kingsmen-personal-jobs-08-navigation-hub="true"
      data-kingsmen-personal-jobs-08-no-send="true"
      style={{ display: "grid", gap: "18px" }}
    >
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Campaign profile</p>
        <h2 style={{ margin: "8px 0 8px", fontSize: "30px", color: "#f8d77a" }}>
          {initialProfile.fullName || "Local candidate"} · {initialProfile.targetRole || "Job seeker"}
        </h2>
        <p style={{ margin: 0, color: "rgba(248,237,210,0.74)", lineHeight: 1.7 }}>
          {initialProfile.headline || "Use this gate before real applications. Move from leads to shortlist to apply packs to proof to follow-up to outcomes."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginTop: "16px" }}>
          <article style={cardStyle}>
            <span style={smallLabelStyle}>Data readiness</span>
            <strong style={metricStyle}>{completion.percentage}%</strong>
          </article>
          <article style={cardStyle}>
            <span style={smallLabelStyle}>Data gates active</span>
            <strong style={metricStyle}>{completion.withData}/{completion.totalDataSteps}</strong>
          </article>
          <article style={cardStyle}>
            <span style={smallLabelStyle}>Local boundary</span>
            <strong style={metricStyle}>No send</strong>
          </article>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p style={eyebrowStyle}>Navigation hub</p>
            <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>Open every desk in campaign order</h2>
          </div>
          <button type="button" onClick={refreshCounts} style={buttonStyle}>
            Refresh local counts
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "14px", marginTop: "16px" }}>
          {ROUTES.map((route, index) => {
            const count = route.localStorageKey ? counts[route.localStorageKey] || 0 : null;
            const opened = openedRoutes[route.route] === true;

            return (
              <a
                key={route.module}
                href={route.route}
                target="_self"
                onClick={() => markOpened(route)}
                style={{
                  ...routeCardStyle,
                  textDecoration: "none"
                }}
              >
                <span style={smallLabelStyle}>Step {index + 1} · {route.module}</span>
                <strong style={{ display: "block", marginTop: "8px", color: "#f8d77a", fontSize: "18px" }}>{route.title}</strong>
                <span style={{ display: "block", marginTop: "8px", color: "rgba(248,237,210,0.72)", lineHeight: 1.55 }}>
                  {route.purpose}
                </span>
                <span style={{ display: "block", marginTop: "12px", color: opened ? "#f8d77a" : "rgba(248,237,210,0.58)", fontWeight: 900 }}>
                  {opened ? "Opened this session" : "Click to open"}
                  {count !== null ? ` · ${count} local row(s)` : ""}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Real use smoke gate</p>
        <h2 style={{ margin: "8px 0 10px", fontSize: "28px" }}>Today's command before real applications</h2>

        <ol style={{ margin: 0, paddingLeft: "22px", color: "rgba(248,237,210,0.82)", lineHeight: 1.75 }}>
          {commands.map((command) => (
            <li key={command}>{command}</li>
          ))}
        </ol>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button type="button" onClick={runGate} style={buttonStyle}>Run local smoke gate</button>
          <button type="button" onClick={exportGate} style={buttonStyle}>Export gate report</button>
          <button type="button" onClick={copyGateReport} style={buttonStyle}>{copied ? "Copied" : "Copy gate JSON"}</button>
        </div>
      </section>

      {lastGate ? (
        <section style={panelStyle}>
          <p style={eyebrowStyle}>Latest gate result</p>
          <h2 style={{ margin: "8px 0 10px", color: lastGate.readyForRealUse ? "#f8d77a" : "#f0bd68" }}>
            {lastGate.readyForRealUse ? "Local chain has data across the main gates" : "More local campaign work is needed"}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
              <thead>
                <tr>
                  {["Module", "Route", "Opened", "Data", "Note"].map((header) => (
                    <th key={header} style={thStyle}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lastGate.testedRoutes.map((row) => (
                  <tr key={row.module}>
                    <td style={tdStyle}>{row.module}</td>
                    <td style={tdStyle}>{row.route}</td>
                    <td style={tdStyle}>{row.openedByUser ? "Yes" : "Not marked"}</td>
                    <td style={tdStyle}>{row.dataFound ? "Found" : "Missing"}</td>
                    <td style={tdStyle}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section style={warningStyle}>
        <strong>Local boundary:</strong> PERSONAL-JOBS-08 does not send applications, send email, send WhatsApp,
        contact employers, touch payments, sync calendars, start Docker, or claim Oracle/production readiness.
        It is a local real-use gate for disciplined manual job applications with proof.
      </section>
    </section>
  );
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.2)",
  borderRadius: "28px",
  padding: "20px",
  background: "rgba(0,0,0,0.23)"
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.18)",
  borderRadius: "20px",
  padding: "16px",
  background: "rgba(255,255,255,0.035)"
};

const routeCardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.2)",
  borderRadius: "22px",
  padding: "17px",
  background: "rgba(255,255,255,0.04)",
  color: "#f8edd2",
  boxShadow: "0 16px 45px rgba(0,0,0,0.2)"
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
  fontSize: "28px",
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

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "11px",
  color: "#d6b25e",
  borderBottom: "1px solid rgba(214,178,94,0.22)",
  fontSize: "12px",
  textTransform: "uppercase"
};

const tdStyle: CSSProperties = {
  padding: "11px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(248,237,210,0.76)",
  fontSize: "14px"
};