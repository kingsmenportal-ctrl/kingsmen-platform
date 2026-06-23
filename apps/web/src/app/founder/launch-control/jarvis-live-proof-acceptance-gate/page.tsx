const gates = [
  ["ACCEPTED_SOURCE", "Source / Design Seal", "Accepted only as source/design. Runtime live still remains false."],
  ["ACCEPTED_PREVIOUS_RUNTIME", "OpenClaw + Playwright", "Accepted previous runtime proofs remain valid only while their boundaries remain locked."],
  ["BLOCKED", "Docker / API / Truth Vault", "Requires backend health HTTP 200, postgres_truth_vault mode, command log write proof, and audit write proof."],
  ["PENDING_EVIDENCE", "AI Provider", "Requires backend-controlled live-call proof with redacted request/response and no browser provider call."],
  ["PENDING_EVIDENCE", "Email Primary", "Requires send, delivery/receive, bounce, opt-out, redaction, and evidence ledger."],
  ["REJECTED_UNTIL_REAL_EVIDENCE", "PayFast Accepted ITN", "Return/cancel pages cannot mark paid. Accepted ITN proof is mandatory."],
  ["PENDING_EVIDENCE", "n8n / Airtable / GitHub", "Requires thin relay, mirror-only, controlled connector evidence, and no token exposure."],
  ["BLOCKED", "Branch Protection / Final Audit", "Requires protected branch, required checks, rollback proof, staging pack, and final audit."]
];

export const dynamic = "force-dynamic";

export default function JarvisLiveProofAcceptanceGatePage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={label}>Kingsmen Jarvis · Live proof acceptance gate</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.4rem, 7vw, 5.4rem)", lineHeight: 0.92 }}>BLOCK LAUNCH UNTIL REAL EVIDENCE</h1>
        <p style={{ maxWidth: 960, color: "rgba(236,251,255,0.74)", lineHeight: 1.65 }}>
          This page defines which evidence Jarvis may accept, which evidence remains pending, and which claims must be rejected before production. It is source-ready, Docker-independent, and does not expose secrets or mark Jarvis live.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, margin: "24px 0" }}>
          <article style={card}><span style={label}>Runtime live</span><strong>false</strong></article>
          <article style={card}><span style={label}>Production ready</span><strong>false</strong></article>
          <article style={card}><span style={label}>Public launch</span><strong>false</strong></article>
          <article style={card}><span style={label}>Decision</span><strong>BLOCK_LAUNCH</strong></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {gates.map(([state, title, detail]) => (
            <article key={title} style={card}>
              <span style={label}>{state}</span>
              <h2 style={{ margin: "10px 0", fontSize: "1.1rem" }}>{title}</h2>
              <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{detail}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

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
