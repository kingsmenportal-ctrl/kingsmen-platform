"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const PERSONAL_JOBS_15_RUNTIME_CLICK_TEST = true;
const PJ15_VISIT_KEY = "kingsmen.personalJobs15.runtimeClickTestVisits.v1";
const PJ15_MANUAL_CHECK_KEY = "kingsmen.personalJobs15.manualClickChecklist.v1";

type RouteTarget = {
  id: string;
  title: string;
  href: string;
  group: string;
  expectedUse: string;
  boundary: string;
};

const TARGET_ROUTES: RouteTarget[] = [
  {
    id: "PJ01",
    title: "Local Candidate Profile",
    href: "/personal-job-desk",
    group: "Core",
    expectedUse: "Open the local personal job desk entry point.",
    boundary: "Local profile view only."
  },
  {
    id: "PJ02",
    title: "Opportunity Intake",
    href: "/personal-job-desk/opportunities",
    group: "Lead capture",
    expectedUse: "Add or review local external job leads.",
    boundary: "No automatic verification or application."
  },
  {
    id: "PJ03",
    title: "Shortlist",
    href: "/personal-job-desk/shortlist",
    group: "Decision",
    expectedUse: "Score and prioritize captured opportunities.",
    boundary: "Local heuristic scoring only."
  },
  {
    id: "PJ04",
    title: "Apply Pack Builder",
    href: "/personal-job-desk/apply-pack",
    group: "Application pack",
    expectedUse: "Prepare CV and motivation-letter application packs.",
    boundary: "Does not send applications."
  },
  {
    id: "PJ05",
    title: "Submission Tracker",
    href: "/personal-job-desk/submissions",
    group: "Proof",
    expectedUse: "Record manual submission proof.",
    boundary: "Proof ledger only."
  },
  {
    id: "PJ06",
    title: "Follow-Up Tracker",
    href: "/personal-job-desk/follow-up",
    group: "Follow-up",
    expectedUse: "Track follow-ups, interviews, and response actions.",
    boundary: "No external calendar sync."
  },
  {
    id: "PJ07",
    title: "Outcome Ledger",
    href: "/personal-job-desk/outcomes",
    group: "Outcome",
    expectedUse: "Record outcomes, offers, rejections, and decisions.",
    boundary: "Local outcome ledger only."
  },
  {
    id: "PJ08",
    title: "Real Use Gate",
    href: "/personal-job-desk/real-use-gate",
    group: "Runtime",
    expectedUse: "Check the expanded real-use gate.",
    boundary: "Local runtime gate only."
  },
  {
    id: "PJ10",
    title: "Daily Operating Loop",
    href: "/personal-job-desk/daily-loop",
    group: "Daily rhythm",
    expectedUse: "Run the day-by-day job campaign command loop.",
    boundary: "No employer contact."
  },
  {
    id: "PJ11",
    title: "Import Search",
    href: "/personal-job-desk/import-search",
    group: "Import",
    expectedUse: "Paste job results and convert them to local leads.",
    boundary: "No internet scraping."
  },
  {
    id: "PJ12",
    title: "Source Runner",
    href: "/personal-job-desk/source-runner",
    group: "Verified lead finder",
    expectedUse: "Open trusted sources under user control and capture verified leads.",
    boundary: "No background bots or auto-submit."
  },
  {
    id: "PJ13",
    title: "Normalizer",
    href: "/personal-job-desk/normalizer",
    group: "Repair",
    expectedUse: "Normalize imported leads into the exact PJ02 shape.",
    boundary: "LocalStorage repair with backup."
  },
  {
    id: "PJ14",
    title: "Navigation Hub",
    href: "/personal-job-desk/navigation",
    group: "Navigation",
    expectedUse: "Use the complete personal job desk navigation hub.",
    boundary: "Navigation only."
  },
  {
    id: "PJ15",
    title: "Runtime Click Test",
    href: "/personal-job-desk/runtime-click-test",
    group: "Runtime",
    expectedUse: "Use this local UI smoke gate.",
    boundary: "Runtime click proof only."
  }
];

