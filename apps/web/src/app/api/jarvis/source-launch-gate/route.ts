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
};

const gates: LaunchGate[] = [
  {
    id: "jarvis-source-design",
    title: "Jarvis Source Design",
    state: "PASSED_SOURCE",
    launchCritical: true,
    detail: "Final command HUD, completion board, provider checklist, evidence collector, live proof queue, and launch gate surfaces are source-built.",
    liveProofQueueRef: "jarvis-source-seal"
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
    detail: "Live blockers are now controlled through /api/jarvis/live-proof-queue and surfaced inside /jarvis/final.",
    liveProofQueueRef: "/api/jarvis/live-proof-queue"
  },
  {
    id: "backend-truth-vault-runtime",
    title: "Backend and Truth Vault Runtime",
    state: "BLOCKED",
    launchCritical: true,
    detail: "Requires stable API/Truth Vault proof. Local Docker instability remains the current blocker.",
    liveProofQueueRef: "docker-api-truth-vault-runtime"
  },
  {
    id: "ai-live-proof",
    title: "AI Provider Live Proof",
    state: "PENDING_PROVIDER",
    launchCritical: true,
    detail: "Requires backend-controlled live provider proof and redacted evidence.",
    liveProofQueueRef: "ai-provider-live-call"
  },
  {
    id: "email-live-proof",
    title: "Email Provider Live Proof",
    state: "PENDING_PROVIDER",
    launchCritical: true,
    detail: "Requires send, receive, bounce, opt-out, redaction, and evidence proof.",
    liveProofQueueRef: "email-primary-proof"
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Sandbox ITN Proof",
    state: "PENDING_PROVIDER",
    launchCritical: true,
    detail: "Requires sandbox checkout, accepted ITN proof, failed payment rejection, duplicate rejection, refund review, and founder approval.",
    liveProofQueueRef: "payfast-itn-proof"
  },
  {
    id: "n8n-airtable-github-proof",
    title: "n8n Airtable GitHub Runtime Proofs",
    state: "PENDING_RUNTIME",
    launchCritical: true,
    detail: "Requires n8n thin relay proof, Airtable mirror-only proof, and GitHub connector proof.",
    liveProofQueueRef: "n8n-thin-relay-proof/airtable-human-mirror-proof/github-tool-runtime-proof"
  },
  {
    id: "branch-protection-proof",
    title: "Branch Protection Proof",
    state: "PENDING_SECURITY",
    launchCritical: true,
    detail: "Requires repository branch protection evidence before launch.",
    liveProofQueueRef: "branch-protection-proof"
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
    productionReady: false,
    publicLaunchAllowed: false,
    launchAllowedReason: "Source-safe Jarvis is closer, but live proof queue runtime, provider, security, and final audit gates are not complete.",
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    liveProofQueueRoute: "/api/jarvis/live-proof-queue",
    gates,
    launchBlockingCount: launchBlocking.length,
    launchBlocking,
    nextAction: "Work the live proof queue until runtime, provider, and security gates can pass."
  });
}
