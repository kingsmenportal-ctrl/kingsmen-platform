"use client";

import { useEffect, useMemo, useState } from "react";

type Surface = {
  id: string;
  title: string;
  href: string;
  state: string;
  detail: string;
};

type FinalHudPayload = {
  schema: string;
  module: string;
  generatedAt: string;
  jarvisSourceDesignComplete: boolean;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  dockerIndependentBuildAllowed: boolean;
  noFakeData: boolean;
  rawSecretsReturned: boolean;
  secretValuesReturned: boolean;
  localShellExecuted: boolean;
  directDatabaseAccessFromWeb: boolean;
  sourceSurfaces: Surface[];
  launchGates: string[];
  designSections: string[];
  nextAction: string;
};

type CompletionItem = {
  id: string;
  title: string;
  state: string;
  detail: string;
  launchCritical?: boolean;
  boundaryRoute?: string;
  validatorScript?: string;
  runtimeProofScript?: string;
};

type CompletionPayload = {
  counts?: Record<string, number>;
  completionItems?: CompletionItem[];
  nextSourceBatches?: string[];
};

type ProviderPayload = {
  providers?: Array<{
    id: string;
    title: string;
    state: string;
    detail: string;
    credentials: Array<{ name: string; secret: boolean; valueReturned: false }>;
  }>;
};

type EvidenceItem = {
  id: string;
  title: string;
  evidenceType: string;
  state: string;
  source: string;
  requiredBeforeLaunch: boolean;
  detail: string;
};

type EvidencePayload = {
  counts?: Record<string, number>;
  evidenceItems?: EvidenceItem[];
};

type LaunchGate = {
  id: string;
  title: string;
  state: string;
  launchCritical: boolean;
  detail: string;
};

type SourceLaunchGatePayload = {
  jarvisSourceComplete: boolean;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  launchAllowedReason: string;
  launchBlockingCount: number;
  gates?: LaunchGate[];
  launchBlocking?: LaunchGate[];
};

type ProofPackPayload = {
  jarvisSourcePackReady: boolean;
  validators?: string[];
  reports?: string[];
  manifests?: string[];
  routes?: string[];
  blockers?: Array<{ id: string; title: string; state: string; detail: string }>;
};

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const colors = {
  bg: "#040813",
  panel: "rgba(8,22,39,0.86)",
  cyan: "#70f7ff",
  green: "#9dffcb",
  amber: "#ffe3a3",
  red: "#ffc9c9",
  text: "#ecfbff",
  muted: "rgba(236,251,255,0.72)",
  border: "rgba(139,231,255,0.22)"
};

function pillStyle(state: string) {
  if (state.includes("PASSED") || state.includes("CAPTURED") || state === "LIVE") return { borderColor: "rgba(157,255,203,0.44)", color: colors.green, background: "rgba(157,255,203,0.10)" };
  if (state.includes("SOURCE")) return { borderColor: "rgba(112,247,255,0.42)", color: colors.cyan, background: "rgba(112,247,255,0.10)" };
  if (state.includes("BLOCK")) return { borderColor: "rgba(255,117,117,0.38)", color: colors.red, background: "rgba(255,117,117,0.10)" };
  if (state.includes("CREDENTIAL") || state.includes("PENDING")) return { borderColor: "rgba(255,227,163,0.38)", color: colors.amber, background: "rgba(255,227,163,0.10)" };
  return { borderColor: "rgba(236,251,255,0.22)", color: colors.muted, background: "rgba(236,251,255,0.08)" };
}

function Card({ children, tone = "normal" }: { children: React.ReactNode; tone?: "normal" | "hero" | "danger" }) {
  return (
    <article style={{
      border: `1px solid ${tone === "danger" ? "rgba(255,117,117,0.34)" : colors.border}`,
      borderRadius: 24,
      padding: 18,
      background: tone === "hero"
        ? "linear-gradient(135deg, rgba(0,174,255,0.18), rgba(105,56,255,0.12)), rgba(7,21,38,0.92)"
        : tone === "danger" ? "rgba(86,24,24,0.34)" : colors.panel,
      boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
    }}>{children}</article>
  );
}