function readManualChecklist(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PJ15_MANUAL_CHECK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVisit(): void {
  const visit = {
    schema: "kingsmen.personal-jobs-15-runtime-click-test-visit.v1",
    visitedAt: new Date().toISOString(),
    route: "/personal-job-desk/runtime-click-test",
    localOnly: true,
    noSendBoundary: true,
    routeCount: TARGET_ROUTES.length
  };

  try {
    const raw = localStorage.getItem(PJ15_VISIT_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(existing) ? [visit, ...existing].slice(0, 30) : [visit];
    localStorage.setItem(PJ15_VISIT_KEY, JSON.stringify(next, null, 2));
  } catch {
    localStorage.setItem(PJ15_VISIT_KEY, JSON.stringify([visit], null, 2));
  }
}

export default function RuntimeClickTestClient() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    writeVisit();
    setChecked(readManualChecklist());

    try {
      const visits = JSON.parse(localStorage.getItem(PJ15_VISIT_KEY) || "[]");
      setVisitCount(Array.isArray(visits) ? visits.length : 0);
    } catch {
      setVisitCount(0);
    }
  }, []);

  const checkedCount = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const progress = Math.round((checkedCount / TARGET_ROUTES.length) * 100);
  const groups = Array.from(new Set(TARGET_ROUTES.map((route) => route.group)));

  function toggle(routeId: string): void {
    const next = { ...checked, [routeId]: !checked[routeId] };
    setChecked(next);
    localStorage.setItem(PJ15_MANUAL_CHECK_KEY, JSON.stringify(next, null, 2));
  }

  function resetChecklist(): void {
    setChecked({});
    localStorage.removeItem(PJ15_MANUAL_CHECK_KEY);
  }

  return (
    <section data-kingsmen-personal-jobs-15-runtime-click-test="true" data-kingsmen-personal-jobs-15-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Runtime status</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginTop: "10px" }}>
          <article style={cardStyle}><span style={smallLabelStyle}>Routes listed</span><strong style={metricStyle}>{TARGET_ROUTES.length}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Manually checked</span><strong style={metricStyle}>{checkedCount}</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>Manual progress</span><strong style={metricStyle}>{progress}%</strong></article>
          <article style={cardStyle}><span style={smallLabelStyle}>PJ15 visits</span><strong style={metricStyle}>{visitCount}</strong></article>
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Manual click order</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>Open every route once</h2>
        <p style={{ margin: "0 0 16px", color: "rgba(248,237,210,0.74)", lineHeight: 1.7 }}>
          Click each route, confirm it loads, then come back and mark it checked. The proof script also performs a local HTTP smoke test against the running Next.js server.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          <a href="/personal-job-desk/navigation" style={buttonLinkStyle}>Open navigation hub</a>
          <a href="/personal-job-desk/real-use-gate" style={buttonLinkStyle}>Open real-use gate</a>
          <button type="button" onClick={resetChecklist} style={buttonStyle}>Reset checklist</button>
        </div>

        {groups.map((group) => (
          <div key={group} style={{ marginTop: "18px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#f8d77a" }}>{group}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              {TARGET_ROUTES.filter((route) => route.group === group).map((route) => (
                <article key={route.id} style={routeCardStyle}>
                  <span style={smallLabelStyle}>{route.id}</span>
                  <h4 style={{ margin: "7px 0", color: "#f8d77a", fontSize: "20px" }}>{route.title}</h4>
                  <p style={{ margin: 0, color: "rgba(248,237,210,0.70)", lineHeight: 1.55 }}>{route.expectedUse}</p>
                  <p style={{ margin: "8px 0 14px", color: "rgba(248,237,210,0.56)", lineHeight: 1.45 }}>{route.boundary}</p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <a href={route.href} style={buttonLinkStyle}>Open route</a>
                    <button type="button" onClick={() => toggle(route.id)} style={buttonStyle}>
                      {checked[route.id] ? "Checked" : "Mark checked"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section style={warningStyle}>
        <strong>Hard boundary:</strong> PERSONAL-JOBS-15 is a local runtime click test and smoke gate. It does not search the internet, scrape websites, send applications, send email, send WhatsApp, contact employers, touch payments, sync calendars, start Docker, deploy to Oracle, or claim production readiness.
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

const routeCardStyle: CSSProperties = {
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