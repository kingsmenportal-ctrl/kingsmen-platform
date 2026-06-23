import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AcceptancePackItem = {
  id: string;
  title: string;
  state: "CAPTURE_RUNNER_READY" | "WAITING_FOR_RUNTIME" | "WAITING_FOR_PROVIDER_EVIDENCE" | "WAITING_FOR_PAYMENT_EVIDENCE" | "WAITING_FOR_SECURITY_EVIDENCE";
  launchCritical: boolean;
  captureRunner: string;
  captureReportPath: string;
  proofGateRoute: string;
  acceptedEvidenceRequired: string[];
  detail: string;
};

const acceptancePack: AcceptancePackItem[] = [
  {
    id: "docker-api-truth-vault-runtime-evidence",
    title: "Docker / API / Truth Vault Runtime Evidence",
    state: "WAITING_FOR_RUNTIME",
    launchCritical: true,
    captureRunner: "node scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
    captureReportPath: "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json",
    proofGateRoute: "/api/jarvis/docker-truth-vault-runtime-proof",
    acceptedEvidenceRequired: ["API health HTTP 200", "postgres_truth_vault storage mode", "command_log write proof", "audit_events write proof", "redacted report"],
    detail: "This pack item cannot pass until backend runtime is available and the capture report proves API/Truth Vault health."
  },
  {
    id: "ai-email-provider-live-evidence",
    title: "AI + Email Provider Live Evidence",
    state: "WAITING_FOR_PROVIDER_EVIDENCE",
    launchCritical: true,
    captureRunner: "node scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
    captureReportPath: "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof",
    acceptedEvidenceRequired: ["AI live call accepted evidence", "Email primary channel accepted evidence", "message evidence ledger", "redacted provider output"],
    detail: "This pack item cannot pass until AI and Email evidence files are accepted and the backend command proof is captured."
  },
  {
    id: "payfast-accepted-itn-evidence",
    title: "PayFast Accepted ITN Evidence",
    state: "WAITING_FOR_PAYMENT_EVIDENCE",
    launchCritical: true,
    captureRunner: "node scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
    captureReportPath: "reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json",
    proofGateRoute: "/api/jarvis/payfast-accepted-itn-proof",
    acceptedEvidenceRequired: ["sandbox checkout accepted evidence", "accepted ITN evidence", "duplicate rejection evidence", "failed-payment rejection evidence", "refund/founder approval evidence"],
    detail: "This pack item cannot pass from return/cancel URLs or notes. Only accepted ITN and rejection evidence can clear it."
  },
  {
    id: "n8n-airtable-github-runtime-evidence",
    title: "n8n + Airtable + GitHub Runtime Evidence",
    state: "WAITING_FOR_PROVIDER_EVIDENCE",
    launchCritical: true,
    captureRunner: "node scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
    captureReportPath: "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json",
    proofGateRoute: "/api/jarvis/n8n-airtable-github-runtime-proof",
    acceptedEvidenceRequired: ["n8n thin relay evidence", "Airtable human mirror evidence", "GitHub connector evidence", "Truth Vault authority evidence", "token redaction evidence"],
    detail: "This pack item cannot pass until n8n, Airtable, and GitHub proofs are accepted without changing their authority boundaries."
  },
  {
    id: "branch-protection-final-launch-audit-evidence",
    title: "Branch Protection + Final Launch Audit Evidence",
    state: "WAITING_FOR_SECURITY_EVIDENCE",
    launchCritical: true,
    captureRunner: "node scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
    captureReportPath: "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json",
    proofGateRoute: "/api/jarvis/branch-protection-final-launch-audit",
    acceptedEvidenceRequired: ["main branch protection", "rollback evidence", "staging evidence pack", "final launch audit", "founder launch approval"],
    detail: "This pack item cannot pass until release governance and founder approval are accepted."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-live-evidence-acceptance-pack.v1",
    module: "Jarvis Live Evidence Acceptance Pack",
    generatedAt: new Date().toISOString(),
    jarvisSourceDesignClosedOut: true,
    allCaptureRunnersBuilt: true,
    liveEvidenceAcceptancePackBuilt: true,
    liveEvidenceAccepted: false,
    acceptanceDecision: "WAITING_FOR_REAL_EVIDENCE",
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
    acceptanceRunner: "node scripts/proof/accept-jarvis-live-evidence-pack.mjs",
    acceptanceReportPath: "reports/jarvis/jarvis-live-evidence-acceptance-pack-latest.json",
    acceptanceValidator: "node scripts/validators/validate-jarvis-live-evidence-acceptance-pack.mjs",
    acceptancePack,
    nextAction: "Run every capture runner against real runtime/provider evidence, then run the live evidence acceptance pack."
  });
}
