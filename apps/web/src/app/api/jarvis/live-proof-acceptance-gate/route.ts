import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AcceptanceState = "ACCEPTED_SOURCE" | "ACCEPTED_PREVIOUS_RUNTIME" | "PENDING_EVIDENCE" | "BLOCKED" | "REJECTED_UNTIL_REAL_EVIDENCE";

type AcceptanceGate = {
  id: string;
  title: string;
  state: AcceptanceState;
  launchCritical: boolean;
  proofQueueRef: string;
  proofGateRoute?: string;
  evidenceCaptureRunner?: string;
  acceptanceRule: string;
  rejectionRule: string;
  requiredEvidence: string[];
};

const gates: AcceptanceGate[] = [
  {
    id: "source-design-seal-acceptance",
    title: "Source / Design Seal Acceptance",
    state: "ACCEPTED_SOURCE",
    launchCritical: true,
    proofQueueRef: "jarvis-source-seal",
    acceptanceRule: "Accept source/design only when final HUD, completion board, provider checklist, evidence collector, runbook, ledger, proof queue, and launch-control surfaces validate with productionReady=false.",
    rejectionRule: "Reject if any source surface claims production readiness, returns fake status, returns secrets, executes browser shell, or reads the database directly.",
    requiredEvidence: ["source completion seal", "final HUD wiring", "completion board validator", "no fake readiness flags"]
  },
  {
    id: "openclaw-policy-acceptance",
    title: "OpenClaw Operator Boundary Acceptance",
    state: "ACCEPTED_PREVIOUS_RUNTIME",
    launchCritical: false,
    proofQueueRef: "openclaw-operator-policy",
    acceptanceRule: "Accept previous runtime proof only while OpenClaw remains operator-only and cannot bypass policy, write Truth Vault directly, expose secrets, alter payments, or submit portals without MAP.",
    rejectionRule: "Reject any OpenClaw path that acts as production authority or performs risky actions without founder approval and evidence ledger.",
    requiredEvidence: ["OpenClaw operator policy proof", "approval boundary", "no raw secret exposure", "evidence ledger"]
  },
  {
    id: "playwright-map-acceptance",
    title: "Playwright Scout / MAP Acceptance",
    state: "ACCEPTED_PREVIOUS_RUNTIME",
    launchCritical: true,
    proofQueueRef: "playwright-scout-map-fallback",
    acceptanceRule: "Accept previous proof only while Playwright stays scout/probe only and CAPTCHA, OTP, access failure, portal down, and selector changes route to MAP/manual fallback.",
    rejectionRule: "Reject any browser automation that bypasses CAPTCHA/OTP, submits without MAP where required, or hides portal failure from the evidence ledger.",
    requiredEvidence: ["Playwright scout proof", "MAP fallback proof", "Phoenix fallback", "manual escalation proof"]
  },
  {
    id: "docker-api-truth-vault-acceptance",
    title: "Docker / API / Truth Vault Runtime Acceptance",
    state: "BLOCKED",
    launchCritical: true,
    proofQueueRef: "docker-api-truth-vault-runtime",
    proofGateRoute: "/api/jarvis/docker-truth-vault-runtime-proof",
    evidenceCaptureRunner: "scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs",
    acceptanceRule: "Accept only when API health returns HTTP 200, storage mode proves postgres_truth_vault, command log write proof exists, audit event write proof exists, and redacted runtime proof is captured.",
    rejectionRule: "Reject any claim based on a web-only route, local UI success, Docker screenshot, or static source validator without backend health and Truth Vault write evidence.",
    requiredEvidence: ["Docker engine reachable", "API health HTTP 200", "postgres_truth_vault mode", "command_log write proof", "audit_events write proof", "redacted runtime output"]
  },
  {
    id: "ai-provider-acceptance",
    title: "AI Provider Live Call Acceptance",
    state: "PENDING_EVIDENCE",
    launchCritical: true,
    proofQueueRef: "ai-provider-live-call",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof",
    evidenceCaptureRunner: "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
    acceptanceRule: "Accept only after a real backend-controlled AI call succeeds with provider, model, policy gate, cost boundary, redacted request/response evidence, and no key exposure.",
    rejectionRule: "Reject mock completions, browser-side provider calls, raw API key exposure, or unredacted prompts/responses in public evidence.",
    requiredEvidence: ["provider selected", "model selected", "redacted live-call proof", "policy gate proof", "cost/rate boundary proof", "no browser provider call"]
  },
  {
    id: "email-primary-acceptance",
    title: "Email Primary Channel Acceptance",
    state: "PENDING_EVIDENCE",
    launchCritical: true,
    proofQueueRef: "email-primary-proof",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof",
    evidenceCaptureRunner: "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs",
    acceptanceRule: "Accept only after provider send, receive or delivery record, bounce/failed-send handling, opt-out rule, redaction, and message evidence ledger are proven.",
    rejectionRule: "Reject WhatsApp/SMS as a replacement for primary email evidence or any email provider proof without bounce and opt-out boundaries.",
    requiredEvidence: ["test send evidence", "delivery or receive evidence", "bounce handling", "opt-out rule", "message evidence ledger"]
  },
  {
    id: "payfast-itn-acceptance",
    title: "PayFast Accepted ITN Acceptance",
    state: "REJECTED_UNTIL_REAL_EVIDENCE",
    launchCritical: true,
    proofQueueRef: "payfast-itn-proof",
    proofGateRoute: "/api/jarvis/payfast-accepted-itn-proof",
    evidenceCaptureRunner: "scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
    acceptanceRule: "Accept only after sandbox checkout, accepted ITN, duplicate ITN rejection, failed-payment rejection, refund review boundary, and founder approval are captured.",
    rejectionRule: "Reject any paid-state claim from return URL, cancel URL, screenshots, manual note, missing accepted ITN evidence, duplicate credit, or failed/pending/cancelled payment.",
    requiredEvidence: ["sandbox checkout", "accepted ITN", "duplicate rejection", "failed-payment rejection", "refund review", "founder approval"]
  },
  {
    id: "n8n-airtable-github-acceptance",
    title: "n8n / Airtable / GitHub Runtime Acceptance",
    state: "PENDING_EVIDENCE",
    launchCritical: true,
    proofQueueRef: "n8n-thin-relay-proof/airtable-human-mirror-proof/github-tool-runtime-proof",
    proofGateRoute: "/api/jarvis/n8n-airtable-github-runtime-proof",
    evidenceCaptureRunner: "scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs",
    acceptanceRule: "Accept only when n8n proves thin relay, Airtable proves mirror-only, GitHub proves controlled connector use, Truth Vault remains authority, and all token values remain hidden.",
    rejectionRule: "Reject any evidence where n8n or Airtable becomes authority, browser calls providers directly, provider proof is only a static source route, or raw tokens are shown.",
    requiredEvidence: ["n8n backend-mediated proof", "Airtable mirror reconciliation", "GitHub redacted metadata", "no token exposure", "Truth Vault authority proof", "audit trail"]
  },
  {
    id: "branch-protection-launch-audit-acceptance",
    title: "Branch Protection / Final Launch Audit Acceptance",
    state: "BLOCKED",
    launchCritical: true,
    proofQueueRef: "branch-protection-proof",
    proofGateRoute: "/api/jarvis/branch-protection-final-launch-audit",
    evidenceCaptureRunner: "scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs",
    acceptanceRule: "Accept only when branch protection, required checks, rollback evidence, final staging evidence pack, final launch audit, founder launch approval, and the branch-protection-final-launch-audit-evidence-capture report pass.",
    rejectionRule: "Reject public launch if main branch can be pushed without review, required checks are absent, rollback proof is missing, final staging evidence pack is missing, founder approval is absent, final audit fails, or branch-protection-final-launch-audit-evidence-capture is missing.",
    requiredEvidence: ["main branch protection", "required review/status checks", "rollback evidence", "staging evidence pack", "final launch audit", "founder approval", "branch-protection-final-launch-audit-evidence-capture"]
  }
];

