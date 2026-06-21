import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompletionState = "SOURCE_READY" | "RUNTIME_PASSED" | "PENDING_RUNTIME_PROOF" | "PENDING_CREDENTIALS" | "DEFERRED" | "BLOCKED_BY_LOCAL_DOCKER";

type CompletionItem = {
  id: string;
  title: string;
  group: "foundation" | "agent" | "ai" | "tool" | "app" | "channel" | "payment" | "fallback" | "launch";
  state: CompletionState;
  detail: string;
  validatorScript?: string;
  runtimeProofScript?: string;
  boundaryRoute?: string;
  evidenceRef?: string;
  launchCritical: boolean;
};

function item(input: CompletionItem) {
  return {
    ...input,
    noFakeData: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false
  };
}

const completionItems = [
  item({
    id: "jarvis-command-surface",
    title: "Jarvis Command Surface",
    group: "agent",
    state: "SOURCE_READY",
    detail: "Jarvis page, command envelope UI, voice context, visual feed, and backend-only command boundary are source-wired. Runtime proof waits for API/Truth Vault.",
    validatorScript: "npm run jarvis:validate",
    boundaryRoute: "/api/jarvis/status",
    launchCritical: true
  }),
  item({
    id: "jarvis-live-index",
    title: "Jarvis Live Index",
    group: "agent",
    state: "SOURCE_READY",
    detail: "Live index now covers backend, Truth Vault, command envelope, AI, GitHub, Airtable, Email, PayFast, n8n, Playwright MAP fallback, OpenClaw, WhatsApp/SMS, and the completion board.",
    validatorScript: "npm run jarvis:validate:live-index-openclaw",
    boundaryRoute: "/api/jarvis/live-index",
    launchCritical: true
  }),
  item({
    id: "jarvis-completion-board",
    title: "Jarvis Completion Board",
    group: "agent",
    state: "SOURCE_READY",
    detail: "Docker-independent command center for finishing Jarvis source work while local Docker or API runtime is blocked. It does not claim production readiness.",
    validatorScript: "npm run jarvis:validate:completion-board",
    boundaryRoute: "/api/jarvis/completion-board",
    launchCritical: true
  }),
  item({
    id: "openclaw-operator-policy",
    title: "OpenClaw Operator Policy Boundary",
    group: "agent",
    state: "RUNTIME_PASSED",
    detail: "OpenClaw proof passed previously: operator-only, no policy bypass, no execution without approval, no direct Truth Vault writes, no raw secret access, no payment changes, no portal submission without MAP.",
    validatorScript: "npm run jarvis:validate:openclaw-operator-policy",
    runtimeProofScript: "npm run jarvis:runtime:openclaw-operator-policy",
    boundaryRoute: "/api/jarvis/openclaw-operator-policy-boundary",
    evidenceRef: "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
    launchCritical: false
  }),
  item({
    id: "playwright-scout-map-fallback",
    title: "Playwright Scout + MAP Fallback",
    group: "fallback",
    state: "RUNTIME_PASSED",
    detail: "Playwright boundary proof passed previously. Playwright remains scout/probe only; MAP, Phoenix fallback, and CAPTCHA/OTP manual-only boundaries stay locked.",
    validatorScript: "npm run jarvis:validate:playwright-scout-map-fallback",
    runtimeProofScript: "npm run jarvis:runtime:playwright-scout-map-fallback",
    boundaryRoute: "/api/jarvis/playwright-scout-map-fallback-boundary",
    launchCritical: true
  }),
  item({
    id: "n8n-thin-relay",
    title: "n8n Thin Relay",
    group: "tool",
    state: "PENDING_CREDENTIALS",
    detail: "n8n source and runtime boundary work, but runtime-live proof waits for real KINGSMEN_N8N_BASE_URL, KINGSMEN_N8N_API_KEY, and KINGSMEN_N8N_WEBHOOK_SECRET outside Git.",
    validatorScript: "npm run jarvis:validate:n8n-thin-relay",
    runtimeProofScript: "npm run jarvis:runtime:n8n-thin-relay",
    boundaryRoute: "/api/jarvis/n8n-thin-relay-boundary",
    launchCritical: true
  }),
  item({
    id: "github-tool-connector",
    title: "GitHub Tool Connector",
    group: "tool",
    state: "PENDING_RUNTIME_PROOF",
    detail: "GitHub boundary is source-wired. Runtime proof needs redacted repository metadata, backend command evidence, and no raw token exposure.",
    validatorScript: "npm run jarvis:validate:github-tool-boundary",
    runtimeProofScript: "npm run jarvis:runtime:github-tool-boundary",
    boundaryRoute: "/api/jarvis/github-tool-connector-boundary",
    launchCritical: true
  }),
  item({
    id: "airtable-human-mirror",
    title: "Airtable Human Mirror",
    group: "app",
    state: "PENDING_CREDENTIALS",
    detail: "Airtable remains mirror-only. Runtime proof waits for real Airtable credentials and evidence that PostgreSQL/Truth Vault remains authority.",
    validatorScript: "npm run jarvis:validate:airtable-human-mirror",
    runtimeProofScript: "npm run jarvis:runtime:airtable-human-mirror",
    boundaryRoute: "/api/jarvis/airtable-human-mirror-boundary",
    launchCritical: true
  }),
  item({
    id: "email-primary-channel",
    title: "Email Primary Channel",
    group: "channel",
    state: "PENDING_CREDENTIALS",
    detail: "Email remains primary tracked channel. Runtime proof needs provider send/receive/bounce/opt-out/redaction evidence.",
    validatorScript: "npm run jarvis:validate:email-primary-channel",
    runtimeProofScript: "npm run jarvis:runtime:email-primary-channel",
    boundaryRoute: "/api/jarvis/email-primary-channel-boundary",
    launchCritical: true
  }),
  item({
    id: "whatsapp-urgent-sms-backup",
    title: "WhatsApp Urgent / SMS Backup",
    group: "channel",
    state: "DEFERRED",
    detail: "WhatsApp remains urgent-only and cost-justified; SMS remains backup only. No bulk messaging and no channel authority over email/evidence ledger.",
    validatorScript: "npm run jarvis:validate:whatsapp-urgent-sms-backup",
    runtimeProofScript: "npm run jarvis:runtime:whatsapp-urgent-sms-backup",
    boundaryRoute: "/api/jarvis/whatsapp-urgent-sms-backup-boundary",
    launchCritical: false
  }),
  item({
    id: "payfast-provider-proof-queue",
    title: "PayFast Provider Proof Queue",
    group: "payment",
    state: "PENDING_CREDENTIALS",
    detail: "PayFast source proof is clean. Launch still requires sandbox merchant config, checkout proof, accepted ITN proof, duplicate rejection, failed payment rejection, refund review, and founder approval.",
    validatorScript: "npm run jarvis:validate:payfast-provider-proof-queue",
    runtimeProofScript: "npm run jarvis:runtime:payfast-provider-proof-queue",
    boundaryRoute: "/api/jarvis/payfast-provider-proof-queue-boundary",
    launchCritical: true
  }),
  item({
    id: "ai-provider-router",
    title: "AI Provider Router",
    group: "ai",
    state: "PENDING_CREDENTIALS",
    detail: "AI provider router remains backend-controlled. Runtime proof waits for real AI provider, model, key outside Git, policy gates, and redacted live-call evidence.",
    boundaryRoute: "/api/jarvis/ai-tools-runtime-readiness",
    launchCritical: true
  }),
  item({
    id: "local-docker-runtime",
    title: "Local Docker Runtime",
    group: "foundation",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    detail: "Docker Desktop local engine instability blocks local runtime proof only. It does not block source-safe Jarvis construction, validators, manifests, UI routes, or provider boundary work.",
    launchCritical: true
  })
] satisfies CompletionItem[];

const counts = completionItems.reduce<Record<CompletionState, number>>((acc, current) => {
  acc[current.state] = (acc[current.state] ?? 0) + 1;
  return acc;
}, {
  SOURCE_READY: 0,
  RUNTIME_PASSED: 0,
  PENDING_RUNTIME_PROOF: 0,
  PENDING_CREDENTIALS: 0,
  DEFERRED: 0,
  BLOCKED_BY_LOCAL_DOCKER: 0
});

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-completion-board.v1",
    module: "Jarvis Completion Board",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    postgresTruthVaultRemainsAuthority: true,
    airtableMirrorOnly: true,
    n8nThinRelayOnly: true,
    playWrightScoutOnly: true,
    whatsappUrgentOnly: true,
    emailPrimaryChannel: true,
    counts,
    completionItems,
    nextSourceBatches: [
      "Wire Jarvis dashboard cards to completion-board and live-index together.",
      "Add provider credential checklist screens without secrets.",
      "Add final evidence collector surface and source-only launch gate board.",
      "Keep Docker/API runtime proof separate from source completion so local engine failure does not stop repo progress."
    ],
    nextRuntimeGate: "When Docker/API is stable, run runtime proof commands and keep productionReady=false until all provider and staging gates pass."
  });
}
