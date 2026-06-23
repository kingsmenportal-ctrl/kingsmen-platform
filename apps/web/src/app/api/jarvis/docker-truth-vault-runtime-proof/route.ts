import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeProofCheck = {
  id: string;
  title: string;
  state: "SOURCE_READY" | "WAITING_FOR_RUNTIME" | "BLOCKED_BY_LOCAL_DOCKER" | "PENDING_EVIDENCE";
  launchCritical: boolean;
  detail: string;
  expectedEvidence: string[];
};

const captureRunner = "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs";
const captureReport = "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json";
const captureValidator = "scripts/validators/validate-jarvis-docker-truth-vault-runtime-evidence-capture.mjs";

const checks: RuntimeProofCheck[] = [
  {
    id: "docker-engine-reachable",
    title: "Docker Engine Reachable",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    launchCritical: true,
    detail: "Local Docker engine must be reachable before backend, Redis, PostgreSQL, and API runtime evidence can be captured.",
    expectedEvidence: [
      "Docker engine responds",
      "kingsmen-truth-vault-local container running",
      "kingsmen-redis-local container running",
      "no Docker pipe error"
    ]
  },
  {
    id: "api-health-200",
    title: "API Health HTTP 200",
    state: "WAITING_FOR_RUNTIME",
    launchCritical: true,
    detail: "Backend health must return HTTP 200 through the API, not through browser-side database access.",
    expectedEvidence: [
      "GET http://127.0.0.1:3001/api/system/health returns 200",
      "service is kingsmen-api",
      "storage mode is postgres_truth_vault",
      "finance health is available or correctly blocked with diagnostics"
    ]
  },
  {
    id: "truth-vault-authority",
    title: "Truth Vault Authority",
    state: "WAITING_FOR_RUNTIME",
    launchCritical: true,
    detail: "PostgreSQL Truth Vault must be authoritative. Airtable and n8n may never become authority.",
    expectedEvidence: [
      "postgres_truth_vault storage mode",
      "command_log write proof",
      "audit_events write proof",
      "RLS/policy boundary proof where applicable"
    ]
  },
  {
    id: "jarvis-command-audit-write",
    title: "Jarvis Command Audit Write",
    state: "WAITING_FOR_RUNTIME",
    launchCritical: true,
    detail: "Jarvis command submission must create backend-controlled command and audit evidence.",
    expectedEvidence: [
      "Jarvis command accepted by backend",
      "command_log record created",
      "audit_events record created",
      "correlation id present",
      "no browser direct DB write"
    ]
  },
  {
    id: "runtime-evidence-capture-runner",
    title: "Runtime Evidence Capture Runner",
    state: "SOURCE_READY",
    launchCritical: true,
    detail: "A redacted HTTP-only capture runner is available to collect API health, postgres_truth_vault storage mode, command acceptance, and indirect command_log/audit_events write proof when runtime is available.",
    expectedEvidence: [
      captureRunner,
      captureReport,
      captureValidator,
      "rawSecretsReturned false",
      "directDatabaseAccessFromWeb false"
    ]
  },
  {
    id: "runtime-redaction-lock",
    title: "Runtime Redaction Lock",
    state: "SOURCE_READY",
    launchCritical: true,
    detail: "Runtime proof must print only redacted evidence and must never expose raw secrets.",
    expectedEvidence: [
      "rawSecretsReturned false",
      "secretValuesReturned false",
      "localShellExecuted false from web",
      "directDatabaseAccessFromWeb false"
    ]
  }
];

const blockingChecks = checks.filter((check) => check.launchCritical && check.state !== "SOURCE_READY");

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-docker-truth-vault-runtime-proof.v1",
    module: "Jarvis Docker / API / Truth Vault Runtime Proof Gate",
    generatedAt: new Date().toISOString(),
    batch: "LIVE_PROOF_BATCH_1",
    jarvisSourceDesignClosedOut: true,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    runtimeProofAccepted: false,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    localFileWritten: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    postgresTruthVaultRemainsAuthority: true,
    airtableMirrorOnly: true,
    n8nThinRelayOnly: true,
    captureRunner,
    captureReport,
    captureValidator,
    checks,
    blockingCheckCount: blockingChecks.length,
    blockingChecks,
    acceptanceRoute: "/api/jarvis/live-proof-acceptance-gate",
    evidenceLedgerRoute: "/api/jarvis/live-proof-evidence-ledger",
    liveProofQueueRoute: "/api/jarvis/live-proof-queue",
    nextAction: "Run the redacted runtime capture only when Docker/API/Truth Vault runtime is available; do not mark Jarvis live until accepted evidence exists."
  });
}
