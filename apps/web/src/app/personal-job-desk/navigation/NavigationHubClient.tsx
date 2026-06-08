"use client";

import * as React from "react";

const PERSONAL_JOBS_14_NAVIGATION_EXPANSION = true;
const NO_SEND_BOUNDARY = "LOCAL_NAVIGATION_ONLY_NO_SEND_NO_CONTACT_NO_PAYMENT";

type NavigationVariant = "hub" | "gate";

type RouteItem = {
  id: string;
  title: string;
  href: string;
  stage: string;
  purpose: string;
  primaryAction: string;
  localKeys: string[];
  boundary: string;
};

const ROUTES: RouteItem[] = [
  {
    id: "PJ01",
    title: "Local Candidate Profile",
    href: "/personal-job-desk",
    stage: "Profile",
    purpose: "Holds the first local candidate profile and private job-search desk entry point.",
    primaryAction: "Review candidate readiness",
    localKeys: [],
    boundary: "Local-only profile surface; no production claim."
  },
  {
    id: "PJ02",
    title: "External Opportunity Intake",
    href: "/personal-job-desk/opportunities",
    stage: "Lead capture",
    purpose: "Add jobs heard from outside Kingsmen: Facebook posts, friends, company names, WhatsApp rumours, email leads, walk-ins, or direct links.",
    primaryAction: "Add or edit a job lead",
    localKeys: ["kingsmen.personalJobs02.externalLeads.v1"],
    boundary: "Does not verify or apply automatically."
  },
  {
    id: "PJ03",
    title: "Fit Scoring Shortlist",
    href: "/personal-job-desk/shortlist",
    stage: "Decision",
    purpose: "Ranks local leads into Crown Target, Strong Route, Watchlist, and Research First so time goes to the best opportunities first.",
    primaryAction: "Score and shortlist leads",
    localKeys: ["kingsmen.personalJobs03.shortlist.v1"],
    boundary: "Heuristic local scoring; human review remains required."
  },
  {
    id: "PJ04",
    title: "CV & Motivation Apply Pack Builder",
    href: "/personal-job-desk/apply-pack",
    stage: "Application pack",
    purpose: "Builds truthful CV and motivation-letter packs aligned to the shortlisted role, using the locked 15 CV and 15 motivation-letter slot discipline.",
    primaryAction: "Prepare application pack",
    localKeys: ["kingsmen.personalJobs04.applyPacks.v1"],
    boundary: "Does not send applications or messages."
  },
  {
    id: "PJ06",
    title: "Follow-Up Calendar / Interview Prep",
    href: "/personal-job-desk/follow-up",
    stage: "Follow-up",
    purpose: "Tracks follow-ups, interviews, response dates, employer replies, and prep actions after applications are made manually.",
    primaryAction: "Track follow-up and interview actions",
    localKeys: ["kingsmen.personalJobs06.followUps.v1"],
    boundary: "Local tracker only; no external calendar write."
  },
  {
    id: "PJ07",
    title: "Outcome Ledger / Offer Decision",
    href: "/personal-job-desk/outcomes",
    stage: "Outcome",
    purpose: "Records outcomes, offers, rejections, silence, next-route decisions, and campaign command status.",
    primaryAction: "Record job-search outcome",
    localKeys: ["kingsmen.personalJobs07.outcomeLedger.v1"],
    boundary: "Local proof ledger only; no production analytics claim."
  },
  {
    id: "PJ08",
    title: "Real Use Gate",
    href: "/personal-job-desk/real-use-gate",
    stage: "Use gate",
    purpose: "Shows whether the local personal job desk is actually usable, clickable, and ready for daily work.",
    primaryAction: "Check local readiness",
    localKeys: [],
    boundary: "Local runtime smoke gate; not Oracle production."
  },
  {
    id: "PJ10",
    title: "Daily Operating Loop",
    href: "/personal-job-desk/daily-loop",
    stage: "Daily rhythm",
    purpose: "Turns the job search into a daily campaign: find leads, normalize, shortlist, build packs, apply manually, follow up, and record outcomes.",
    primaryAction: "Run today's campaign loop",
    localKeys: ["kingsmen.personalJobs10.dailyOperatingLoop.v1"],
    boundary: "Founder-only local operating rhythm."
  },
  {
    id: "PJ11",
    title: "Local Job Search Import Desk",
    href: "/personal-job-desk/import-search",
    stage: "Import",
    purpose: "Lets you paste or import job search results you found elsewhere, then turn them into local candidate leads.",
    primaryAction: "Import job-search results",
    localKeys: ["kingsmen.personalJobs11.searchImportBatches.v1"],
    boundary: "Import desk only; does not scrape or apply."
  },
  {
    id: "PJ12",
    title: "Real Job Search Source Runner",
    href: "/personal-job-desk/source-runner",
    stage: "Verified lead finding",
    purpose: "Guides verified lead finding from real job sources while keeping the local proof boundary clear.",
    primaryAction: "Run verified lead search workflow",
    localKeys: ["kingsmen.personalJobs12.sourceRunnerSessions.v1"],
    boundary: "Verification workflow only; no automatic employer contact."
  },
  {
    id: "PJ13",
    title: "Import Normalizer",
    href: "/personal-job-desk/normalizer",
    stage: "Repair",
    purpose: "Repairs PJ11 and PJ12 imported leads into the exact PJ02 lead schema, with backup before rewrite.",
    primaryAction: "Normalize imported leads",
    localKeys: [
      "kingsmen.personalJobs02.externalLeads.v1",
      "kingsmen.personalJobs13.normalizerReports.v1",
      "kingsmen.personalJobs13.normalizerBackups.v1"
    ],
    boundary: "LocalStorage repair only; no internet, scraping, send, employer contact, or payment."
  },
  {
    id: "PJ14",
    title: "Navigation / Real Use Gate Expansion",
    href: "/personal-job-desk/navigation",
    stage: "Navigation",
    purpose: "Connects the complete personal job desk into one realistic local-use command hub.",
    primaryAction: "Use the complete local job desk",
    localKeys: ["kingsmen.personalJobs14.navigationVisits.v1"],
    boundary: "Navigation repair only; no hidden automation."
  }
];

