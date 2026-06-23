import Link from "next/link";

export const dynamic = "force-dynamic";

type AcceptancePackPayload = {
  module: string;
  generatedAt: string;
  jarvisSourceDesignClosedOut: boolean;
  allCaptureRunnersBuilt: boolean;
  liveEvidenceAccepted: boolean;
  acceptanceDecision: string;
  jarvisRuntimeLive: boolean;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  launchBlocked: boolean;
  acceptanceRunner: string;
  acceptanceReportPath: string;
  acceptanceValidator: string;
  acceptancePack: Array<{
    id: string;
    title: string;
    state: string;
    launchCritical: boolean;
    captureRunner: string;
    captureReportPath: string;
    proofGateRoute: string;
    acceptedEvidenceRequired: string[];
    detail: string;
  }>;
  nextAction: string;
};

async function getPack(): Promise<AcceptancePackPayload | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
    const response = await fetch(`${baseUrl}/api/jarvis/live-evidence-acceptance-pack`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as AcceptancePackPayload;
  } catch {
    return null;
  }
}

const panel: React.CSSProperties = {
  border: "1px solid rgba(139,231,255,0.22)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const pill: React.CSSProperties = {
  display: "inline-block",
  border: "1px solid rgba(255,227,163,0.38)",
  borderRadius: 999,
  padding: "5px 9px",
  color: "#ffe3a3",
  background: "rgba(255,227,163,0.10)",
  fontSize: "0.68rem",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

export default async function JarvisLiveEvidenceAcceptancePackPage() {
  const pack = await getPack();

  return (
    <main style={{ minHeight: "100vh", padding: 28, color: "#ecfbff", background: "linear-gradient(145deg,#040813,#071323 46%,#02040a)", fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <section style={{ maxWidth: 1500, margin: "0 auto", display: "grid", gap: 18 }}>
        <div style={panel}>
          <p style={{ color: "#70f7ff", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 900, margin: 0 }}>Kingsmen · Jarvis Launch Control</p>
          <h1 style={{ margin: "10px 0", fontSize: "clamp(2.3rem, 7vw, 5.8rem)", letterSpacing: "-0.07em" }}>Live Evidence Acceptance Pack</h1>
          <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.65, maxWidth: 940 }}>
            This is the final pack runner surface. It does not fake readiness. It waits for real accepted runtime, provider, payment, and launch-audit evidence before any live claim can move forward.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/jarvis/final" style={{ color: "#9dffcb" }}>Final HUD</Link>
            <Link href="/founder/launch-control/jarvis-live-proof-runbook" style={{ color: "#9dffcb" }}>Runbook</Link>
            <Link href="/founder/proof-centre/jarvis-live-proof-evidence-ledger" style={{ color: "#9dffcb" }}>Evidence ledger</Link>
            <Link href="/api/jarvis/live-evidence-acceptance-pack" style={{ color: "#9dffcb" }}>Acceptance pack JSON</Link>
          </div>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {[
            ["Source closed", String(pack?.jarvisSourceDesignClosedOut ?? false)],
            ["Runners built", String(pack?.allCaptureRunnersBuilt ?? false)],
            ["Evidence accepted", String(pack?.liveEvidenceAccepted ?? false)],
            ["Runtime live", String(pack?.jarvisRuntimeLive ?? false)],
            ["Production", String(pack?.productionReady ?? false)],
            ["Public launch", String(pack?.publicLaunchAllowed ?? false)],
            ["Decision", pack?.acceptanceDecision ?? "UNAVAILABLE"]
          ].map(([label, value]) => (
            <article key={label} style={panel}>
              <p style={{ margin: 0, color: "rgba(194,231,244,0.68)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.72rem" }}>{label}</p>
              <strong style={{ display: "block", marginTop: 8, fontSize: "1.15rem" }}>{value}</strong>
            </article>
          ))}
        </section>

        <div style={panel}>
          <p style={{ margin: 0, color: "#70f7ff", fontWeight: 900 }}>Runner</p>
          <code style={{ display: "block", marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.28)", color: "#9dffcb", overflowWrap: "anywhere" }}>{pack?.acceptanceRunner ?? "unavailable"}</code>
          <code style={{ display: "block", marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.28)", color: "#9dffcb", overflowWrap: "anywhere" }}>{pack?.acceptanceReportPath ?? "unavailable"}</code>
          <code style={{ display: "block", marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.28)", color: "#9dffcb", overflowWrap: "anywhere" }}>{pack?.acceptanceValidator ?? "unavailable"}</code>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
          {(pack?.acceptancePack ?? []).map((item) => (
            <article key={item.id} style={panel}>
              <span style={pill}>{item.state}</span>
              <h2 style={{ margin: "12px 0 8px" }}>{item.title}</h2>
              <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{item.detail}</p>
              <code style={{ display: "block", marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.24)", color: "#9dffcb", overflowWrap: "anywhere" }}>{item.captureRunner}</code>
              <p style={{ color: "rgba(236,251,255,0.72)", marginTop: 12 }}>Accepted evidence required:</p>
              <ul style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>
                {item.acceptedEvidenceRequired.map((evidence) => <li key={evidence}>{evidence}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <div style={panel}>
          <p style={{ color: "#ffe3a3", margin: 0 }}>{pack?.nextAction ?? "Waiting for live evidence acceptance pack."}</p>
        </div>
      </section>
    </main>
  );
}
