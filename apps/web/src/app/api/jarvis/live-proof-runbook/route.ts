import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RunbookPhase = {
  id: string;
  title: string;
  state: "READY_TO_RUN_WHEN_RUNTIME_AVAILABLE" | "PENDING_CREDENTIALS" | "BLOCKED_BY_LOCAL_DOCKER" | "BLOCKED_BY_PROVIDER_EVIDENCE" | "BLOCKED_BY_SECURITY_GATE";
  owner: "founder" | "runtime" | "provider" | "security" | "jarvis";
  launchCritical: boolean;
  commandText?: string;
  evidenceExpected: string[];
  stopCondition: string;
};

const phases: RunbookPhase[] = [
  {
    id: "source-seal-validate",
    title: "Validate Jarvis Source Seal",
    state: "READY_TO_RUN_WHEN_RUNTIME_AVAILABLE",
    owner: "jarvis",
    launchCritical: true,
    commandText: "node scripts\\validators\\validate-jarvis-source-completion-seal.mjs && node scripts\\validators\\validate-jarvis-final-command-room-live-proof-queue.mjs",
    evidenceExpected: ["source seal validator passed", "final HUD live proof queue validator passed", "productionReady remains false"],
    stopCondition: "Stop if any source validator fails. Do not continue to runtime proof until source validators pass."
  },
  {
    id: "docker-api-truth-vault-runtime",
    title: "Clear Docker / API / Truth Vault Runtime",
    state: "BLOCKED_BY_LOCAL_DOCKER",
    owner: "runtime",
    launchCritical: true,
    commandText: "npm run api:start:local -- -KillExistingPort",
    evidenceExpected: ["API health HTTP 200", "storageMode postgres_truth_vault", "command log proof", "audit event proof"],
    stopCondition: "Stop if Docker Desktop or API health fails. Keep source build valid and do not fake runtime readiness."
  },
  {
    id: "ai-provider-live-proof",
    title: "Clear AI Provider Live Call Proof",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    evidenceExpected: ["provider selected", "model selected", "API key stored outside Git", "redacted live-call proof", "policy gate proof"],
    stopCondition: "Stop if provider credentials are absent or live-call evidence is not redacted."
  },
  {
    id: "email-primary-proof",
    title: "Clear Email Primary Channel Proof",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    commandText: "npm run jarvis:runtime:email-primary-channel",
    evidenceExpected: ["provider send proof", "bounce/failed send handling", "opt-out proof", "redaction proof", "message evidence ledger"],
    stopCondition: "Stop if email is not the primary tracked channel or proof lacks evidence ledger capture."
  },
  {
    id: "payfast-itn-proof",
    title: "Clear PayFast Sandbox Accepted ITN Proof",
    state: "BLOCKED_BY_PROVIDER_EVIDENCE",
    owner: "provider",
    launchCritical: true,
    commandText: "npm run jarvis:runtime:payfast-provider-proof-queue",
    evidenceExpected: ["sandbox checkout proof", "accepted ITN proof", "duplicate ITN rejection", "failed-payment rejection", "refund review boundary", "founder approval"],
    stopCondition: "Stop if return/cancel URL is treated as paid. Only accepted ITN may clear payment state."
  },
  {
    id: "n8n-airtable-github-runtime",
    title: "Clear n8n / Airtable / GitHub Runtime Proofs",
    state: "PENDING_CREDENTIALS",
    owner: "provider",
    launchCritical: true,
    commandText: "npm run jarvis:runtime:n8n-thin-relay && npm run jarvis:runtime:airtable-human-mirror && npm run jarvis:runtime:github-tool-boundary",
    evidenceExpected: ["n8n thin relay proof", "Airtable mirror-only proof", "GitHub token redaction proof", "Truth Vault authority proof"],
    stopCondition: "Stop if any tool becomes authority or returns raw credentials."
  },
  {
    id: "branch-protection-launch-audit",
    title: "Clear Branch Protection / Final Launch Audit",
    state: "BLOCKED_BY_SECURITY_GATE",
    owner: "security",
    launchCritical: true,
    commandText: "npm run repo:validate:branch-protection && npm run kingsmen:launch:audit",
    evidenceExpected: ["branch protection proof", "required status checks", "rollback evidence", "final launch audit"],
    stopCondition: "Stop if branch protection or launch audit fails. Public launch remains false."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-live-proof-runbook.v1",
    module: "Jarvis Live Proof Runbook",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignComplete: true,
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
    phases,
    nextAction: "Run phases in order only when runtime and provider credentials are actually available. Do not skip failed gates."
  });
}
