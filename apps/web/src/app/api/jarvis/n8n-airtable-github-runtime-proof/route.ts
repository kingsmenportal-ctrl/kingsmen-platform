import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ToolGate = {
  id: string;
  title: string;
  state: "PENDING_CREDENTIALS" | "PENDING_RUNTIME_EVIDENCE" | "BLOCKED_UNTIL_BACKEND_PROOF";
  launchCritical: boolean;
  authorityRule: string;
  requiredEvidence: string[];
  rejectionRules: string[];
  proofScript?: string;
};

const toolGates: ToolGate[] = [
  {
    id: "n8n-thin-relay-runtime-proof",
    title: "n8n Thin Relay Runtime Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    authorityRule: "n8n may orchestrate thin relay workflows only. It may not become authority, may not write Truth Vault directly, and may not be called directly by the browser.",
    requiredEvidence: [
      "KINGSMEN_N8N_BASE_URL stored outside Git",
      "KINGSMEN_N8N_API_KEY stored outside Git",
      "KINGSMEN_N8N_WEBHOOK_SECRET stored outside Git",
      "backend-mediated command proof",
      "webhook signature or shared secret verification proof",
      "no direct browser-to-n8n call proof",
      "Truth Vault remains authority proof",
      "redacted runtime output"
    ],
    rejectionRules: [
      "reject if n8n writes directly to Truth Vault",
      "reject if browser calls n8n directly",
      "reject if n8n becomes source of truth",
      "reject if raw API key or webhook secret is printed",
      "reject if runtime proof is only a static source route"
    ],
    proofScript: "npm run jarvis:runtime:n8n-thin-relay"
  },
  {
    id: "airtable-human-mirror-runtime-proof",
    title: "Airtable Human Mirror Runtime Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    authorityRule: "Airtable is a human mirror only. PostgreSQL Truth Vault remains the system of record and reconciliation authority.",
    requiredEvidence: [
      "AIRTABLE_API_KEY stored outside Git",
      "AIRTABLE_BASE_ID stored outside Git",
      "AIRTABLE_KINGSMEN_TABLE stored outside Git",
      "mirror write proof from backend only",
      "Truth Vault source record proof",
      "reconciliation proof",
      "redacted Airtable metadata proof"
    ],
    rejectionRules: [
      "reject if Airtable becomes authority",
      "reject if Airtable overwrites Truth Vault without review",
      "reject if raw Airtable key is printed",
      "reject if browser writes to Airtable directly",
      "reject if reconciliation evidence is missing"
    ],
    proofScript: "npm run jarvis:runtime:airtable-human-mirror"
  },
  {
    id: "github-tool-connector-runtime-proof",
    title: "GitHub Tool Connector Runtime Proof",
    state: "PENDING_RUNTIME_EVIDENCE",
    launchCritical: true,
    authorityRule: "GitHub connector may provide controlled repository evidence and writes only through explicit founder-approved tool actions. Tokens must never be returned.",
    requiredEvidence: [
      "redacted repo metadata proof",
      "controlled connector action proof",
      "no token exposure proof",
      "branch and PR context proof",
      "audit trail or connector action trace",
      "no fake commit status proof"
    ],
    rejectionRules: [
      "reject if GitHub token is exposed",
      "reject if connector writes without explicit instruction",
      "reject if repo status is guessed",
      "reject if evidence lacks redaction",
      "reject if branch protection proof is replaced by GitHub metadata only"
    ],
    proofScript: "npm run jarvis:runtime:github-tool-boundary"
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-n8n-airtable-github-runtime-proof.v1",
    module: "Jarvis n8n Airtable GitHub Runtime Proof Gate",
    generatedAt: new Date().toISOString(),
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    providerToolProofAccepted: false,
    n8nThinRelayAccepted: false,
    airtableMirrorAccepted: false,
    githubConnectorAccepted: false,
    launchBlocked: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    postgresTruthVaultRemainsAuthority: true,
    n8nThinRelayOnly: true,
    airtableMirrorOnly: true,
    githubTokensMayBeReturned: false,
    toolGates,
    nextAction: "Capture real n8n, Airtable, and GitHub connector runtime evidence with secrets outside Git before this gate can be accepted."
  });
}