const DAILY_FLOW = [
  "Open PJ11 or PJ12 to collect fresh real job leads.",
  "Use PJ13 to normalize imported leads into the PJ02 schema.",
  "Use PJ02 to add any outside leads heard from people, posts, or company names.",
  "Use PJ03 to decide which leads deserve time first.",
  "Use PJ04 to prepare CV and motivation packs.",
  "Apply manually using official employer or platform instructions.",
  "Use PJ06 to track follow-up and interview preparation.",
  "Use PJ07 to record outcome, silence, offer, rejection, or next action.",
  "Use PJ10 to repeat the loop daily until employment is secured."
];

function safeReadCount(key: string): number {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed.length;

    if (parsed && typeof parsed === "object") {
      const possibleArrays = [
        parsed.items,
        parsed.leads,
        parsed.records,
        parsed.shortlist,
        parsed.applyPacks,
        parsed.followUps,
        parsed.outcomes,
        parsed.reports,
        parsed.imports,
        parsed.verifiedLeads,
        parsed.backups
      ];

      for (const value of possibleArrays) {
        if (Array.isArray(value)) return value.length;
      }

      return Object.keys(parsed).length > 0 ? 1 : 0;
    }

    return 0;
  } catch {
    return 0;
  }
}

function writeVisitMarker() {
  if (typeof window === "undefined") return;

  const key = "kingsmen.personalJobs14.navigationVisits.v1";
  const visit = {
    module: "PERSONAL-JOBS-14",
    route: "/personal-job-desk/navigation",
    visitedAt: new Date().toISOString(),
    boundary: NO_SEND_BOUNDARY
  };

  try {
    const raw = window.localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(existing) ? existing : [];
    const next = [visit, ...list].slice(0, 20);
    window.localStorage.setItem(key, JSON.stringify(next, null, 2));
  } catch {
    window.localStorage.setItem(key, JSON.stringify([visit], null, 2));
  }
}

function getRouteSignal(route: RouteItem): number {
  return route.localKeys.reduce((sum, key) => sum + safeReadCount(key), 0);
}

function cardTone(index: number) {
  const tones = ["#f9e7b1", "#f1d38a", "#d8b35f", "#ffe7a3"];
  return tones[index % tones.length];
}

