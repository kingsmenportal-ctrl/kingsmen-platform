import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const executionSteps = [
  {
    id: "docker-truth-vault-runtime-capture",
    order: 1,
    title: "Capture Docker / API / Truth Vault runtime evidence",
    state: "READY_TO_RUN_WHEN_RUNTIME_AVAILABLE",
    runner: "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
    reportPath: "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json",
    gateRoute: "/api/jarvis/docker-truth-vault-runtime-proof",
    launchCritical: true,
    detail: "Requires stable Docker/API/Truth Vault runtime. Captures redacted health, postgres_truth_vault mode, command acceptance, command_log, and audit event evidence."
  },
  {
    id: "ai-email-provider-capture",
    order: 2,
    title: "Capture AI + Email provider live evidence",
    state: "READY_TO_RUN_WHEN_CREDENTIALS_AND_EVIDENCE_AVAILABLE",
    runner: "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
    reportPath: "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json",
    gateRoute: "/api/jarvis/ai-email-provider-live-proof",
    launchCritical: true,
    detail: "Requires provider credentials outside Git and accepted redacted AI live-call and Email primary-channel evidence."
  },
  {
    id: "payfast-itn-capture",
    order: 3,
    title: "Capture PayFast accepted ITN evidence",
    state: "READY_TO_RUN_WHEN_PAYFAST_EVIDENCE_AVAILABLE",
    runner: "scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
    reportPath: "reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json",
    gateRoute: "/api/jarvis/payfast-accepted-itn-proof",
    launchCritical: true,
    detail: "Requires PayFast sandbox checkout, accepted ITN, duplicate rejection, failed-payment rejection, refund boundary, and founder approval evidence."
  },
  {
    id: "n8n-airtable-github-capture",
    order: 4,
    title: "Capture n8n + Airtable + GitHub runtime evidence",
    state: "READY_TO_RUN_WHEN_PROVIDER_TOOL_EVIDENCE_AVAILABLE",
    runner: "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
    reportPath: "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json",
    gateRoute: "/api/jarvis/n8n-airtable-github-runtime-proof",
    launchCritical: true,
    detail: "Requires n8n thin relay, Airtable human mirror, and GitHub connector evidence without token exposure or authority drift."
  },
  {
    id: "branch-final-audit-capture",
    order: 5,
    title: "Capture branch protection + final launch audit evidence",
    state: "READY_TO_RUN_WHEN_SECURITY_EVIDENCE_AVAILABLE",
    runner: "scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
    reportPath: "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json",
    gateRoute: "/api/jarvis/branch-protection-final-launch-audit",
    launchCritical: true,
    detail: "Requires branch protection, rollback, staging evidence pack, final launch audit, and founder approval accepted files."
  },
  {
    id: "final-live-evidence-acceptance",
    order: 6,
    title: "Run final Jarvis live evidence acceptance pack",
    state: "READY_AFTER_CAPTURE_REPORTS_EXIST",
    runner: "scripts/proof/accept-jarvis-live-evidence-pack.mjs",
    reportPath: "reports/jarvis/jarvis-live-evidence-acceptance-pack-latest.json",
    gateRoute: "/api/jarvis/live-evidence-acceptance-pack",
    launchCritical: true,
    detail: "Consolidates all five evidence reports and blocks launch until every launch-critical capture is accepted."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-live-evidence-execution-sequence.v1",
    module: "Jarvis Live Evidence Execution Sequence",
    generatedAt: new Date().toISOString(),
    sourceExecutionSequenceReady: true,
    liveEvidenceAccepted: false,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecutedFromBrowser: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    sequenceRunner: "scripts/proof/run-jarvis-live-evidence-capture-sequence.mjs",
    sequenceReportPath: "reports/jarvis/jarvis-live-evidence-execution-sequence-latest.json",
    sequenceValidator: "scripts/validators/validate-jarvis-live-evidence-execution-sequence.mjs",
    executionSteps,
    nextAction: "Run the sequence only when runtime and accepted evidence files are available. Do not call Jarvis live until the acceptance pack passes and final audit approves."
  });
}