export default function JarvisFinalHudClient() {
  const [hud, setHud] = useState<FinalHudPayload | null>(null);
  const [completion, setCompletion] = useState<CompletionPayload | null>(null);
  const [providers, setProviders] = useState<ProviderPayload | null>(null);
  const [evidence, setEvidence] = useState<EvidencePayload | null>(null);
  const [launchGate, setLaunchGate] = useState<SourceLaunchGatePayload | null>(null);
  const [proofPack, setProofPack] = useState<ProofPackPayload | null>(null);
  const [loadedAt, setLoadedAt] = useState("");

  async function load() {
    const [nextHud, nextCompletion, nextProviders, nextEvidence, nextLaunchGate, nextProofPack] = await Promise.all([
      readJson<FinalHudPayload>("/api/jarvis/final-command-hud"),
      readJson<CompletionPayload>("/api/jarvis/completion-board"),
      readJson<ProviderPayload>("/api/jarvis/provider-credential-checklist"),
      readJson<EvidencePayload>("/api/jarvis/evidence-collector"),
      readJson<SourceLaunchGatePayload>("/api/jarvis/source-launch-gate"),
      readJson<ProofPackPayload>("/api/jarvis/proof-pack-index")
    ]);
    setHud(nextHud);
    setCompletion(nextCompletion);
    setProviders(nextProviders);
    setEvidence(nextEvidence);
    setLaunchGate(nextLaunchGate);
    setProofPack(nextProofPack);
    setLoadedAt(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, []);

  const items = completion?.completionItems ?? [];
  const criticalPending = items.filter((item) => item.launchCritical && !["SOURCE_READY", "RUNTIME_PASSED"].includes(item.state)).length;
  const credentialProviders = providers?.providers ?? [];
  const credentialCount = useMemo(() => credentialProviders.reduce((sum, provider) => sum + provider.credentials.length, 0), [credentialProviders]);
  const evidenceItems = evidence?.evidenceItems ?? [];
  const capturedEvidence = evidence?.counts?.CAPTURED ?? 0;
  const blockedEvidence = evidence?.counts?.BLOCKED ?? 0;
  const pendingEvidence = evidence?.counts?.PENDING ?? 0;
  const gates = launchGate?.gates ?? [];
  const proofRoutes = proofPack?.routes ?? [];
  const proofBlockers = proofPack?.blockers ?? [];

  return (
    <main style={{
      minHeight: "100vh",
      padding: 28,
      color: colors.text,
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      background: `radial-gradient(circle at 12% 12%, rgba(0,224,255,0.22), transparent 28%), radial-gradient(circle at 80% 20%, rgba(149,76,255,0.18), transparent 30%), linear-gradient(145deg, ${colors.bg}, #071323 46%, #02040a)`
    }}>
      <section style={{ maxWidth: 1760, margin: "0 auto" }}>
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 18, alignItems: "stretch" }}>
          <Card tone="hero">
            <p style={{ color: colors.cyan, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 900, margin: 0 }}>Kingsmen · Jarvis Final Command HUD</p>
            <h1 style={{ margin: "12px 0", fontSize: "clamp(3rem, 8vw, 7.8rem)", lineHeight: 0.84, letterSpacing: "-0.08em" }}>JARVIS</h1>
            <p style={{ maxWidth: 980, color: colors.muted, lineHeight: 1.68, fontSize: "1.02rem" }}>
              Final source command room for founder control, completion tracking, provider readiness, evidence collection, launch gates, proof-pack index, runtime blockers, and no fake production claims.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button onClick={load} style={buttonStyle}>Refresh HUD</button>
              <button onClick={() => window.open("/jarvis", "_blank", "noopener,noreferrer")} style={buttonStyle}>Open Command</button>
              <button onClick={() => window.open("/founder/proof-centre/jarvis", "_blank", "noopener,noreferrer")} style={buttonStyle}>Proof Centre</button>
              <button onClick={() => window.open("/founder/providers/jarvis-credentials", "_blank", "noopener,noreferrer")} style={buttonStyle}>Credential Board</button>
              <button onClick={() => window.open("/api/jarvis/proof-pack-index", "_blank", "noopener,noreferrer")} style={buttonStyle}>Proof Pack JSON</button>
            </div>
          </Card>

          <Card>
            <div style={{ width: 142, height: 142, margin: "0 auto 18px", borderRadius: 999, display: "grid", placeItems: "center", background: "conic-gradient(from 90deg, #70f7ff, #895cff, #ffd56a, #70f7ff)", boxShadow: "0 0 55px rgba(87,233,255,0.35)" }}>
              <div style={{ width: 94, height: 94, borderRadius: 999, background: "#eaffff", display: "grid", placeItems: "center", color: "#051424", fontWeight: 1000, fontSize: 42 }}>J</div>
            </div>
            <p style={{ margin: 0, color: colors.green, fontWeight: 900, textAlign: "center" }}>SOURCE COMMAND ROOM</p>
            <p style={{ margin: "10px 0 0", color: colors.muted, textAlign: "center" }}>Production: {String(hud?.productionReady ?? false)} · Launch: {String(hud?.publicLaunchAllowed ?? false)}</p>
            <p style={{ margin: "10px 0 0", color: colors.muted, textAlign: "center" }}>Loaded: {loadedAt || "waiting"}</p>
          </Card>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, margin: "18px 0" }}>
          <Card><Stat label="Source ready" value={completion?.counts?.SOURCE_READY ?? 0} /></Card>
          <Card><Stat label="Runtime passed" value={completion?.counts?.RUNTIME_PASSED ?? 0} /></Card>
          <Card><Stat label="Credentials" value={completion?.counts?.PENDING_CREDENTIALS ?? 0} /></Card>
          <Card><Stat label="Critical pending" value={criticalPending} /></Card>
          <Card><Stat label="Evidence captured" value={capturedEvidence} /></Card>
          <Card><Stat label="Evidence pending" value={pendingEvidence} /></Card>
          <Card><Stat label="Evidence blocked" value={blockedEvidence} /></Card>
          <Card><Stat label="Launch blockers" value={launchGate?.launchBlockingCount ?? 0} /></Card>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "360px minmax(0, 1fr) 400px", gap: 18 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <Card tone="danger">
              <p style={label}>Runtime blocker</p>
              <h2 style={h2}>Docker/API remains separate</h2>
              <p style={p}>Local Docker instability blocks runtime proof only. It must not stop Jarvis source completion, design, validators, manifests, proof-pack index, or provider boundary screens.</p>
            </Card>

            <Card>
              <p style={label}>Design sections</p>
              {(hud?.designSections ?? []).map((section) => <p key={section} style={listLine}>✓ {section}</p>)}
            </Card>

            <Card>
              <p style={label}>Launch gate reason</p>
              <p style={p}>{launchGate?.launchAllowedReason ?? "Waiting for source launch gate."}</p>
            </Card>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <Card>
              <p style={label}>Source surfaces</p>
              <div style={gridCards}>
                {(hud?.sourceSurfaces ?? []).map((surface) => (
                  <article key={surface.id} style={innerCard}>
                    <span style={{ ...stateBase, ...pillStyle(surface.state) }}>{surface.state}</span>
                    <h3 style={h3}>{surface.title}</h3>
                    <p style={p}>{surface.detail}</p>
                    <a href={surface.href} target="_blank" rel="noreferrer" style={linkStyle}>{surface.href}</a>
                  </article>
                ))}
              </div>
            </Card>

            <Card>
              <p style={label}>Completion board</p>
              <div style={gridCards}>
                {items.map((item) => (
                  <article key={item.id} style={innerCard}>
                    <span style={{ ...stateBase, ...pillStyle(item.state) }}>{item.state}</span>
                    <h3 style={h3}>{item.title}</h3>
                    <p style={p}>{item.detail}</p>
                    {item.validatorScript ? <code style={codeStyle}>{item.validatorScript}</code> : null}
                  </article>
                ))}
              </div>
            </Card>

            <Card>
              <p style={label}>Evidence collector</p>
              <div style={gridCards}>
                {evidenceItems.map((item) => (
                  <article key={item.id} style={innerCard}>
                    <span style={{ ...stateBase, ...pillStyle(item.state) }}>{item.state}</span>
                    <h3 style={h3}>{item.title}</h3>
                    <p style={p}>{item.detail}</p>
                    <code style={codeStyle}>{item.source}</code>
                  </article>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <Card>
              <p style={label}>Provider credential board</p>
              {credentialProviders.map((provider) => (
                <article key={provider.id} style={{ borderBottom: `1px solid ${colors.border}`, padding: "12px 0" }}>
                  <span style={{ ...stateBase, ...pillStyle(provider.state) }}>{provider.state}</span>
                  <h3 style={h3}>{provider.title}</h3>
                  <p style={p}>{provider.detail}</p>
                  <p style={{ ...p, marginTop: 8 }}>{provider.credentials.length} credential names · values hidden</p>
                </article>
              ))}
            </Card>

            <Card>
              <p style={label}>Source launch gate</p>
              {gates.map((gate) => (
                <article key={gate.id} style={{ borderBottom: `1px solid ${colors.border}`, padding: "10px 0" }}>
                  <span style={{ ...stateBase, ...pillStyle(gate.state) }}>{gate.state}</span>
                  <h3 style={h3}>{gate.title}</h3>
                  <p style={p}>{gate.detail}</p>
                </article>
              ))}
            </Card>

            <Card>
              <p style={label}>Proof pack index</p>
              <p style={p}>Source pack ready: {String(proofPack?.jarvisSourcePackReady ?? false)}</p>
              <p style={p}>{proofPack?.validators?.length ?? 0} validators · {proofPack?.manifests?.length ?? 0} manifests · {proofRoutes.length} routes</p>
              {proofBlockers.map((blocker) => (
                <article key={blocker.id} style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10, marginTop: 10 }}>
                  <span style={{ ...stateBase, ...pillStyle(blocker.state) }}>{blocker.state}</span>
                  <h3 style={h3}>{blocker.title}</h3>
                  <p style={p}>{blocker.detail}</p>
                </article>
              ))}
            </Card>

            <Card>
              <p style={label}>No fake data lock</p>
              <p style={p}>Production stays false. Public launch stays false. Secret values are not returned. Browser never runs shell or reads the database directly.</p>
            </Card>
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <p style={{ margin: 0, color: "rgba(194,231,244,0.68)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</p>
      <strong style={{ display: "block", marginTop: 8, fontSize: "1.45rem" }}>{value}</strong>
    </>
  );
}

const buttonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "13px 18px",
  cursor: "pointer",
  color: "#04121f",
  fontWeight: 900,
  background: "linear-gradient(135deg, #70f7ff, #9dffcb)",
  boxShadow: "0 16px 34px rgba(0,224,255,0.18)"
};

const label = {
  margin: 0,
  color: "rgba(139,231,255,0.76)",
  fontSize: "0.72rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 900
};

const h2 = { margin: "8px 0 10px", fontSize: "1.15rem" };
const h3 = { margin: "10px 0 8px", fontSize: "0.98rem" };
const p = { margin: 0, color: colors.muted, lineHeight: 1.55 };
const listLine = { margin: "8px 0", color: colors.muted, lineHeight: 1.45 };
const gridCards = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 };
const innerCard = { border: `1px solid ${colors.border}`, borderRadius: 18, padding: 14, background: "rgba(2,9,20,0.42)" };
const stateBase = { display: "inline-block", border: "1px solid", borderRadius: 999, padding: "5px 8px", fontSize: "0.66rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" as const };
const linkStyle = { color: colors.green, fontSize: "0.82rem", overflowWrap: "anywhere" as const };
const codeStyle = { display: "block", marginTop: 10, color: colors.green, background: "rgba(0,0,0,0.24)", padding: 8, borderRadius: 10, fontSize: "0.74rem", overflowWrap: "anywhere" as const };
