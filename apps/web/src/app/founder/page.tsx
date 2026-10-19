"use client";

import { useEffect, useState } from "react";

type Readiness = {
  productionReady?: boolean;
  livePaymentsAllowed?: boolean;
  liveEmailAllowed?: boolean;
  officialSubmissionsAllowed?: boolean;
  rawShellAllowed?: boolean;
  nextAction?: string;
  checkedAt?: string;
};

const modules = [
  { title: "Master index & proof matrix", href: "/founder/master-index", description: "Layer status, evidence boundaries and next validation gate.", group: "GOVERNANCE" },
  { title: "Founder commands", href: "/founder/control-plane/commands", description: "Command doctrine, approval workflow and audit requirements.", group: "CONTROL PLANE" },
  { title: "Daily digest & urgent alerts", href: "/founder/control-plane/digest", description: "Founder review rhythm, incident briefs and mobile-alert policy.", group: "OPERATIONS" },
  { title: "Airtable provider health", href: "/founder/providers/airtable", description: "Provider health and controlled sync surface.", group: "INTEGRATIONS" },
  { title: "Document review", href: "/founder/documents", description: "Document review surface, where available.", group: "CANDIDATE OPERATIONS" },
  { title: "Launch proof & runtime gates", href: "/founder/launch-control/jarvis-live-proof-acceptance-gate", description: "Inspect launch evidence before any production decision.", group: "RELEASE" },
];

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", padding: "clamp(1rem, 3vw, 2.5rem)", background: "#f4f6fa", color: "#172033", fontFamily: "system-ui, sans-serif" },
  wrap: { maxWidth: 1180, margin: "0 auto" },
  header: { background: "#111827", color: "white", padding: "clamp(1.4rem, 4vw, 2.5rem)", borderRadius: 22, marginBottom: 20 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#93c5fd" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 14 },
  card: { display: "block", background: "white", border: "1px solid #dbe2ec", borderRadius: 16, padding: 20, color: "inherit", textDecoration: "none" },
  panel: { background: "white", border: "1px solid #dbe2ec", borderRadius: 16, padding: 20, marginBottom: 18 },
  badge: { display: "inline-block", padding: "5px 9px", borderRadius: 999, background: "#e0f2fe", color: "#075985", fontSize: 11, fontWeight: 800, letterSpacing: 0.5 },
};

export default function FounderPortalPage() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/founder/backend-readiness", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("readiness unavailable");
        return response.json();
      })
      .then((data: Readiness) => { if (active) { setReadiness(data); setLoadState("loaded"); } })
      .catch(() => { if (active) setLoadState("unavailable"); });
    return () => { active = false; };
  }, []);

  const flags = [
    ["Production launch", readiness?.productionReady === true ? "ENABLED BY READ MODEL" : "NOT READY"],
    ["Live payments", readiness?.livePaymentsAllowed === true ? "ALLOWED BY READ MODEL" : "DISABLED"],
    ["Live email", readiness?.liveEmailAllowed === true ? "ALLOWED BY READ MODEL" : "DISABLED"],
    ["Official submissions", readiness?.officialSubmissionsAllowed === true ? "ALLOWED BY READ MODEL" : "DISABLED"],
    ["Raw shell access", readiness?.rawShellAllowed === true ? "ALLOWED BY READ MODEL" : "DISABLED"],
  ];

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>KINGSMEN PORTAL · FOUNDER CONTROL</div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.05, margin: "12px 0" }}>Founder Command Centre</h1>
          <p style={{ maxWidth: 760, color: "#d1d5db", lineHeight: 1.65, marginBottom: 0 }}>
            One entry point for operational review, command governance, provider health and release evidence. Commands must remain behind the governance and orchestrator boundaries.
          </p>
        </header>

        <section aria-label="Launch guardrails" style={styles.panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Launch guardrails</h2>
            <span style={styles.badge}>{loadState === "loaded" ? "READINESS ENDPOINT RESPONDED" : loadState === "loading" ? "CHECKING READINESS" : "READINESS UNAVAILABLE"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 16 }}>
            {flags.map(([label, value]) => <div key={label} style={{ padding: 13, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}><div style={{ fontSize: 12, color: "#64748b", marginBottom: 7 }}>{label}</div><strong style={{ fontSize: 13 }}>{value}</strong></div>)}
          </div>
          <p style={{ marginBottom: 0, lineHeight: 1.6, color: "#475569" }}>
            {readiness?.nextAction || "Readiness status is not available yet. Do not infer production readiness from a page loading."}
            {readiness?.checkedAt ? <><br />Read model checked: {new Date(readiness.checkedAt).toLocaleString()}</> : null}
          </p>
          <p style={{ marginBottom: 0, marginTop: 12, fontSize: 13, color: "#9a3412" }}>
            Important: this page is an operational navigation/readiness surface, not an authorization boundary. Existing command routes are dry-run or route shells; no live action is claimed here.
          </p>
        </section>

        <section aria-label="Founder modules">
          <h2 style={{ margin: "0 0 14px" }}>Operational modules</h2>
          <div style={styles.grid}>
            {modules.map((module) => (
              <a key={module.href} href={module.href} style={styles.card}>
                <div style={{ fontSize: 11, letterSpacing: 1, fontWeight: 800, color: "#64748b" }}>{module.group}</div>
                <h3 style={{ fontSize: 19, margin: "10px 0 7px" }}>{module.title} <span aria-hidden="true">↗</span></h3>
                <p style={{ color: "#475569", lineHeight: 1.6, margin: 0 }}>{module.description}</p>
              </a>
            ))}
          </div>
        </section>
        <footer style={{ padding: "22px 2px", fontSize: 12, color: "#64748b" }}>
          Safety defaults: no live payments, no official submissions, no silent overrides, no direct finality for refunds or sensitive decisions. Review evidence before changing release status.
        </footer>
      </div>
    </main>
  );
}
