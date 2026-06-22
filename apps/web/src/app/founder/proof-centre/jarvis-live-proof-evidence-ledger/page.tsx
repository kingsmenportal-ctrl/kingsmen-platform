const ledgerItems = [
  ["source-seal-evidence", "SOURCE_READY", "Jarvis Source Seal Evidence", "Source validators and false production flags."],
  ["openclaw-evidence", "ACCEPTED_PREVIOUSLY", "OpenClaw Operator Policy Evidence", "Operator-only proof already captured."],
  ["playwright-map-evidence", "ACCEPTED_PREVIOUSLY", "Playwright Scout MAP Fallback Evidence", "Scout-only and MAP fallback proof already captured."],
  ["docker-api-truth-vault-evidence", "BLOCKED", "Docker API Truth Vault Runtime Evidence", "API health and Truth Vault runtime proof are still blocked."],
  ["ai-live-call-evidence", "MISSING", "AI Provider Live Call Evidence", "Needs redacted backend-controlled live-call proof."],
  ["email-primary-evidence", "MISSING", "Email Primary Channel Evidence", "Needs send, bounce, opt-out, redaction, and ledger proof."],
  ["payfast-itn-evidence", "MISSING", "PayFast Accepted ITN Evidence", "Needs sandbox checkout and accepted ITN proof."],
  ["n8n-airtable-github-evidence", "MISSING", "n8n Airtable GitHub Runtime Evidence", "Needs tool runtime proof without authority leakage."],
  ["branch-protection-launch-audit-evidence", "MISSING", "Branch Protection Final Launch Audit Evidence", "Needs branch protection, required checks, rollback, and final launch audit."
  ]
];

export const dynamic = "force-dynamic";

export default function JarvisLiveProofEvidenceLedgerPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={labelStyle}>Kingsmen Jarvis · Live proof evidence ledger</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 0.92 }}>Evidence decides live</h1>
        <p style={{ maxWidth: 940, color: "rgba(236,251,255,0.74)", lineHeight: 1.65 }}>
          This page shows the live proof evidence ledger without storing or exposing secrets. Missing runtime/provider/security evidence keeps Jarvis blocked from public launch. Accepted evidence must be redacted, policy-gated, and attached to the proof pack.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "24px 0" }}>
          <article style={cardStyle}><span style={labelStyle}>Runtime live</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Production ready</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Public launch</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Secrets returned</span><strong>false</strong></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
          {ledgerItems.map(([id, state, title, detail]) => (
            <article key={id} style={cardStyle}>
              <span style={labelStyle}>{state}</span>
              <h2 style={{ margin: "10px 0", fontSize: "1.1rem" }}>{title}</h2>
              <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{detail}</p>
              <code style={{ color: "#9dffcb" }}>{id}</code>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

const cardStyle = {
  border: "1px solid rgba(139,231,255,0.2)",
  borderRadius: 22,
  padding: 18,
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
