import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sourceSurfaces = [
  {
    id: "jarvis-main-command",
    title: "Jarvis Main Command",
    href: "/jarvis",
    state: "SOURCE_READY",
    detail: "Primary founder command surface with command envelopes, voice, visual feed, completion board, live index, and evidence drawer."
  },
  {
    id: "jarvis-final-hud",
    title: "Jarvis Final HUD",
    href: "/jarvis/final",
    state: "SOURCE_READY",
    detail: "Final command room combining completion board, provider credentials, evidence collector, source launch gate, proof pack, live proof queue, live proof runbook, evidence ledger, acceptance gate, closeout seal, and runtime blockers."
  },
  {
    id: "final-source-closeout-seal",
    title: "Final Source Closeout Seal",
    href: "/founder/launch-control/jarvis-final-source-closeout",
    state: "SOURCE_CLOSED_OUT",
    detail: "Final source/design handover seal. It stops extra UI-layer building unless a validator fails and moves remaining work to live proof batches."
  },
  {
    id: "live-proof-queue",
    title: "Live Proof Queue",
    href: "/api/jarvis/live-proof-queue",
    state: "SOURCE_READY",
    detail: "Controlled queue for Docker/API, AI, Email, PayFast, n8n, Airtable, GitHub, branch protection, and launch audit proof."
  },
  {
    id: "live-proof-runbook",
    title: "Live Proof Runbook",
    href: "/founder/launch-control/jarvis-live-proof-runbook",
    state: "SOURCE_READY",
    detail: "Ordered founder runbook for clearing source seal, runtime, provider, PayFast, tool, branch protection, and launch audit proof gates."
  },
  {
    id: "live-proof-evidence-ledger",
    title: "Live Proof Evidence Ledger",
    href: "/founder/proof-centre/jarvis-live-proof-evidence-ledger",
    state: "SOURCE_READY",
    detail: "Evidence acceptance ledger for source, runtime, provider, payment, and security proof. Missing evidence keeps Jarvis blocked from launch."
  },
  {
    id: "live-proof-acceptance-gate",
    title: "Live Proof Acceptance Gate",
    href: "/founder/launch-control/jarvis-live-proof-acceptance-gate",
    state: "SOURCE_READY_BLOCK_LAUNCH",
    detail: "Defines what evidence can be accepted, what stays pending, and what must be rejected before any live or production-ready claim is allowed."
  },
  {
    id: "completion-board",
    title: "Completion Board",
    href: "/api/jarvis/completion-board",
    state: "SOURCE_READY",
    detail: "Docker-independent source completion map for Jarvis, provider boundaries, runtime blockers, and next source batches."
  },
  {
    id: "provider-credential-checklist",
    title: "Provider Credential Checklist",
    href: "/founder/providers/jarvis-credentials",
    state: "SOURCE_READY",
    detail: "Founder screen showing required credential names only. It never returns secret values."
  },
  {
    id: "evidence-collector",
    title: "Evidence Collector",
    href: "/api/jarvis/evidence-collector",
    state: "SOURCE_READY",
    detail: "Evidence map separating captured source/runtime evidence from blocked and pending provider proof."
  },
  {
    id: "source-launch-gate",
    title: "Source Launch Gate",
    href: "/api/jarvis/source-launch-gate",
    state: "SOURCE_READY",
    detail: "Launch gate source map showing passed source gates and remaining runtime, provider, security, and final audit blockers."
  },
  {
    id: "proof-pack-index",
    title: "Proof Pack Index",
    href: "/api/jarvis/proof-pack-index",
    state: "SOURCE_READY",
    detail: "Index of validators, reports, manifests, routes, and blockers used to finish Jarvis without fake readiness."
  },
  {
    id: "live-index",
    title: "Live Index",
    href: "/api/jarvis/live-index",
    state: "SOURCE_READY",
    detail: "Readiness index for backend, Truth Vault, AI, GitHub, Airtable, Email, PayFast, n8n, Playwright, OpenClaw, WhatsApp, and SMS."
  },
  {
    id: "openclaw-operator-policy",
    title: "OpenClaw Operator Policy",
    href: "/api/jarvis/openclaw-operator-policy-boundary",
    state: "RUNTIME_PASSED_PREVIOUSLY",
    detail: "Operator-only boundary with no policy bypass, no direct Truth Vault writes, no raw secret access, and no portal submission without MAP."
  },
  {
    id: "playwright-map-fallback",
    title: "Playwright Scout + MAP Fallback",
    href: "/api/jarvis/playwright-scout-map-fallback-boundary",
    state: "RUNTIME_PASSED_PREVIOUSLY",
    detail: "Playwright remains scout/probe only. CAPTCHA, OTP, portal changes, or access failure route to MAP/manual fallback."
  }
];

const launchGates = [
  "Docker/API runtime proof must pass when local engine is stable.",
  "PostgreSQL Truth Vault must be reachable through backend health, not from the browser.",
  "AI provider must have a real backend-controlled live-call proof.",
  "Email provider must prove send, receive, bounce, opt-out, redaction, and evidence logging.",
  "PayFast sandbox must prove checkout, accepted ITN, duplicate rejection, failed-payment rejection, refund review, and founder approval.",
  "n8n must prove thin relay only with real credentials outside Git.",
  "Airtable must prove human mirror only while Truth Vault remains authority.",
  "GitHub connector must prove redacted repo metadata and no token exposure.",
  "Branch protection and final launch gate audit must pass."
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-final-command-hud.v1",
    module: "Jarvis Final Command HUD",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignComplete: true,
    jarvisFinalCommandRoomConnected: true,
    jarvisLiveProofQueueConnected: true,
    jarvisLiveProofRunbookConnected: true,
    jarvisLiveProofEvidenceLedgerConnected: true,
    jarvisLiveProofAcceptanceGateConnected: true,
    jarvisFinalSourceCloseoutSealConnected: true,
    productionReady: false,
    publicLaunchAllowed: false,
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
    emailPrimaryChannel: true,
    whatsappUrgentOnly: true,
    smsBackupOnly: true,
    n8nThinRelayOnly: true,
    airtableMirrorOnly: true,
    playwrightScoutOnly: true,
    openClawOperatorOnly: true,
    sourceSurfaces,
    launchGates,
    designSections: [
      "Founder command identity and active status orb",
      "Jarvis completion board summary",
      "Live proof queue and blocker tracker",
      "Live proof runbook",
      "Live proof evidence ledger",
      "Live proof acceptance gate and rejection rules",
      "Final source closeout and handover seal",
      "Live index readiness map",
      "Provider credential checklist access",
      "Evidence collector and proof references",
      "Source launch gate board",
      "Proof-pack index and blocker map",
      "Runtime blocker banner",
      "No fake data and no secret exposure locks"
    ],
    nextAction: "Jarvis source/design/control surfaces are closed out. Clear the five live proof batches before production readiness can become true."
  });
}
