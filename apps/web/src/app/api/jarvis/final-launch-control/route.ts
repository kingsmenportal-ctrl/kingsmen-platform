import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GateState = "SOURCE_PASSED" | "RUNTIME_PASSED" | "PENDING_CREDENTIALS" | "PENDING_RUNTIME_PROOF" | "BLOCKED_BY_LOCAL_DOCKER" | "PENDING_SECURITY_PROOF";

type LaunchGate = {
  id: string;
  title: string;
  state: GateState;
  launchCritical: boolean;
  detail: string;
  sourceRoute?: string;
  proofCommand?: string;
};

const gates: LaunchGate[] = [
  {
    id: "jarvis-final-hud",
    title: "Jarvis Final Command HUD",
    state: "SOURCE_PASSED",
    launchCritical: true,
    detail: "Final source HUD exists and presents command room, completion board, evidence collector, launch gates, provider checklist, and proof-pack index.",
    sourceRoute: "/jarvis/final",
    proofCommand: "node scripts/validators/validate-jarvis-final-command-room.mjs"
  },
  {
    id: "jarvis-completion-board",
    title: "Jarvis Completion Board",
    state: "SOURCE_PASSED",
    launchCritical: true,
    detail: "Docker-independent source completion board is built and keeps production readiness false until proof gates clear.",
    sourceRoute: "/api/jarvis/completion-board",
    proofCommand: "npm run jarvis:validate:completion-board"
  },
  {
    id: "jarvis-provider-checklist",
    title: "Provider Credential Checklist",
    state: "SOURCE_PASSED",
    launchCritical: true,
    detail: "Founder provider checklist names required credentials without exposing secret values.",
    sourceRoute: "/founder/providers/jarvis-credentials",
    proofCommand: "node scripts/validators/validate-jarvis-provider-credential-checklist.mjs"
  },
  {
    id: "jarvis-evidence-collector",
    title: "Evidence Collector",
    state: "SOURCE_PASSED",
    launchCritical: true,
    detail: "Evidence collector separates captured, pending, and blocked proof items.",
    sourceRoute: "/api/jarvis/evidence-collector"
  },
  {
    id: "jarvis-proof-pack-index",
    title: "Proof Pack Index",
    state: "SOURCE_PASSED",
    launchCritical: true,
    detail: "Proof pack index lists validators, manifests, reports, routes, and blockers.",
    sourceRoute: "/api/jarvis/proof-pack-index"
  },
  {
    id: "backend-truth-vault-runtime",
    title: "Backend / Truth Vault Runtime Proof",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    launchCritical: true,
    detail: "Docker/API instability blocks local runtime proof only. Do not mark live until backend health and postgres_truth_vault runtime proof pass.",
    proofCommand: "npm run jarvis:runtime:command-proof"
  },
  {
    id: "ai-provider-live-proof",
    title: "AI Provider Live Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    detail: "Requires real AI provider credentials outside Git and redacted live-call evidence. Browser must never receive provider secrets."
  },
  {
    id: "email-provider-proof",
    title: "Email Provider Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    detail: "Requires send, receive, bounce, opt-out, redaction, and evidence ledger proof.",
    proofCommand: "npm run jarvis:runtime:email-primary-channel"
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Sandbox ITN Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    detail: "Requires sandbox checkout, accepted ITN proof, duplicate rejection, failed-payment rejection, refund review, and founder approval.",
    proofCommand: "npm run jarvis:runtime:payfast-provider-proof-queue"
  },
  {
    id: "n8n-airtable-github-proof",
    title: "n8n / Airtable / GitHub Runtime Proof",
    state: "PENDING_RUNTIME_PROOF",
    launchCritical: true,
    detail: "Requires live connector proofs with redacted evidence. n8n remains thin relay and Airtable remains mirror-only."
  },
  {
    id: "branch-protection-launch-audit",
    title: "Branch Protection and Launch Audit",
    state: "PENDING_SECURITY_PROOF",
    launchCritical: true,
    detail: "Requires branch protection proof, staging evidence pack, and final launch gate audit before public launch.",
    proofCommand: "npm run kingsmen:launch:audit"
  }
];

const blockingGates = gates.filter((gate) => gate.launchCritical && !["SOURCE_PASSED", "RUNTIME_PASSED"].includes(gate.state));

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-final-launch-control.v1",
    module: "Jarvis Final Launch Control",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignComplete: true,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    launchBlockingCount: blockingGates.length,
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
    airtableMirrorOnly: true,
    n8nThinRelayOnly: true,
    playwrightScoutOnly: true,
    openClawOperatorOnly: true,
    gates,
    blockingGates,
    finalInstruction: "Continue source-safe Jarvis completion, then clear runtime/provider/security proof gates. Do not mark production-ready while any blocking gate remains."
  });
}
