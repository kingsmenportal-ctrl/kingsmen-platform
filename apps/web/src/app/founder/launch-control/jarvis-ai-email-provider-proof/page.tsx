export const dynamic = "force-dynamic";

const requirements = [
  {
    title: "AI Provider Live Call Proof",
    state: "PENDING_CREDENTIALS",
    detail: "Needs backend-controlled live provider call, provider/model selection, key outside Git, policy gate, cost boundary, and redacted evidence."
  },
  {
    title: "Email Primary Channel Proof",
    state: "PENDING_CREDENTIALS",
    detail: "Needs provider send proof, delivery or receive evidence, bounce/failed-send handling, opt-out rule, redaction, and message evidence ledger."
  }
];

const blockers = [
  "No raw AI, SMTP, or provider secrets may be returned.",
  "Browser must not call AI or Email providers directly.",
  "Mock AI completions do not count as live proof.",
  "WhatsApp/SMS cannot replace Email as the primary tracked channel.",
  "Launch stays blocked until both AI and Email evidence is accepted."
];

export default function JarvisAiEmailProviderProofPage() {
  return (
    <main style={shell}>
      <section style={frame}>
        <p style={kicker}>Kingsmen · Jarvis Live Proof Batch 2</p>
        <h1 style={title}>AI + Email Provider Proof</h1>
        <p style={lead}>
          This gate defines the real evidence required before Jarvis can claim AI and Email provider readiness. It is source-built only. Production and public launch remain false.
        </p>

        <section style={stats}>
          <article style={card}><span>Runtime live</span><strong>false</strong></article>
          <article style={card}><span>Production</span><strong>false</strong></article>
          <article style={card}><span>Public launch</span><strong>false</strong></article>
          <article style={card}><span>Provider proof</span><strong>not accepted</strong></article>
        </section>

        <section style={grid}>
          <article style={panel}>
            <h2>Proof requirements</h2>
            {requirements.map((item) => (
              <div key={item.title} style={row}>
                <span style={pill}>{item.state}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </article>

          <article style={panel}>
            <h2>Launch blockers</h2>
            {blockers.map((blocker) => <p key={blocker} style={line}>• {blocker}</p>)}
            <a href="/api/jarvis/ai-email-provider-live-proof" style={link}>Open proof gate JSON</a>
          </article>
        </section>
      </section>
    </main>
  );
}

const shell = {
  minHeight: "100vh",
  padding: 28,
  color: "#ecfbff",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  background: "radial-gradient(circle at 15% 12%, rgba(0,224,255,0.22), transparent 28%), radial-gradient(circle at 78% 18%, rgba(149,76,255,0.18), transparent 30%), linear-gradient(145deg, #040813, #071323 46%, #02040a)"
};
const frame = { maxWidth: 1320, margin: "0 auto" };
const kicker = { color: "#70f7ff", letterSpacing: "0.18em", textTransform: "uppercase" as const, fontWeight: 900 };
const title = { margin: "10px 0", fontSize: "clamp(2.6rem, 7vw, 6rem)", letterSpacing: "-0.07em", lineHeight: 0.9 };
const lead = { color: "rgba(236,251,255,0.72)", maxWidth: 900, lineHeight: 1.65 };
const stats = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "22px 0" };
const card = { border: "1px solid rgba(139,231,255,0.22)", borderRadius: 22, padding: 18, background: "rgba(8,22,39,0.86)" };
const grid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 };
const panel = { border: "1px solid rgba(139,231,255,0.22)", borderRadius: 24, padding: 22, background: "rgba(8,22,39,0.86)" };
const row = { borderTop: "1px solid rgba(139,231,255,0.18)", paddingTop: 14, marginTop: 14 };
const pill = { display: "inline-block", border: "1px solid rgba(255,227,163,0.38)", borderRadius: 999, padding: "5px 8px", color: "#ffe3a3", fontSize: "0.72rem", fontWeight: 900 };
const line = { color: "rgba(236,251,255,0.72)", lineHeight: 1.55 };
const link = { display: "inline-block", marginTop: 18, color: "#9dffcb", fontWeight: 900 };
