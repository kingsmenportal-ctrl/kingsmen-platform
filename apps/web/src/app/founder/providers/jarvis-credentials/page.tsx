const providers = [
  {
    id: "ai-provider-router",
    title: "AI Provider Router",
    state: "PENDING_CREDENTIALS",
    detail: "Real AI provider, model, and API key must be stored outside Git before runtime proof.",
    credentials: ["KINGSMEN_AI_PROVIDER", "KINGSMEN_AI_MODEL", "OPENAI_API_KEY"]
  },
  {
    id: "n8n-thin-relay",
    title: "n8n Thin Relay",
    state: "PENDING_CREDENTIALS",
    detail: "n8n remains a thin relay only and never becomes source of truth.",
    credentials: ["KINGSMEN_N8N_BASE_URL", "KINGSMEN_N8N_API_KEY", "KINGSMEN_N8N_WEBHOOK_SECRET"]
  },
  {
    id: "airtable-human-mirror",
    title: "Airtable Human Mirror",
    state: "PENDING_CREDENTIALS",
    detail: "Airtable remains a human mirror only; PostgreSQL Truth Vault remains authority.",
    credentials: ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID", "AIRTABLE_KINGSMEN_TABLE"]
  },
  {
    id: "email-primary-channel",
    title: "Email Primary Channel",
    state: "PENDING_CREDENTIALS",
    detail: "Email remains the primary tracked communication channel with evidence ledger.",
    credentials: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"]
  },
  {
    id: "payfast-provider-proof-queue",
    title: "PayFast Provider Proof Queue",
    state: "PENDING_CREDENTIALS",
    detail: "Accepted sandbox ITN proof and founder approval are required before payment launch.",
    credentials: ["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY", "PAYFAST_PASSPHRASE", "PAYFAST_NOTIFY_URL", "PAYMENT_PROVIDER_SECRET"]
  },
  {
    id: "whatsapp-urgent-sms-backup",
    title: "WhatsApp Urgent / SMS Backup",
    state: "DEFERRED",
    detail: "WhatsApp is urgent-only and SMS is backup-only. No bulk messaging.",
    credentials: ["WHATSAPP_BUSINESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "SMS_PROVIDER_API_KEY", "SMS_SENDER_ID"]
  },
  {
    id: "document-vault-storage",
    title: "Document Vault Storage",
    state: "PENDING_CREDENTIALS",
    detail: "Storage provider holds files only; Truth Vault/RLS controls metadata and evidence.",
    credentials: ["STORAGE_ACCESS_KEY", "STORAGE_SECRET_KEY", "STORAGE_BUCKET", "STORAGE_REGION"]
  }
];

export const dynamic = "force-dynamic";

export default function JarvisCredentialChecklistPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ color: "#6ff7ff", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>Kingsmen Jarvis · Provider credential checklist</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 0.92 }}>No secrets on screen</h1>
        <p style={{ maxWidth: 920, color: "rgba(236,251,255,0.74)", lineHeight: 1.65 }}>
          This founder-only source screen lists missing provider credential names and runtime proof boundaries without returning secret values. Docker/API runtime proof remains separate. Production readiness stays false until real provider evidence, staging proof, branch protection, and launch gates pass.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "24px 0" }}>
          <article style={cardStyle}><span style={labelStyle}>Production ready</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Public launch</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Secrets returned</span><strong>false</strong></article>
          <article style={cardStyle}><span style={labelStyle}>Docker independent</span><strong>true</strong></article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
          {providers.map((provider) => (
            <article key={provider.id} style={cardStyle}>
              <span style={labelStyle}>{provider.state}</span>
              <h2 style={{ margin: "10px 0", fontSize: "1.1rem" }}>{provider.title}</h2>
              <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{provider.detail}</p>
              <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
                {provider.credentials.map((name) => <li key={name}><code>{name}</code></li>)}
              </ul>
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