export default function NavigationHubClient({ variant = "hub" }: { variant?: NavigationVariant }) {
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [activeStage, setActiveStage] = React.useState("All");

  React.useEffect(() => {
    writeVisitMarker();

    const nextCounts: Record<string, number> = {};
    for (const route of ROUTES) {
      nextCounts[route.id] = getRouteSignal(route);
    }

    setCounts(nextCounts);
  }, []);

  const stages = React.useMemo(() => {
    return ["All", ...Array.from(new Set(ROUTES.map((route) => route.stage)))];
  }, []);

  const visibleRoutes = React.useMemo(() => {
    if (activeStage === "All") return ROUTES;
    return ROUTES.filter((route) => route.stage === activeStage);
  }, [activeStage]);

  const touchedRoutes = Object.values(counts).filter((count) => count > 0).length;
  const progressPercent = Math.round((touchedRoutes / ROUTES.length) * 100);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.kicker}>PERSONAL-JOBS-14</div>
        <h1 style={styles.title}>
          {variant === "gate"
            ? "Personal Job Desk Real Use Gate"
            : "Personal Job Desk Navigation Command"}
        </h1>
        <p style={styles.subtitle}>
          One local, clickable job-search command surface for finding leads, importing outside opportunities,
          repairing schemas, shortlisting, preparing application packs, tracking follow-ups, and recording outcomes.
        </p>

        <div style={styles.heroActions}>
          <a style={styles.primaryButton} href="/personal-job-desk/navigation">
            Open full navigation
          </a>
          <a style={styles.secondaryButton} href="/personal-job-desk/daily-loop">
            Start daily loop
          </a>
          <a style={styles.secondaryButton} href="/personal-job-desk/source-runner">
            Find verified leads
          </a>
          <a style={styles.secondaryButton} href="/personal-job-desk/normalizer">
            Normalize imports
          </a>
        </div>
      </section>

      <section style={styles.statusGrid}>
        <div style={styles.statusCard}>
          <span style={styles.statusLabel}>Clickable modules</span>
          <strong style={styles.statusValue}>{ROUTES.length}</strong>
          <span style={styles.statusNote}>PJ01 to PJ14 connected in one hub</span>
        </div>

        <div style={styles.statusCard}>
          <span style={styles.statusLabel}>Local activity signals</span>
          <strong style={styles.statusValue}>{touchedRoutes}</strong>
          <span style={styles.statusNote}>Routes with browser storage evidence</span>
        </div>

        <div style={styles.statusCard}>
          <span style={styles.statusLabel}>Real-use readiness</span>
          <strong style={styles.statusValue}>{progressPercent}%</strong>
          <span style={styles.statusNote}>Based on local route data, not production claims</span>
        </div>

        <div style={styles.statusCard}>
          <span style={styles.statusLabel}>Boundary</span>
          <strong style={styles.statusValue}>Local</strong>
          <span style={styles.statusNote}>No send, no payment, no employer contact</span>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <div style={styles.kicker}>Daily campaign path</div>
            <h2 style={styles.sectionTitle}>Use this order when you want a real job fast</h2>
          </div>
          <a style={styles.miniButton} href="/personal-job-desk/daily-loop">
            Open PJ10
          </a>
        </div>

        <ol style={styles.flowList}>
          {DAILY_FLOW.map((step, index) => (
            <li key={step} style={styles.flowItem}>
              <span style={styles.flowNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <div style={styles.kicker}>Route index</div>
            <h2 style={styles.sectionTitle}>Every personal job desk surface</h2>
          </div>
          <div style={styles.stageRow}>
            {stages.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveStage(stage)}
                style={activeStage === stage ? styles.stageButtonActive : styles.stageButton}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.routeGrid}>
          {visibleRoutes.map((route, index) => {
            const count = counts[route.id] ?? 0;

            return (
              <article key={route.id} style={styles.routeCard}>
                <div style={styles.routeTop}>
                  <span style={{ ...styles.routeBadge, borderColor: cardTone(index), color: cardTone(index) }}>
                    {route.id}
                  </span>
                  <span style={styles.routeStage}>{route.stage}</span>
                </div>

                <h3 style={styles.routeTitle}>{route.title}</h3>
                <p style={styles.routePurpose}>{route.purpose}</p>

                <div style={styles.routeMeta}>
                  <span>Local records: {count}</span>
                  <span>{route.primaryAction}</span>
                </div>

                <p style={styles.boundary}>{route.boundary}</p>

                <a style={styles.openRouteButton} href={route.href}>
                  Open {route.id}
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section style={styles.boundaryPanel}>
        <div>
          <div style={styles.kicker}>Safety lock</div>
          <h2 style={styles.sectionTitle}>What PJ14 does not do</h2>
          <p style={styles.subtitleSmall}>
            This module is a navigation and real-use gate expansion only. It keeps the local job system honest.
          </p>
        </div>

        <div style={styles.boundaryGrid}>
          <span style={styles.boundaryPill}>Does not send applications</span>
          <span style={styles.boundaryPill}>Does not email employers</span>
          <span style={styles.boundaryPill}>Does not WhatsApp employers</span>
          <span style={styles.boundaryPill}>Does not touch payments</span>
          <span style={styles.boundaryPill}>Does not claim Oracle deployment</span>
          <span style={styles.boundaryPill}>Does not claim production readiness</span>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(249, 231, 177, 0.18), transparent 34%), linear-gradient(135deg, #080706 0%, #15110a 45%, #241805 100%)",
    color: "#f8f1df",
    padding: "28px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  hero: {
    maxWidth: "1180px",
    margin: "0 auto 24px",
    padding: "34px",
    border: "1px solid rgba(249, 231, 177, 0.28)",
    borderRadius: "28px",
    background: "rgba(14, 10, 5, 0.82)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)"
  },
  kicker: {
    color: "#d8b35f",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "10px"
  },
  title: {
    fontSize: "clamp(34px, 5vw, 66px)",
    lineHeight: 0.95,
    letterSpacing: "-0.06em",
    margin: "0 0 18px",
    maxWidth: "940px"
  },
  subtitle: {
    color: "#d9ccb0",
    fontSize: "18px",
    lineHeight: 1.65,
    maxWidth: "880px",
    margin: 0
  },
  subtitleSmall: {
    color: "#d9ccb0",
    fontSize: "15px",
    lineHeight: 1.55,
    maxWidth: "760px",
    margin: 0
  },
  heroActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "28px"
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 18px",
    borderRadius: "999px",
    background: "#f1d38a",
    color: "#161007",
    textDecoration: "none",
    fontWeight: 900
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 18px",
    borderRadius: "999px",
    border: "1px solid rgba(249, 231, 177, 0.3)",
    color: "#f8f1df",
    textDecoration: "none",
    fontWeight: 800,
    background: "rgba(255,255,255,0.04)"
  },
  miniButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(249, 231, 177, 0.32)",
    color: "#f8f1df",
    textDecoration: "none",
    fontWeight: 800,
    whiteSpace: "nowrap"
  },
  statusGrid: {
    maxWidth: "1180px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px"
  },
  statusCard: {
    padding: "22px",
    borderRadius: "22px",
    border: "1px solid rgba(249, 231, 177, 0.22)",
    background: "rgba(255,255,255,0.045)"
  },
  statusLabel: {
    display: "block",
    color: "#d9ccb0",
    fontSize: "13px",
    marginBottom: "8px"
  },
  statusValue: {
    display: "block",
    color: "#f1d38a",
    fontSize: "34px",
    lineHeight: 1,
    marginBottom: "10px"
  },
  statusNote: {
    color: "#c6b58e",
    fontSize: "13px",
    lineHeight: 1.45
  },
  panel: {
    maxWidth: "1180px",
    margin: "0 auto 24px",
    padding: "26px",
    borderRadius: "26px",
    border: "1px solid rgba(249, 231, 177, 0.22)",
    background: "rgba(14, 10, 5, 0.68)"
  },
  boundaryPanel: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "26px",
    borderRadius: "26px",
    border: "1px solid rgba(249, 231, 177, 0.22)",
    background: "rgba(241, 211, 138, 0.08)"
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "22px",
    flexWrap: "wrap"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "26px",
    letterSpacing: "-0.03em"
  },
  flowList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "10px"
  },
  flowItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(249, 231, 177, 0.12)",
    color: "#eee2c5",
    lineHeight: 1.45
  },
  flowNumber: {
    color: "#f1d38a",
    fontWeight: 900,
    minWidth: "34px"
  },
  stageRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  stageButton: {
    border: "1px solid rgba(249, 231, 177, 0.2)",
    color: "#f8f1df",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "999px",
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: 800
  },
  stageButtonActive: {
    border: "1px solid #f1d38a",
    color: "#161007",
    background: "#f1d38a",
    borderRadius: "999px",
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: 900
  },
  routeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "14px"
  },
  routeCard: {
    padding: "20px",
    borderRadius: "22px",
    border: "1px solid rgba(249, 231, 177, 0.2)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    minHeight: "330px"
  },
  routeTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    marginBottom: "14px"
  },
  routeBadge: {
    border: "1px solid",
    borderRadius: "999px",
    padding: "6px 9px",
    fontSize: "12px",
    fontWeight: 900
  },
  routeStage: {
    color: "#c6b58e",
    fontSize: "12px",
    fontWeight: 800
  },
  routeTitle: {
    margin: "0 0 10px",
    fontSize: "19px",
    lineHeight: 1.18
  },
  routePurpose: {
    color: "#d9ccb0",
    lineHeight: 1.5,
    fontSize: "14px",
    margin: "0 0 16px"
  },
  routeMeta: {
    display: "grid",
    gap: "8px",
    color: "#f1d38a",
    fontSize: "13px",
    fontWeight: 800,
    marginTop: "auto",
    marginBottom: "12px"
  },
  boundary: {
    color: "#bca978",
    fontSize: "12px",
    lineHeight: 1.45,
    margin: "0 0 14px"
  },
  openRouteButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "11px 14px",
    borderRadius: "14px",
    color: "#161007",
    background: "#f1d38a",
    textDecoration: "none",
    fontWeight: 900
  },
  boundaryGrid: {
    marginTop: "18px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  boundaryPill: {
    border: "1px solid rgba(249, 231, 177, 0.22)",
    color: "#f8f1df",
    borderRadius: "999px",
    padding: "9px 12px",
    background: "rgba(0,0,0,0.2)",
    fontSize: "13px",
    fontWeight: 800
  }
};