const counts = gates.reduce<Record<AcceptanceState, number>>((acc, gate) => {
  acc[gate.state] = (acc[gate.state] ?? 0) + 1;
  return acc;
}, {
  ACCEPTED_SOURCE: 0,
  ACCEPTED_PREVIOUS_RUNTIME: 0,
  PENDING_EVIDENCE: 0,
  BLOCKED: 0,
  REJECTED_UNTIL_REAL_EVIDENCE: 0
});

const launchBlocking = gates.filter((gate) => gate.launchCritical && !["ACCEPTED_SOURCE", "ACCEPTED_PREVIOUS_RUNTIME"].includes(gate.state));

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-live-proof-acceptance-gate.v1",
    module: "Jarvis Live Proof Acceptance Gate",
    generatedAt: new Date().toISOString(),
    jarvisSourceReady: true,
    dockerRuntimeProofGateConnected: true,
    aiEmailProviderProofGateConnected: true,
    payfastAcceptedItnProofGateConnected: true,
    n8nAirtableGithubRuntimeProofGateConnected: true,
    branchProtectionFinalLaunchAuditGateConnected: true,
    branchProtectionFinalLaunchAuditEvidenceCaptureConnected: true,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    acceptanceDecision: "BLOCK_LAUNCH",
    launchBlocked: true,
    launchBlockingCount: launchBlocking.length,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    counts,
    gates,
    launchBlocking,
    nextAction: "Capture real Docker, AI, Email, PayFast ITN, provider-tool, branch protection, rollback, staging, final audit, and founder approval evidence, then move each gate from blocked or pending to accepted."
  });
}
