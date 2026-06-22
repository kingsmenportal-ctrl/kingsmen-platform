import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SealState = "SOURCE_COMPLETE" | "RUNTIME_PASSED" | "RUNTIME_PENDING" | "PROVIDER_PENDING" | "SECURITY_PENDING" | "LOCAL_RUNTIME_BLOCKED";

type SealItem = {
  id: string;
  title: string;
  state: SealState;
  launchCritical: boolean;
  detail: string;
  route?: string;
  validator?: string;
};

const sourceComplete: SealItem[] = [
  {
    id: "final-command-room",
    title: "Final Jarvis Command Room",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "The final Jarvis HUD/source command room exists for founder use and gathers command, completion, evidence, proof-pack, provider, and launch-control surfaces.",
    route: "/jarvis/final",
    validator: "scripts/validators/validate-jarvis-final-command-room.mjs"
  },
  {
    id: "completion-board",
    title: "Completion Board",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "Docker-independent source completion board is built and still keeps production readiness false until proof gates clear.",
    route: "/api/jarvis/completion-board",
    validator: "scripts/validators/validate-jarvis-completion-board.mjs"
  },
  {
    id: "provider-checklist",
    title: "Provider Credential Checklist",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "Provider credential checklist exists without returning secret values or calling providers from the browser.",
    route: "/founder/providers/jarvis-credentials",
    validator: "scripts/validators/validate-jarvis-provider-credential-checklist.mjs"
  },
  {
    id: "evidence-collector",
    title: "Evidence Collector",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "Evidence collector separates captured, pending, and blocked proof evidence for Jarvis.",
    route: "/api/jarvis/evidence-collector"
  },
  {
    id: "source-launch-gate",
    title: "Source Launch Gate",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "Source launch gate exposes which Jarvis source gates passed and which runtime/security/provider gates still block public launch.",
    route: "/api/jarvis/source-launch-gate"
  },
  {
    id: "proof-pack-index",
    title: "Proof Pack Index",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "Proof pack index lists Jarvis validators, routes, manifests, reports, and blockers.",
    route: "/api/jarvis/proof-pack-index"
  },
  {
    id: "final-launch-control",
    title: "Final Launch Control",
    state: "SOURCE_COMPLETE",
    launchCritical: true,
    detail: "Founder launch-control board exists and prevents false live claims while any critical proof gate remains blocked.",
    route: "/founder/launch-control/jarvis",
    validator: "scripts/validators/validate-jarvis-final-launch-control.mjs"
  }
];

const stillRequired: SealItem[] = [
  {
    id: "backend-truth-vault-runtime",
    title: "Backend and Truth Vault Runtime Proof",
    state: "LOCAL_RUNTIME_BLOCKED",
    launchCritical: true,
    detail: "Local Docker/API instability blocks runtime proof only. Backend health and postgres_truth_vault proof must pass before live launch."
  },
  {
    id: "provider-runtime-proofs",
    title: "Provider Runtime Proofs",
    state: "PROVIDER_PENDING",
    launchCritical: true,
    detail: "AI, email, payment, n8n, Airtable, GitHub connector, and storage provider proofs must pass with redacted evidence and credentials outside Git."
  },
  {
    id: "security-launch-proof",
    title: "Security and Launch Proof",
    state: "SECURITY_PENDING",
    launchCritical: true,
    detail: "Branch protection, final staging evidence pack, and launch audit must pass before public launch."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-source-completion-seal.v1",
    module: "Jarvis Source Completion Seal",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignComplete: true,
    jarvisUiSourceComplete: true,
    jarvisProofSurfaceComplete: true,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    dockerIndependentBuildAllowed: true,
    sourceCompleteCount: sourceComplete.length,
    remainingLiveBlockerCount: stillRequired.length,
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
    sourceComplete,
    stillRequired,
    finalInstruction: "Jarvis source/design is sealed. Do not claim live until backend, provider, security, and launch proof gates pass."
  });
}
