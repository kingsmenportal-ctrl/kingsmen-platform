const gates = [
  {
    title: "n8n Thin Relay",
    state: "PENDING_CREDENTIALS",
    detail: "n8n may only relay backend-mediated commands. It cannot become authority or write Truth Vault directly."
  },
  {
    title: "Airtable Human Mirror",
    state: "PENDING_CREDENTIALS",
    detail: "Airtable is a human mirror only. Truth Vault remains the system of record and reconciliation authority."
  },
  {
    title: "GitHub Connector",
    state: "PENDING_RUNTIME_EVIDENCE",
    detail: "GitHub tool calls must be controlled, redacted, audited, and token-safe."
  }
];

const requirements = [
  "n8n base URL, API key, and webhook secret stored outside Git",
  "n8n backend-mediated command proof with no direct browser call",
  "Airtable credentials stored outside Git",
  "Airtable mirror write proof and Truth Vault reconciliation proof",
  "GitHub redacted metadata and connector action proof",
  "No raw token, API key, webhook secret, or provider credential exposure",
  "No n8n or Airtable authority takeover",
  "No fake connector status or guessed proof"
];

export const dynamic = "force-dynamic";

export default function JarvisProviderToolRuntimeProofPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, color: "#ecfbff", background: "radial-gradient(circle at 20% 10%, rgba(0,224,255,0.20), transparent 30%), linear-gradient(145deg, #040813, #071323 48%, #02040a)", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <article style={heroCard}>
          <p style={kicker}>Kingsmen · Jarvis Live Proof</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.6rem, 7vw, 5.8rem)", letterSpacing: "-0.07em", lineHeight: 0.9 }}>Provider Tool Runtime Proof</h1>
          <p style={muted}>n8n, Airtable, and GitHub are now controlled by one proof gate. This page does not run tools or read secrets. It shows what must be proven before the gate can be accepted.</p>
        </article>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <Status label="Runtime live" value="FALSE" />
          <Status label="Production" value="FALSE" />
          <Status label="Public launch" value="FALSE" />
          <Status label="Gate accepted" value="FALSE" />
        </section>

        <article style={card}>
          <p style={kicker}>Tool gates</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
            {gates.map((gate) => (
              <section key={gate.title} style={innerCard}>
                <span style={pill}>{gate.state}</span>
                <h2 style={{ margin: "10px 0 8px", fontSize: "1.05rem" }}>{gate.title}</h2>
                <p style={mutedSmall}>{gate.detail}</p>
              </section>
            ))}
          </div>
        </article>

        <article style={card}>
          <p style={kicker}>Required before acceptance</p>
          {requirements.map((item) => <p key={item} style={line}>• {item}</p>)}
        </article>

        <article style={dangerCard}>
          <p style={kicker}>Launch lock</p>
          <p style={muted}>This gate stays blocked until real runtime/provider-tool evidence exists. Browser routes cannot call n8n, Airtable, or GitHub directly, and no secret values may be returned.</p>
        </article>
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return <article style={card}><p style={kicker}>{label}</p><strong style={{ fontSize: "1.35rem" }}>{value}</strong></article>;
}

const card = { border: "1px solid rgba(139,231,255,0.22)", borderRadius: 24, padding: 20, background: "rgba(8,22,39,0.86)", boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)" };
const heroCard = { ...card, background: "linear-gradient(135deg, rgba(0,174,255,0.18), rgba(105,56,255,0.12)), rgba(7,21,38,0.92)" };
const dangerCard = { ...card, border: "1px solid rgba(255,117,117,0.34)", background: "rgba(86,24,24,0.34)" };
const innerCard = { border: "1px solid rgba(139,231,255,0.18)", borderRadius: 18, padding: 14, background: "rgba(2,9,20,0.42)" };
const kicker = { margin: "0 0 10px", color: "#70f7ff", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, fontWeight: 900 };
const muted = { color: "rgba(236,251,255,0.72)", lineHeight: 1.65, maxWidth: 900 };
const mutedSmall = { margin: 0, color: "rgba(236,251,255,0.72)", lineHeight: 1.55 };
const line = { margin: "8px 0", color: "rgba(236,251,255,0.78)", lineHeight: 1.45 };
const pill = { display: "inline-block", border: "1px solid rgba(255,227,163,0.38)", borderRadius: 999, padding: "5px 8px", color: "#ffe3a3", background: "rgba(255,227,163,0.10)", fontSize: "0.66rem", fontWeight: 900, letterSpacing: "0.08em" };
