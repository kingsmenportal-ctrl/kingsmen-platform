import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CloseoutSurface = {
  id: string;
  title: string;
  state: "SEALED_SOURCE" | "ACCEPTED_PREVIOUS_RUNTIME" | "REMAINING_LIVE_PROOF";
  route?: string;
  detail: string;
};

const sourceSealedSurfaces: CloseoutSurface[] = [
  {
    id: "final-command-hud",
    title: "Final Jarvis Command HUD",
    state: "SEALED_SOURCE",
    route: "/jarvis/final",
    detail: "Single founder command room now shows completion board, live proof queue, runbook, evidence ledger, acceptance gate, proof pack, and blockers."
  },
  {
    id: "completion-board",
    title: "Completion Board",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/completion-board",
    detail: "Docker-independent completion map remains available without pretending runtime is live."
  },
  {
    id: "provider-checklist",
    title: "Provider Credential Checklist",
    state: "SEALED_SOURCE",
    route: "/founder/providers/jarvis-credentials",
    detail: "Shows required provider credential names only; secret values are never returned."
  },
  {
    id: "proof-pack-index",
    title: "Proof Pack Index",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/proof-pack-index",
    detail: "Indexes validators, manifests, routes, reports, and launch blockers."
  },
  {
    id: "live-proof-queue",
    title: "Live Proof Queue",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/live-proof-queue",
    detail: "Controls the remaining runtime, provider, PayFast, tooling, branch-protection, and audit evidence."
  },
  {
    id: "live-proof-runbook",
    title: "Live Proof Runbook",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/live-proof-runbook",
    detail: "Orders the proof phases from source seal through runtime, provider, security, and final audit proof."
  },
  {
    id: "evidence-ledger",
    title: "Live Proof Evidence Ledger",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/live-proof-evidence-ledger",
    detail: "Tracks missing, blocked, rejected, source-ready, and accepted proof evidence."
  },
  {
    id: "acceptance-gate",
    title: "Live Proof Acceptance Gate",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/live-proof-acceptance-gate",
    detail: "Defines what evidence is accepted, pending, blocked, or rejected before live launch."
  },
  {
    id: "source-launch-gate",
    title: "Source Launch Gate",
    state: "SEALED_SOURCE",
    route: "/api/jarvis/source-launch-gate",
    detail: "Connects source-passed gates to live proof queue and acceptance blockers."
  }
];

const previouslyAcceptedRuntime: CloseoutSurface[] = [
  {
    id: "openclaw-operator-policy",
    title: "OpenClaw Operator Policy",
    state: "ACCEPTED_PREVIOUS_RUNTIME",
    route: "/api/jarvis/openclaw-operator-policy-boundary",
    detail: "Previous runtime proof accepted for operator-only boundary. It remains subject to final launch audit."
  },
  {
    id: "playwright-map-fallback",
    title: "Playwright Scout + MAP Fallback",
    state: "ACCEPTED_PREVIOUS_RUNTIME",
    route: "/api/jarvis/playwright-scout-map-fallback-boundary",
    detail: "Previous runtime proof accepted for scout-only automation and MAP/manual fallback."
  }
];

const remainingLiveProof: CloseoutSurface[] = [
  {
    id: "docker-api-truth-vault-runtime",
    title: "Docker / API / Truth Vault Runtime",
    state: "REMAINING_LIVE_PROOF",
    detail: "Backend health, postgres_truth_vault mode, command log write proof, and audit write proof must pass."
  },
  {
    id: "ai-email-provider-proof",
    title: "AI + Email Provider Live Proof",
    state: "REMAINING_LIVE_PROOF",
    detail: "Requires real backend-controlled AI call proof and email send/bounce/opt-out/evidence-ledger proof."
  },
  {
    id: "payfast-accepted-itn-proof",
    title: "PayFast Accepted ITN Proof",
    state: "REMAINING_LIVE_PROOF",
    detail: "Requires sandbox checkout, accepted ITN, duplicate rejection, failed-payment rejection, refund review, and founder approval."
  },
  {
    id: "n8n-airtable-github-runtime-proof",
    title: "n8n + Airtable + GitHub Runtime Proof",
    state: "REMAINING_LIVE_PROOF",
    detail: "Requires thin relay proof, mirror-only reconciliation proof, and redacted GitHub connector proof."
  },
  {
    id: "branch-protection-final-launch-audit",
    title: "Branch Protection + Final Launch Audit",
    state: "REMAINING_LIVE_PROOF",
    detail: "Requires branch protection, rollback evidence, release gate, final audit, and founder acceptance."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-final-source-closeout-seal.v1",
    module: "Jarvis Final Source Closeout Seal",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignClosedOut: true,
    jarvisSourceControlSurfacesComplete: true,
    jarvisFinalHudConnected: true,
    jarvisProofPackClosedOut: true,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    closeoutDecision: "SOURCE_CLOSED_OUT__LIVE_PROOF_REMAINS",
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
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
    sourceSealedSurfaces,
    previouslyAcceptedRuntime,
    remainingLiveProof,
    remainingLiveProofBatchCount: remainingLiveProof.length,
    nextAction: "Stop adding Jarvis source surfaces unless a validator fails. Move to live proof batches: Docker/API/Truth Vault, AI+Email, PayFast ITN, n8n+Airtable+GitHub, branch protection and final launch audit."
  });
}
