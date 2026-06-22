const proofQueue = [
  {
    id: "jarvis-source-seal",
    title: "Jarvis Source / Design Seal",
    state: "SOURCE_READY",
    detail: "Jarvis source/design is ready to validate without Docker. Runtime live status remains false."
  },
  {
    id: "docker-api-truth-vault-runtime",
    title: "Docker / API / Truth Vault Runtime",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    detail: "Backend and Truth Vault runtime proof is blocked by local Docker instability."
  },
  {
    id: "ai-provider-live-call",
    title: "AI Provider Live Call",
    state: "PENDING_CREDENTIALS",
    detail: "Requires backend-controlled provider credentials and redacted live-call proof."
  },
  {
    id: "email-primary-proof",
    title: "Email Primary Channel Proof",
    state: "PENDING_CREDENTIALS",
    detail: "Requires send, bounce, opt-out, redaction, and evidence ledger proof."
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Sandbox Accepted ITN Proof",
    state: "BLOCKED_BY_PROVIDER_EVIDENCE",
    detail: "Requires accepted sandbox ITN proof before any paid state can be trusted."
  },
  {
    id: "n8n-thin-relay-proof",
    title: "n8n Thin Relay Proof",
    state: "PENDING_CREDENTIALS",
    detail: "Requires backend-mediated relay proof and no direct browser-to-n8n calls."
  },
  {
    id: "airtable-human-mirror-proof",
    title: "Airtable Human Mirror Proof",
    state: "PENDING_CREDENTIALS",
    detail: "Requires mirror-only proof while Truth Vault remains authority."
  },
  {
    id: "github-tool-runtime-proof",
    title: "GitHub Tool Connector Proof",
    state: "READY_FOR_RUNTIME_WHEN_AVAILABLE",
    detail: "Requires redacted GitHub runtime evidence and no token exposure."
  },
  {
    id: "branch-protection-proof",
    title: "Branch Protection / Release Gate Proof",
    state: "BLOCKED_BY_SECURITY_GATE",
    detail: "Requires main branch protection, status checks, rollback evidence, and launch audit."
  }
];

export const dynamic = "force-dynamic";

export default function JarvisLiveProofQueuePage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={kicker}>Kingsmen Jarvis · live proof queue</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.5rem, 7vw, 5.4rem)", lineHeight: 0.92 }}>What still blocks LIVE</h1>
        <p style={intro}>
          This page does not run Docker, providers, shell commands, or database calls. It shows the remaining live proof queue clearly so Jarvis can move from source-ready to production-ready without fake claims.
        </p>

        <section style={summaryGrid}>
          <article style={card}><span style={label}>Source/design</span><strong>true</strong></article>
          <article style={card}><span style={label}>Runtime live</span><strong>false</strong></article>
          <article style={card}><span style={label}>Production ready</span><strong>false</strong></article>
          <article style={card}><span style={label}>Public launch</span><strong>false</strong></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
          {proofQueue.map((item) => (
            <article key={item.id} style={card}>
              <span style={stateLabel(item.state)}>{item.state}</span>
              <h2 style={{ margin: "12px 0 10px", fontSize: "1.1rem" }}>{item.title}</h2>
              <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{item.detail}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

const kicker = {
  color: "#6ff7ff",
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
};

const intro = {
  maxWidth: 920,
  color: "rgba(236,251,255,0.74)",
  lineHeight: 1.65
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  margin: "24px 0"
};

const card = {
  border: "1px solid rgba(139,231,255,0.2)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const label = {
  display: "block",
  color: "rgba(139,231,255,0.74)",
  fontSize: "0.72rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  fontWeight: 900
};

function stateLabel(state: string) {
  const color = state === "SOURCE_READY"
    ? "#9dffcb"
    : state.includes("BLOCKED")
      ? "#ffc9c9"
      : "#ffe3a3";
  return {
    ...label,
    color
  };
}
