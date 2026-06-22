const sourceComplete = [
  "Final Jarvis command room",
  "Completion board",
  "Provider checklist without secrets",
  "Evidence collector",
  "Source launch gate",
  "Proof-pack index",
  "Final launch-control board"
];

const stillRequired = [
  "Backend and Truth Vault runtime proof after Docker/API stabilizes",
  "Provider runtime proofs with credentials outside Git",
  "AI, email, payment, n8n, Airtable, GitHub, and storage evidence",
  "Branch protection, staging evidence pack, and launch audit"
];

export const dynamic = "force-dynamic";

export default function JarvisSourceSealPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1320, margin: "0 auto" }}>
        <p style={{ color: "#6ff7ff", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>Kingsmen Jarvis · Source completion seal</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.6rem, 7vw, 5.8rem)", lineHeight: 0.9 }}>Jarvis source/design sealed</h1>
        <p style={{ maxWidth: 980, color: "rgba(236,251,255,0.74)", lineHeight: 1.65 }}>
          Jarvis source/design is now sealed as a Docker-independent command room. This does not mean production live. Runtime, provider, security, and launch evidence still block public launch until each gate passes.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "24px 0" }}>
          <article style={cardStyle}><span style={labelStyle}>Source/design</span><strong>complete</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Runtime live</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Production ready</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Public launch</span><strong>false</strong></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
          <article style={cardStyle}>
            <span style={labelStyle}>SOURCE COMPLETE</span>
            <h2>Built surfaces</h2>
            <ul style={listStyle}>
              {sourceComplete.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article style={cardStyle}>
            <span style={labelStyle}>STILL BLOCKING LIVE</span>
            <h2>Remaining proof gates</h2>
            <ul style={listStyle}>
              {stillRequired.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </section>

        <section style={{ ...cardStyle, marginTop: 16 }}>
          <span style={labelStyle}>BOUNDARY LOCK</span>
          <p style={{ color: "rgba(236,251,255,0.76)", lineHeight: 1.65 }}>
            No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
          </p>
        </section>
      </section>
    </main>
  );
}

const cardStyle = {
  border: "1px solid rgba(139,231,255,0.2)",
  borderRadius: 22,
  padding: 20,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const labelStyle = {
  display: "block",
  color: "rgba(139,231,255,0.74)",
  fontSize: "0.72rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  fontWeight: 900
};

const listStyle = {
  paddingLeft: 18,
  color: "rgba(236,251,255,0.78)",
  lineHeight: 1.85
};
