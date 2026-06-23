import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validators = [
  "scripts/validators/validate-jarvis-completion-board.mjs",
  "scripts/validators/validate-jarvis-dashboard-completion-board.mjs",
  "scripts/validators/validate-jarvis-provider-credential-checklist.mjs",
  "scripts/validators/validate-jarvis-final-command-room.mjs",
  "scripts/validators/validate-jarvis-final-command-room-live-proof-queue.mjs",
  "scripts/validators/validate-jarvis-live-proof-runbook.mjs",
  "scripts/validators/validate-jarvis-live-proof-evidence-ledger.mjs",
  "scripts/validators/validate-jarvis-live-proof-acceptance-gate.mjs",
  "scripts/validators/validate-jarvis-docker-truth-vault-runtime-proof.mjs",
  "scripts/validators/validate-jarvis-docker-truth-vault-runtime-evidence-capture.mjs",
  "scripts/validators/validate-jarvis-ai-email-provider-live-proof.mjs",
  "scripts/validators/validate-jarvis-ai-email-provider-live-evidence-capture.mjs",
  "scripts/validators/validate-jarvis-payfast-accepted-itn-proof.mjs",
  "scripts/validators/validate-jarvis-payfast-accepted-itn-evidence-capture.mjs",
  "scripts/validators/validate-jarvis-n8n-airtable-github-runtime-proof.mjs",
  "scripts/validators/validate-jarvis-n8n-airtable-github-evidence-capture.mjs",
  "scripts/validators/validate-jarvis-branch-protection-final-launch-audit.mjs",
  "scripts/validators/validate-jarvis-final-source-closeout-seal.mjs",
  "scripts/validators/validate-jarvis-final-launch-control.mjs",
  "scripts/validators/validate-jarvis-source-completion-seal.mjs",
  "scripts/validators/validate-jarvis-live-proof-queue.mjs",
  "scripts/validators/validate-jarvis-openclaw-operator-policy-boundary.mjs",
  "scripts/validators/validate-jarvis-playwright-scout-map-fallback-boundary.mjs",
  "scripts/validators/validate-jarvis-live-index-openclaw-runtime.mjs"
];

const proofRunners = [
  "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
  "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
  "scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
  "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs"
];

const reports = [
  "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
  "reports/jarvis/jarvis-playwright-scout-map-fallback-boundary-proof-latest.json",
  "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json",
  "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json",
  "reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json",
  "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json"
];

const manifests = [
  "manifests/jarvis/jarvis-completion-board-v1.json",
  "manifests/jarvis/jarvis-dashboard-completion-board-v1.json",
  "manifests/jarvis/jarvis-source-completion-seal-v1.json",
  "manifests/jarvis/jarvis-final-source-closeout-seal-v1.json",
  "manifests/jarvis/jarvis-live-proof-queue-v1.json",
  "manifests/jarvis/jarvis-live-proof-runbook-v1.json",
  "manifests/jarvis/jarvis-live-proof-evidence-ledger-v1.json",
  "manifests/jarvis/jarvis-live-proof-acceptance-gate-v1.json",
  "manifests/jarvis/jarvis-docker-truth-vault-runtime-proof-v1.json",
  "manifests/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-v1.json",
  "manifests/jarvis/jarvis-ai-email-provider-live-proof-v1.json",
  "manifests/jarvis/jarvis-ai-email-provider-live-evidence-capture-v1.json",
  "manifests/jarvis/jarvis-payfast-accepted-itn-proof-v1.json",
  "manifests/jarvis/jarvis-payfast-accepted-itn-evidence-capture-v1.json",
  "manifests/jarvis/jarvis-n8n-airtable-github-runtime-proof-v1.json",
  "manifests/jarvis/jarvis-n8n-airtable-github-evidence-capture-v1.json",
  "manifests/jarvis/jarvis-branch-protection-final-launch-audit-v1.json",
  "manifests/jarvis/jarvis-openclaw-operator-policy-boundary-v1.json",
  "manifests/jarvis/jarvis-playwright-scout-map-fallback-boundary-v1.json"
];

