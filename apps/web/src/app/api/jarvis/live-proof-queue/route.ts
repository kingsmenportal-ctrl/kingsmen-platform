import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProofState = "SOURCE_READY" | "READY_FOR_RUNTIME_WHEN_AVAILABLE" | "PENDING_CREDENTIALS" | "BLOCKED_BY_LOCAL_DOCKER" | "BLOCKED_BY_PROVIDER_EVIDENCE" | "BLOCKED_BY_SECURITY_GATE";

type ProofQueueItem = {
  id: string;
  title: string;
  state: ProofState;
  owner: "founder" | "jarvis" | "provider" | "runtime" | "security";
  launchCritical: boolean;
  detail: string;
  proofRoute?: string;
  proofScript?: string;
  evidenceRequired: string[];
};

const proofQueue: ProofQueueItem[] = [
  {
    id: "jarvis-source-seal",
    title: "Jarvis Source / Design Seal",
    state: "SOURCE_READY",
    owner: "jarvis",
    launchCritical: true,
    detail: "Jarvis source/design surfaces are ready to validate without Docker. This does not claim runtime live status.",
    proofRoute: "/api/jarvis/source-completion-seal",
    evidenceRequired: ["Source seal response", "final HUD source map", "no fake readiness flags"]
  },
  {
    id: "docker-api-truth-vault-runtime",
    title: "Docker / API / Truth Vault Runtime",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    owner: "runtime",
    launchCritical: true,
    detail: "Local Docker instability blocks backend runtime proof only. Source completion remains valid, but live launch cannot pass until backend and Truth Vault are proven.",
    proofRoute: "/api/jarvis/docker-truth-vault-runtime-proof",
    proofScript: "npm run api:start:local -- -KillExistingPort",
    evidenceRequired: ["API health HTTP 200", "postgres_truth_vault storage mode", "command log write proof", "audit event write proof", "redacted runtime proof"]
  },
  {
    id: "ai-provider-live-call",
    title: "AI Provider Live Call",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    detail: "AI provider stays backend controlled. Live proof requires real provider credentials outside Git and redacted evidence of a policy-gated call.",
    proofRoute: "/api/jarvis/ai-tools-runtime-readiness",
    evidenceRequired: ["provider selected", "model selected", "key stored outside Git", "redacted live-call proof", "policy gate proof"]
  },
  {
    id: "email-primary-proof",
    title: "Email Primary Channel Proof",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    detail: "Email remains the primary communication channel. Launch needs provider evidence for send, bounce, opt-out, redaction, and evidence ledger capture.",
    proofRoute: "/api/jarvis/email-primary-channel-boundary",
    proofScript: "npm run jarvis:runtime:email-primary-channel",
    evidenceRequired: ["SMTP/provider credential readiness", "test send evidence", "bounce/failed-send handling", "opt-out rule", "message evidence ledger"]
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Sandbox Accepted ITN Proof",
    state: "BLOCKED_BY_PROVIDER_EVIDENCE",
    owner: "provider",
    launchCritical: true,
    detail: "PayFast cannot mark paid from return/cancel URLs. Only accepted ITN evidence may clear payment state, with duplicate and failed-payment rejection proof.",
    proofRoute: "/api/jarvis/payfast-provider-proof-queue-boundary",
    proofScript: "npm run jarvis:runtime:payfast-provider-proof-queue",
    evidenceRequired: ["sandbox checkout proof", "accepted ITN proof", "duplicate ITN rejection", "failed payment rejection", "refund review boundary", "founder approval"]
  },
  {
    id: "n8n-thin-relay-proof",
    title: "n8n Thin Relay Runtime Proof",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    detail: "n8n remains a thin relay only. It must not become authority and may not write directly to Truth Vault.",
    proofRoute: "/api/jarvis/n8n-thin-relay-boundary",
    proofScript: "npm run jarvis:runtime:n8n-thin-relay",
    evidenceRequired: ["base URL readiness", "API key outside Git", "webhook secret outside Git", "backend-mediated command proof", "no direct browser call"]
  },
  {
    id: "airtable-human-mirror-proof",
    title: "Airtable Human Mirror Runtime Proof",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    detail: "Airtable remains human mirror only. Truth Vault remains source of truth and reconciliation authority.",
    proofRoute: "/api/jarvis/airtable-human-mirror-boundary",
    proofScript: "npm run jarvis:runtime:airtable-human-mirror",
    evidenceRequired: ["Airtable credentials outside Git", "mirror write proof", "Truth Vault authority proof", "reconciliation proof"]
  },
  {
    id: "github-tool-runtime-proof",
    title: "GitHub Tool Connector Runtime Proof",
    state: "READY_FOR_RUNTIME_WHEN_AVAILABLE",
    owner: "jarvis",
    launchCritical: true,
    detail: "GitHub boundary needs redacted runtime evidence that tool calls are controlled and do not expose tokens.",
    proofRoute: "/api/jarvis/github-tool-connector-boundary",
    proofScript: "npm run jarvis:runtime:github-tool-boundary",
    evidenceRequired: ["redacted repo metadata", "tool boundary proof", "no token exposure", "audit trail"]
  },
  {
    id: "branch-protection-proof",
    title: "Branch Protection / Release Gate Proof",
    state: "BLOCKED_BY_SECURITY_GATE",
    owner: "security",
    launchCritical: true,
    detail: "Launch cannot pass until main branch protection, release gate, rollback, and final audit evidence are confirmed.",
    proofScript: "npm run repo:validate:branch-protection",
    evidenceRequired: ["main branch protection", "required review/status checks", "rollback evidence", "final launch audit"]
  }
];

const counts = proofQueue.reduce<Record<ProofState, number>>((acc, item) => {
  acc[item.state] = (acc[item.state] ?? 0) + 1;
  return acc;
}, {
  SOURCE_READY: 0,
  READY_FOR_RUNTIME_WHEN_AVAILABLE: 0,
  PENDING_CREDENTIALS: 0,
  BLOCKED_BY_LOCAL_DOCKER: 0,
  BLOCKED_BY_PROVIDER_EVIDENCE: 0,
  BLOCKED_BY_SECURITY_GATE: 0
});

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-live-proof-queue.v1",
    module: "Jarvis Live Proof Queue",
    generatedAt: new Date().toISOString(),
    jarvisSourceReady: true,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    counts,
    proofQueue,
    nextAction: "Clear Docker/API runtime through /api/jarvis/docker-truth-vault-runtime-proof, then provider evidence and branch/security gates before calling Jarvis live."
  });
}
