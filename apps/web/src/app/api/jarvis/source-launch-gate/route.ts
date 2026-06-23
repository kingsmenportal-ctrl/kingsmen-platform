import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LaunchGate = {
  id: string;
  title: string;
  state: "PASSED_SOURCE" | "PENDING_RUNTIME" | "PENDING_PROVIDER" | "PENDING_SECURITY" | "BLOCKED" | "DEFERRED";
  launchCritical: boolean;
  detail: string;
  liveProofQueueRef?: string;
  acceptanceGateRef?: string;
  proofGateRoute?: string;
};

const gates: LaunchGate[] = [
  {
    id: "jarvis-source-design",
    title: "Jarvis Source Design",
    state: "PASSED_SOURCE",
    launchCritical: true,
    detail: "Final command HUD, completion board, provider checklist, evidence collector, live proof queue, acceptance gate, final audit gate, and launch gate surfaces are source-built.",
    liveProofQueueRef: "jarvis-source-seal",
    acceptanceGateRef: "source-design-seal-acceptance"
  },
  {
    id: "no-fake-data-lock",
    title: "No Fake Data Lock",
    state: "PASSED_SOURCE",
    launchCritical: true,
    detail: "Unavailable runtime/provider state remains unavailable and is not substituted with placeholder truth."
  },
  {
    id: "browser-boundary-lock",
    title: "Browser Boundary Lock",
    state: "PASSED_SOURCE",
    launchCritical: true,
    detail: "Jarvis web surfaces do not run local shell, do not write local files, do not read the database directly, and do not return provider values."
  },
  {
    id: "live-proof-queue-control",
    title: "Live Proof Queue Control",
    state: "PASSED_SOURCE",
    launchCritical: true,
    detail: "Live blockers are controlled through /api/jarvis/live-proof-queue and surfaced inside /jarvis/final.",
    liveProofQueueRef: "/api/jarvis/live-proof-queue"
  },
  {
    id: "live-proof-acceptance-gate-control",
    title: "Live Proof Acceptance Gate Control",
    state: "PASSED_SOURCE",
    launchCritical: true,
    detail: "Acceptance rules are controlled through /api/jarvis/live-proof-acceptance-gate and must decide ACCEPT before launch can pass.",
    acceptanceGateRef: "/api/jarvis/live-proof-acceptance-gate"
  },
  {
    id: "backend-truth-vault-runtime",
    title: "Backend and Truth Vault Runtime",
    state: "BLOCKED",
    launchCritical: true,
    detail: "Requires stable API/Truth Vault proof. Local Docker instability remains the current blocker.",
    liveProofQueueRef: "docker-api-truth-vault-runtime",
    acceptanceGateRef: "docker-api-truth-vault-acceptance",
    proofGateRoute: "/api/jarvis/docker-truth-vault-runtime-proof"
  },
  {
    id: "ai-live-proof",
    title: "AI Provider Live Proof",
    state: "PENDING_PROVIDER",
    launchCritical: true,
    detail: "Requires backend-controlled live provider proof and redacted evidence.",
    liveProofQueueRef: "ai-provider-live-call",
    acceptanceGateRef: "ai-provider-acceptance",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof"
  },
  {
    id: "email-live-proof",
    title: "Email Provider Live Proof",
    state: "PENDING_PROVIDER",
    launchCritical: true,
    detail: "Requires send, receive, bounce, opt-out, redaction, and evidence proof.",
    liveProofQueueRef: "email-primary-proof",
    acceptanceGateRef: "email-primary-acceptance",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof"
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Sandbox ITN Proof",
    state: "PENDING_PROVIDER",
    launchCritical: true,
    detail: "Requires sandbox checkout, accepted ITN proof, failed payment rejection, duplicate rejection, refund review, and founder approval.",
    liveProofQueueRef: "payfast-itn-proof",
    acceptanceGateRef: "payfast-itn-acceptance",
    proofGateRoute: "/api/jarvis/payfast-accepted-itn-proof"
  },
  {
    id: "n8n-airtable-github-proof",
    title: "n8n Airtable GitHub Runtime Proofs",
    state: "PENDING_RUNTIME",
    launchCritical: true,
    detail: "Requires n8n thin relay proof, Airtable mirror-only proof, GitHub connector proof, Truth Vault authority proof, and redacted provider-tool evidence.",
    liveProofQueueRef: "n8n-thin-relay-proof/airtable-human-mirror-proof/github-tool-runtime-proof",
    acceptanceGateRef: "n8n-airtable-github-acceptance",
    proofGateRoute: "/api/jarvis/n8n-airtable-github-runtime-proof"
  },
  {
    id: "branch-protection-proof",
    title: "Branch Protection and Final Launch Audit Proof",
    state: "PENDING_SECURITY",
    launchCritical: true,
    detail: "Requires repository branch protection, required checks, rollback proof, final staging evidence pack, final launch audit, and founder launch approval before launch.",
    liveProofQueueRef: "branch-protection-proof",
    acceptanceGateRef: "branch-protection-launch-audit-acceptance",
    proofGateRoute: "/api/jarvis/branch-protection-final-launch-audit"
  },
  {
    id: "whatsapp-cost-gate",
    title: "WhatsApp Cost Gate",
    state: "DEFERRED",
    launchCritical: false,
    detail: "WhatsApp remains urgent-only and deferred until cost-justified. SMS remains backup only."
  }
];

const launchBlocking = gates.filter((gate) => gate.launchCritical && gate.state !== "PASSED_SOURCE");

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-source-launch-gate.v1",
    module: "Jarvis Source Launch Gate",
    generatedAt: new Date().toISOString(),
    jarvisSourceComplete: true,
    jarvisLiveProofQueueConnected: true,
    jarvisLiveProofAcceptanceGateConnected: true,
    jarvisN8nAirtableGithubRuntimeProofGateConnected: true,
    jarvisBranchProtectionFinalLaunchAuditGateConnected: true,
    productionReady: false,
    publicLaunchAllowed: false,
    launchAllowedReason: "Source-safe Jarvis is closer, but live proof queue and acceptance gate runtime, provider, security, and final audit gates are not complete.",
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    liveProofQueueRoute: "/api/jarvis/live-proof-queue",
    liveProofAcceptanceGateRoute: "/api/jarvis/live-proof-acceptance-gate",
    n8nAirtableGithubRuntimeProofGateRoute: "/api/jarvis/n8n-airtable-github-runtime-proof",
    branchProtectionFinalLaunchAuditGateRoute: "/api/jarvis/branch-protection-final-launch-audit",
    gates,
    launchBlockingCount: launchBlocking.length,
    launchBlocking,
    nextAction: "Work the live proof queue and acceptance gate until runtime, provider, security, and final audit gates can pass."
  });
}