const routes = [
  "/jarvis",
  "/jarvis/final",
  "/founder/providers/jarvis-credentials",
  "/founder/proof-centre/jarvis",
  "/founder/proof-centre/jarvis-live-proof-evidence-ledger",
  "/founder/launch-control/jarvis",
  "/founder/launch-control/jarvis-source-seal",
  "/founder/launch-control/jarvis-final-source-closeout",
  "/founder/launch-control/jarvis-live-proof-queue",
  "/founder/launch-control/jarvis-live-proof-runbook",
  "/founder/launch-control/jarvis-live-proof-acceptance-gate",
  "/founder/launch-control/jarvis-docker-runtime-proof",
  "/founder/launch-control/jarvis-ai-email-provider-proof",
  "/founder/launch-control/jarvis-payfast-itn-proof",
  "/founder/launch-control/jarvis-provider-tool-runtime-proof",
  "/founder/launch-control/jarvis-branch-final-audit",
  "/api/jarvis/final-command-hud",
  "/api/jarvis/final-launch-control",
  "/api/jarvis/source-completion-seal",
  "/api/jarvis/final-source-closeout-seal",
  "/api/jarvis/live-proof-queue",
  "/api/jarvis/live-proof-runbook",
  "/api/jarvis/live-proof-evidence-ledger",
  "/api/jarvis/live-proof-acceptance-gate",
  "/api/jarvis/docker-truth-vault-runtime-proof",
  "/api/jarvis/ai-email-provider-live-proof",
  "/api/jarvis/payfast-accepted-itn-proof",
  "/api/jarvis/n8n-airtable-github-runtime-proof",
  "/api/jarvis/branch-protection-final-launch-audit",
  "/api/jarvis/completion-board",
  "/api/jarvis/provider-credential-checklist",
  "/api/jarvis/evidence-collector",
  "/api/jarvis/source-launch-gate",
  "/api/jarvis/proof-pack-index",
  "/api/jarvis/live-index"
];

