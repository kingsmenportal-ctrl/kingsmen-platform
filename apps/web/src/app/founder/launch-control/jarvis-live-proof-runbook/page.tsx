const phases = [
  {
    id: "source-seal-validate",
    title: "Validate Jarvis Source Seal",
    state: "READY_TO_RUN_WHEN_RUNTIME_AVAILABLE",
    detail: "Validate source seal and final HUD live proof queue wiring before any runtime proof."
  },
  {
    id: "docker-api-truth-vault-runtime",
    title: "Docker / API / Truth Vault Runtime",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    detail: "Runtime proof cannot pass until Docker/API/Truth Vault health is stable."
  },
  {
    id: "ai-provider-live-proof",
    title: "AI Provider Live Call",
    state: "PENDING_CREDENTIALS",
    detail: "Requires backend-controlled AI provider credentials outside Git and redacted live-call evidence."
  },
  {
    id: "email-primary-proof",
    title: "Email Primary Channel",
    state: "PENDING_CREDENTIALS",
    detail: "Requires send, bounce, opt-out, redaction, and evidence-ledger proof."
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Accepted ITN",
    state: "BLOCKED_BY_PROVIDER_EVIDENCE",
    detail: "Only accepted ITN proof may clear paid state. Return/cancel pages cannot mark paid."
  },
  {
    id: "n8n-airtable-github-runtime",
    title: "n8n / Airtable / GitHub Proof",
    state: "PENDING_CREDENTIALS",
    detail: "n8n relay, Airtable mirror, and GitHub connector must prove redacted runtime boundaries."
  },
  {
    id: "branch-protection-launch-audit",
    title: "Branch Protection / Launch Audit",
    state: "BLOCKED_BY_SECURITY_GATE",
    detail: "Branch protection, required checks, rollback, and final audit evidence are required before launch."
  }
];

export const dynamic = "force-dynamic";

export default function JarvisLiveProofRunbookPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1320, margin: "0 auto" }}>
        <p style={kicker}>Kingsmen Jarvis · Live proof runbook</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.8rem, 7vw, 5.8rem)", lineHeight: 0.9 }}>CLEAR THE LIVE QUEUE</h1>
        <p style={copy}>
          This is the founder-facing runbook for turning sealed Jarvis source/design into live runtime proof. It does not run commands from the browser, does not expose secrets, and does not mark production ready. Each blocker must clear with real evidence.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "24px 0" }}>
          <article style={card}><span style={label}>Source design</span><strong>true</strong></article>
          <article style={card}><span style={label}>Runtime live</span><strong>false</strong></article>
          <article style={card}><span style={label}>Production ready</span><strong>false</strong></article>
          <article style={card}><span style={label}>Public launch</span><strong>false</strong></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
          {phases.map((phase) => (
            <article key={phase.id} style={card}>
              <span style={label}>{phase.state}</span>
              <h2 style={{ margin: "10px 0", fontSize: "1.12rem" }}>{phase.title}</h2>
              <p style={copy}>{phase.detail}</p>
            </article>
          ))}
        </section>

        <section style={{ ...card, marginTop: 18 }}>
          <span style={label}>Launch lock</span>
          <p style={copy}>Do not call Jarvis live until the runbook phases clear. Docker/API runtime, provider credentials, PayFast ITN, branch protection, and final launch audit must produce evidence first.</p>
        </section>
      </section>
    </main>
  );
}

const kicker = { color: "#6ff7ff", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" as const };
const copy = { maxWidth: 920, color: "rgba(236,251,255,0.74)", lineHeight: 1.65 };
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
