"use client";

import { useEffect, useState } from "react";

type AuditGate = {
  id: string;
  title: string;
  state: string;
  launchCritical: boolean;
  requiredEvidence: string[];
  rejectionRules: string[];
  detail: string;
};

type AuditPayload = {
  schema: string;
  module: string;
  branchProtectionProofAccepted: boolean;
  finalLaunchAuditAccepted: boolean;
  rollbackProofAccepted: boolean;
  stagingEvidencePackAccepted: boolean;
  jarvisRuntimeLive: boolean;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  launchBlocked: boolean;
  launchBlockingCount: number;
  auditGates: AuditGate[];
  nextAction: string;
};

const panel = {
  border: "1px solid rgba(139,231,255,0.22)",
  borderRadius: 24,
  padding: 18,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const pill = {
  display: "inline-block",
  border: "1px solid rgba(255,227,163,0.38)",
  borderRadius: 999,
  padding: "5px 8px",
  color: "#ffe3a3",
  background: "rgba(255,227,163,0.10)",
  fontSize: "0.68rem",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

export default function JarvisBranchFinalAuditPage() {
  const [payload, setPayload] = useState<AuditPayload | null>(null);

  async function load() {
    const response = await fetch("/api/jarvis/branch-protection-final-launch-audit", { cache: "no-store" });
    if (response.ok) setPayload(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  const gates = payload?.auditGates ?? [];

  return (
    <main style={{ minHeight: "100vh", padding: 28, color: "#ecfbff", background: "linear-gradient(145deg, #040813, #071323 46%, #02040a)", fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <section style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gap: 18 }}>
        <article style={{ ...panel, background: "linear-gradient(135deg, rgba(0,174,255,0.18), rgba(105,56,255,0.12)), rgba(7,21,38,0.92)" }}>
          <p style={{ margin: 0, color: "#70f7ff", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 900 }}>Kingsmen · Jarvis Launch Security</p>
          <h1 style={{ margin: "10px 0", fontSize: "clamp(2.5rem, 6vw, 5.8rem)", lineHeight: 0.9 }}>Branch Protection / Final Audit</h1>
          <p style={{ maxWidth: 980, color: "rgba(236,251,255,0.72)", lineHeight: 1.65 }}>
            Final launch cannot pass until branch protection, required checks, rollback, staging evidence, final audit, and founder approval are proven. This page does not approve production; it shows the security gate still blocking launch.
          </p>
        </article>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <article style={panel}><SmallStat label="Branch proof" value={String(payload?.branchProtectionProofAccepted ?? false)} /></article>
          <article style={panel}><SmallStat label="Rollback proof" value={String(payload?.rollbackProofAccepted ?? false)} /></article>
          <article style={panel}><SmallStat label="Staging pack" value={String(payload?.stagingEvidencePackAccepted ?? false)} /></article>
          <article style={panel}><SmallStat label="Launch audit" value={String(payload?.finalLaunchAuditAccepted ?? false)} /></article>
          <article style={panel}><SmallStat label="Production" value={String(payload?.productionReady ?? false)} /></article>
          <article style={panel}><SmallStat label="Public launch" value={String(payload?.publicLaunchAllowed ?? false)} /></article>
          <article style={panel}><SmallStat label="Blocking count" value={payload?.launchBlockingCount ?? "waiting"} /></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 12 }}>
          {gates.map((gate) => (
            <article key={gate.id} style={panel}>
              <span style={pill}>{gate.state}</span>
              <h2 style={{ margin: "12px 0 8px", fontSize: "1.05rem" }}>{gate.title}</h2>
              <p style={{ margin: 0, color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{gate.detail}</p>
              <p style={{ color: "#9dffcb", fontWeight: 900 }}>Evidence required</p>
              <ul style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.5 }}>
                {gate.requiredEvidence.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <article style={panel}>
          <p style={{ margin: 0, color: "#ffe3a3" }}>{payload?.nextAction ?? "Waiting for audit gate."}</p>
        </article>
      </section>
    </main>
  );
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <p style={{ margin: 0, color: "rgba(194,231,244,0.68)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</p>
      <strong style={{ display: "block", marginTop: 8, fontSize: "1.25rem" }}>{value}</strong>
    </>
  );
}