const blockers = [
  {
    id: "source-closeout-complete",
    title: "Source/design closeout complete",
    state: "PASSED_SOURCE",
    detail: "No more source/UI layers should be added unless a validator fails or a real launch proof requires a correction."
  },
  {
    id: "docker-runtime-evidence-runner",
    title: "Docker runtime evidence runner ready",
    state: "READY_FOR_RUNTIME",
    detail: "The capture runner can collect redacted API health, postgres_truth_vault mode, command acceptance, and indirect command_log/audit_events write proof when API runtime is available."
  },
  {
    id: "ai-email-evidence-runner",
    title: "AI Email evidence capture runner ready",
    state: "READY_FOR_PROVIDER_EVIDENCE",
    detail: "The capture runner can collect redacted AI and Email evidence once real credentials and accepted evidence files are available."
  },
  {
    id: "payfast-accepted-itn-evidence-runner",
    title: "PayFast accepted ITN evidence capture runner ready",
    state: "READY_FOR_PROVIDER_EVIDENCE",
    detail: "The capture runner can collect redacted PayFast sandbox checkout, accepted ITN, duplicate rejection, failed payment rejection, refund review, and founder approval evidence once real files and credentials are available."
  },
  {
    id: "n8n-airtable-github-evidence-runner",
    title: "n8n Airtable GitHub evidence capture runner ready",
    state: "READY_FOR_PROVIDER_EVIDENCE",
    detail: "The capture runner can collect redacted n8n thin relay, Airtable human mirror, and GitHub connector evidence once real credentials and accepted evidence files are available."
  },
  {
    id: "local-docker-runtime",
    title: "Local Docker/API runtime instability",
    state: "BLOCKED",
    detail: "Blocks runtime proof only. Source-safe Jarvis construction is closed out. The Docker runtime proof gate and evidence capture runner are now indexed."
  },
  {
    id: "docker-truth-vault-proof-gate",
    title: "Docker Truth Vault runtime proof gate not accepted",
    state: "BLOCKED",
    detail: "API health, postgres_truth_vault mode, command_log write, audit_events write, and redacted output are still required."
  },
  {
    id: "ai-email-provider-proof-gate",
    title: "AI Email provider proof gate not accepted",
    state: "PENDING",
    detail: "AI backend live call and Email primary channel evidence are still required before provider readiness can pass."
  },
  {
    id: "ai-email-provider-evidence-capture",
    title: "AI Email provider evidence capture not accepted",
    state: "PENDING",
    detail: "AI and Email evidence capture runner is ready, but accepted evidence files and backend command proof are still required."
  },
  {
    id: "payfast-accepted-itn-proof-gate",
    title: "PayFast accepted ITN proof gate not accepted",
    state: "BLOCKED",
    detail: "Sandbox checkout, accepted ITN, duplicate rejection, failed-payment rejection, refund review, and founder approval evidence are required."
  },
  {
    id: "payfast-accepted-itn-evidence-capture",
    title: "PayFast accepted ITN evidence capture not accepted",
    state: "BLOCKED",
    detail: "PayFast evidence capture runner is ready, but accepted redacted sandbox, ITN, rejection, refund, and founder approval evidence files are still required."
  },
  {
    id: "n8n-airtable-github-proof-gate",
    title: "n8n Airtable GitHub runtime proof gate not accepted",
    state: "PENDING",
    detail: "n8n thin relay, Airtable human mirror, GitHub connector, token redaction, and Truth Vault authority evidence are required."
  },
  {
    id: "n8n-airtable-github-evidence-capture",
    title: "n8n Airtable GitHub evidence capture not accepted",
    state: "PENDING",
    detail: "Provider tool evidence capture runner is ready, but accepted n8n, Airtable, and GitHub evidence files are still required."
  },
  {
    id: "branch-protection-final-launch-audit-gate",
    title: "Branch protection final launch audit gate not accepted",
    state: "BLOCKED",
    detail: "Main branch protection, required checks, rollback, staging evidence pack, final launch audit, and founder approval are required."
  },
  {
    id: "live-proof-queue",
    title: "Live proof queue not cleared",
    state: "BLOCKED",
    detail: "Docker/API, provider, GitHub, branch-protection, and final audit proof items remain open."
  },
  {
    id: "live-proof-runbook",
    title: "Live proof runbook not executed",
    state: "PENDING",
    detail: "Runbook phases must be cleared in order with real evidence before production launch."
  },
  {
    id: "live-proof-evidence-ledger",
    title: "Live proof evidence ledger not accepted",
    state: "PENDING",
    detail: "Launch-critical evidence ledger entries must move from missing/blocked to accepted before public launch."
  },
  {
    id: "live-proof-acceptance-gate",
    title: "Live proof acceptance gate still blocks launch",
    state: "BLOCKED",
    detail: "Acceptance gate currently decides BLOCK_LAUNCH until real runtime, provider, payment, and security evidence clears."
  },
  {
    id: "provider-credentials",
    title: "Provider credentials outside Git",
    state: "PENDING",
    detail: "Required for AI, Email, PayFast, n8n, Airtable, GitHub runtime proof, and storage."
  },
  {
    id: "launch-security-proof",
    title: "Branch protection and final launch audit",
    state: "PENDING",
    detail: "Required before public launch."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-proof-pack-index.v1",
    module: "Jarvis Proof Pack Index",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    jarvisSourcePackReady: true,
    jarvisFinalCommandRoomIndexed: true,
    jarvisFinalLaunchControlIndexed: true,
    jarvisSourceCompletionSealIndexed: true,
    jarvisFinalSourceCloseoutSealIndexed: true,
    jarvisLiveProofQueueIndexed: true,
    jarvisLiveProofRunbookIndexed: true,
    jarvisLiveProofEvidenceLedgerIndexed: true,
    jarvisLiveProofAcceptanceGateIndexed: true,
    jarvisDockerTruthVaultRuntimeProofIndexed: true,
    jarvisDockerTruthVaultRuntimeEvidenceCaptureIndexed: true,
    jarvisAiEmailProviderProofIndexed: true,
    jarvisAiEmailProviderLiveEvidenceCaptureIndexed: true,
    jarvisPayFastAcceptedItnProofIndexed: true,
    jarvisPayFastAcceptedItnEvidenceCaptureIndexed: true,
    jarvisN8nAirtableGithubRuntimeProofIndexed: true,
    jarvisN8nAirtableGithubEvidenceCaptureIndexed: true,
    jarvisBranchProtectionFinalLaunchAuditIndexed: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    validators,
    proofRunners,
    reports,
    manifests,
    routes,
    blockers,
    nextAction: "Jarvis source/design is closed out. Execute evidence runners and final launch audit with real credentials and redacted evidence before public launch."
  });
}
