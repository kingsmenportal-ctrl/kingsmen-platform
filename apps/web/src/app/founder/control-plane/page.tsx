"use client";

import { useEffect, useState } from "react";

type HealthShell = {
  ok?: boolean;
  productionReady?: boolean;
  boundary?: string;
  mobileControlPlaneBuilt?: boolean;
  actionPacketsBuilt?: boolean;
  queueHealthBuilt?: boolean;
  providerHealthSummaryBuilt?: boolean;
  stopSellingSurfaceBuilt?: boolean;
  serviceRoleVisibleToBrowser?: boolean;
};

const surfaces = [
  { title: "Document review", detail: "Prepare an authenticated review proposal with proof, evidence and audit references. No status mutation is enabled.", href: "/founder/documents/review", state: "PROPOSAL ONLY" },
  { title: "Command review", detail: "Review command policy and required evidence before any action.", href: "/founder/control-plane/commands/", state: "CONTROLLED WORKFLOW" },
  { title: "Build Proof Centre", detail: "Inspect proof references and validation boundaries.", href: "/founder/proof-centre/", state: "EVIDENCE INDEX" },
  { title: "Master Index", detail: "Review component inventory and documented status.", href: "/founder/master-index/", state: "COMPONENT INDEX" },
  { title: "Stop-selling operations", detail: "The control surface is documented; live enforcement is not asserted here.", href: "/founder/stop-selling/", state: "VERIFY BEFORE USE" },
];

const boundaries = [
  "No direct official application submission",
  "No final refund or payout decisions from this cockpit",
  "No candidate-state mutation without governance, evidence and audit",
  "No claim of live queue/provider health until a verified runtime source is connected",
];

export default function FounderControlPlanePage() {
  const [health, setHealth] = useState<HealthShell | null>(null);
  const [healthState, setHealthState] = useState<"loading" | "loaded" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/founder/control-plane/health", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Health shell unavailable");
        return response.json() as Promise<HealthShell>;
      })
      .then((data) => {
        if (!active) return;
        setHealth(data);
        setHealthState("loaded");
      })
      .catch(() => {
        if (active) setHealthState("unavailable");
      });
    return () => { active = false; };
  }, []);

  const cardStyle = {
    border: "1px solid #29394d",
    borderRadius: 16,
    background: "#101a29",
    padding: 20,
    minWidth: 0,
  } as const;

  const linkStyle = {
    display: "inline-flex",
    marginTop: 14,
    color: "#f8d77a",
    fontWeight: 800,
    textDecoration: "none",
  } as const;

  return (
    <main style={{ minHeight: "100vh", padding: "clamp(20px, 4vw, 44px)", background: "#07101c", color: "#edf3fa", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <p style={{ color: "#f8d77a", fontSize: 12, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>Kingsmen · Founder operations</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.05, margin: "10px 0 12px" }}>Founder Control Plane</h1>
        <p style={{ maxWidth: 780, color: "#b7c4d5", fontSize: 17, lineHeight: 1.6 }}>
          A single entry point for command review, proof, component status and safety boundaries. This page does not execute operational commands or claim live provider telemetry.
        </p>

        <section aria-label="Control plane status" style={{ ...cardStyle, marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 18 }}>
          <div>
            <p style={{ color: "#93a7bd", margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Health route</p>
            <h2 style={{ margin: "8px 0", fontSize: 20 }}>{healthState === "loading" ? "Checking…" : healthState === "unavailable" ? "Unavailable" : health?.ok ? "Responding" : "Check response"}</h2>
            <p style={{ color: "#a9b8c9", margin: 0, fontSize: 13 }}>A route response is not proof of production health.</p>
          </div>
          <div>
            <p style={{ color: "#93a7bd", margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Production readiness</p>
            <h2 style={{ margin: "8px 0", fontSize: 20, color: "#ffbd8a" }}>{health?.productionReady === true ? "Declared ready" : "Not verified"}</h2>
            <p style={{ color: "#a9b8c9", margin: 0, fontSize: 13 }}>{health?.boundary ?? "Waiting for health-shell response"}</p>
          </div>
          <div>
            <p style={{ color: "#93a7bd", margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Execution mode</p>
            <h2 style={{ margin: "8px 0", fontSize: 20 }}>Review only</h2>
            <p style={{ color: "#a9b8c9", margin: 0, fontSize: 13 }}>No command is run from this dashboard.</p>
          </div>
        </section>

        <h2 style={{ margin: "34px 0 14px", fontSize: 22 }}>Operations surfaces</h2>
        <section aria-label="Operations surfaces" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))", gap: 14 }}>
          {surfaces.map((surface) => (
            <article key={surface.title} style={cardStyle}>
              <p style={{ color: "#f8d77a", fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", margin: 0 }}>{surface.state}</p>
              <h3 style={{ margin: "12px 0 8px", fontSize: 19 }}>{surface.title}</h3>
              <p style={{ color: "#b7c4d5", lineHeight: 1.55, margin: 0 }}>{surface.detail}</p>
              <a href={surface.href} style={linkStyle}>Open surface →</a>
            </article>
          ))}
        </section>

        <section aria-label="Safety boundaries" style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Non-negotiable safety boundaries</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 0, color: "#c4d0df", lineHeight: 1.9 }}>
            {boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}
          </ul>
        </section>

        <p style={{ color: "#8294a9", fontSize: 12, lineHeight: 1.6, marginTop: 22 }}>
          Runtime evidence, authenticated founder-role enforcement, connected telemetry and staging acceptance remain separate gates. This UI intentionally does not imply those gates have passed.
        </p>
      </div>
    </main>
  );
}
