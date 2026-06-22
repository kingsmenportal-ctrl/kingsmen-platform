import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CredentialName = {
  name: string;
  secret: boolean;
  requiredForRuntimeProof: boolean;
  valueReturned: false;
};

type ProviderChecklist = {
  id: string;
  title: string;
  state: "PENDING_CREDENTIALS" | "DEFERRED" | "SOURCE_READY";
  authorityBoundary: string;
  detail: string;
  credentials: CredentialName[];
};

function credential(name: string, secret = true, requiredForRuntimeProof = true): CredentialName {
  return {
    name,
    secret,
    requiredForRuntimeProof,
    valueReturned: false
  };
}

const providers: ProviderChecklist[] = [
  {
    id: "ai-provider-router",
    title: "AI Provider Router",
    state: "PENDING_CREDENTIALS",
    authorityBoundary: "Backend policy gate only; no browser-side AI key access.",
    detail: "Requires real provider, model, and API key outside Git before live AI runtime proof.",
    credentials: [
      credential("KINGSMEN_AI_PROVIDER", false),
      credential("KINGSMEN_AI_MODEL", false),
      credential("OPENAI_API_KEY")
    ]
  },
  {
    id: "n8n-thin-relay",
    title: "n8n Thin Relay",
    state: "PENDING_CREDENTIALS",
    authorityBoundary: "n8n may relay only; PostgreSQL Truth Vault remains authority.",
    detail: "Requires real n8n base URL, API key, and webhook secret outside Git.",
    credentials: [
      credential("KINGSMEN_N8N_BASE_URL", false),
      credential("KINGSMEN_N8N_API_KEY"),
      credential("KINGSMEN_N8N_WEBHOOK_SECRET")
    ]
  },
  {
    id: "airtable-human-mirror",
    title: "Airtable Human Mirror",
    state: "PENDING_CREDENTIALS",
    authorityBoundary: "Airtable is human mirror only and must not become source of truth.",
    detail: "Requires Airtable credentials outside Git and proof that Truth Vault remains authoritative.",
    credentials: [
      credential("AIRTABLE_API_KEY"),
      credential("AIRTABLE_BASE_ID", false),
      credential("AIRTABLE_KINGSMEN_TABLE", false)
    ]
  },
  {
    id: "email-primary-channel",
    title: "Email Primary Channel",
    state: "PENDING_CREDENTIALS",
    authorityBoundary: "Email is primary tracked communication channel with evidence ledger.",
    detail: "Requires SMTP/provider credentials and proof of send, receive, bounce, opt-out, and redaction.",
    credentials: [
      credential("SMTP_HOST", false),
      credential("SMTP_PORT", false),
      credential("SMTP_USER"),
      credential("SMTP_PASSWORD"),
      credential("EMAIL_FROM", false)
    ]
  },
  {
    id: "payfast-provider-proof-queue",
    title: "PayFast Provider Proof Queue",
    state: "PENDING_CREDENTIALS",
    authorityBoundary: "PayFast is processor/evidence source only; accepted ITN gates paid state.",
    detail: "Requires sandbox credentials, notify URL, passphrase, accepted ITN proof, and founder approval before live payment use.",
    credentials: [
      credential("PAYFAST_MERCHANT_ID"),
      credential("PAYFAST_MERCHANT_KEY"),
      credential("PAYFAST_PASSPHRASE"),
      credential("PAYFAST_NOTIFY_URL", false),
      credential("PAYMENT_PROVIDER_SECRET")
    ]
  },
  {
    id: "whatsapp-urgent-sms-backup",
    title: "WhatsApp Urgent / SMS Backup",
    state: "DEFERRED",
    authorityBoundary: "WhatsApp urgent-only; SMS backup only; no bulk messaging.",
    detail: "Deferred until cost-justified and provider proof is available.",
    credentials: [
      credential("WHATSAPP_BUSINESS_TOKEN"),
      credential("WHATSAPP_PHONE_NUMBER_ID", false),
      credential("SMS_PROVIDER_API_KEY"),
      credential("SMS_SENDER_ID", false)
    ]
  },
  {
    id: "document-vault-storage",
    title: "Document Vault Storage",
    state: "PENDING_CREDENTIALS",
    authorityBoundary: "Document metadata stays under Truth Vault/RLS; storage provider holds files only.",
    detail: "Requires storage access keys, bucket, signed URL proof, and redaction/evidence boundaries.",
    credentials: [
      credential("STORAGE_ACCESS_KEY"),
      credential("STORAGE_SECRET_KEY"),
      credential("STORAGE_BUCKET", false),
      credential("STORAGE_REGION", false)
    ]
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-provider-credential-checklist.v1",
    module: "Jarvis Provider Credential Checklist",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    credentialsStoredInGit: false,
    providers,
    nextAction: "Fill real credentials outside Git, then run provider runtime proof scripts."
  });
}
