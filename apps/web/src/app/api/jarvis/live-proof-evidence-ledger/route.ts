import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LedgerState = "SOURCE_READY" | "MISSING" | "BLOCKED" | "REJECTED" | "ACCEPTED_PREVIOUSLY";

type EvidenceLedgerItem = {
  id: string;
  phaseId: string;
  title: string;
  state: LedgerState;
  launchCritical: boolean;
  evidenceClass: "source" | "runtime" | "provider" | "security" | "payment";
  acceptedEvidence: string[];
  missingEvidence: string[];
  rejectionRules: string[];
  storageTarget: string;
  proofGateRoute?: string;
};

const ledgerItems: EvidenceLedgerItem[] = [
  {
    id: "source-seal-evidence",
    phaseId: "source-seal-validate",
    title: "Jarvis Source Seal Evidence",
    state: "SOURCE_READY",
    launchCritical: true,
    evidenceClass: "source",
    acceptedEvidence: ["source seal validator passed", "final HUD validator passed", "productionReady remains false"],
    missingEvidence: [],
    rejectionRules: ["reject if publicLaunchAllowed becomes true before runtime proof"],
    storageTarget: "reports/jarvis/source-seal-validation.json"
  },
  {
    id: "openclaw-evidence",
    phaseId: "openclaw-operator-policy",
    title: "OpenClaw Operator Policy Evidence",
    state: "ACCEPTED_PREVIOUSLY",
    launchCritical: false,
    evidenceClass: "source",
    acceptedEvidence: ["operator-only proof", "no policy bypass", "no raw secret access", "no direct Truth Vault writes"],
    missingEvidence: [],
    rejectionRules: ["reject if OpenClaw can execute without approval", "reject if OpenClaw can alter payments"],
    storageTarget: "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json"
  },
  {
    id: "playwright-map-evidence",
    phaseId: "playwright-scout-map-fallback",
    title: "Playwright Scout MAP Fallback Evidence",
    state: "ACCEPTED_PREVIOUSLY",
    launchCritical: true,
    evidenceClass: "runtime",
    acceptedEvidence: ["scout-only proof", "MAP fallback proof", "CAPTCHA/OTP manual-only boundary"],
    missingEvidence: [],
    rejectionRules: ["reject if Playwright submits blocked portals", "reject if CAPTCHA/OTP is bypassed"],
    storageTarget: "reports/jarvis/jarvis-playwright-scout-map-fallback-boundary-proof-latest.json"
  },
  {
    id: "docker-api-truth-vault-evidence",
    phaseId: "docker-api-truth-vault-runtime",
    title: "Docker API Truth Vault Runtime Evidence",
    state: "BLOCKED",
    launchCritical: true,
    evidenceClass: "runtime",
    acceptedEvidence: [],
    missingEvidence: ["Docker engine reachable", "API health HTTP 200", "postgres_truth_vault storage mode", "command log write proof", "audit event write proof", "redacted runtime output"],
    rejectionRules: ["reject if health is 500", "reject if storage mode is memory", "reject if browser writes database directly", "reject if proof is only a static source route"],
    storageTarget: "reports/jarvis/backend-truth-vault-runtime-proof.json",
    proofGateRoute: "/api/jarvis/docker-truth-vault-runtime-proof"
  },
  {
    id: "ai-live-call-evidence",
    phaseId: "ai-provider-live-proof",
    title: "AI Provider Live Call Evidence",
    state: "MISSING",
    launchCritical: true,
    evidenceClass: "provider",
    acceptedEvidence: [],
    missingEvidence: ["provider selected", "model selected", "API key outside Git", "backend-controlled live-call proof", "policy gate proof", "cost/rate boundary proof", "redacted request/response evidence"],
    rejectionRules: ["reject if raw API key is printed", "reject if browser calls provider directly", "reject if policy gate is absent", "reject if mock completion is called live"],
    storageTarget: "reports/jarvis/ai-provider-live-call-proof.json",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof"
  },
  {
    id: "email-primary-evidence",
    phaseId: "email-primary-proof",
    title: "Email Primary Channel Evidence",
    state: "MISSING",
    launchCritical: true,
    evidenceClass: "provider",
    acceptedEvidence: [],
    missingEvidence: ["SMTP/provider credentials outside Git", "test send proof", "delivery or receive evidence", "bounce handling", "opt-out proof", "redaction proof", "message evidence ledger"],
    rejectionRules: ["reject if WhatsApp becomes bulk channel", "reject if SMS replaces primary email", "reject if raw SMTP password is exposed", "reject if email evidence ledger is absent"],
    storageTarget: "reports/jarvis/email-primary-channel-proof.json",
    proofGateRoute: "/api/jarvis/ai-email-provider-live-proof"
  },
  {
    id: "payfast-itn-evidence",
    phaseId: "payfast-itn-proof",
    title: "PayFast Accepted ITN Evidence",
    state: "MISSING",
    launchCritical: true,
    evidenceClass: "payment",
    acceptedEvidence: [],
    missingEvidence: ["sandbox checkout proof", "accepted ITN proof", "duplicate ITN rejection", "failed payment rejection", "refund review boundary", "founder approval"],
    rejectionRules: ["reject if return URL marks paid", "reject if cancel URL marks paid", "reject if duplicate ITN is accepted", "reject if failed/pending/cancelled payment marks paid", "reject if founder approval is missing"],
    storageTarget: "reports/jarvis/payfast-accepted-itn-proof.json",
    proofGateRoute: "/api/jarvis/payfast-accepted-itn-proof"
  },
  {
    id: "n8n-airtable-github-evidence",
    phaseId: "n8n-airtable-github-runtime",
    title: "n8n Airtable GitHub Runtime Evidence",
    state: "MISSING",
    launchCritical: true,
    evidenceClass: "provider",
    acceptedEvidence: [],
    missingEvidence: ["n8n thin relay proof", "Airtable mirror-only proof", "GitHub token redaction proof", "Truth Vault authority proof"],
    rejectionRules: ["reject if n8n writes Truth Vault directly", "reject if Airtable becomes authority", "reject if GitHub token is exposed"],
    storageTarget: "reports/jarvis/tool-runtime-proof.json"
  },
  {
    id: "branch-protection-launch-audit-evidence",
    phaseId: "branch-protection-launch-audit",
    title: "Branch Protection Final Launch Audit Evidence",
    state: "MISSING",
    launchCritical: true,
    evidenceClass: "security",
    acceptedEvidence: [],
    missingEvidence: ["main branch protection", "required checks", "rollback evidence", "final launch audit"],
    rejectionRules: ["reject if branch protection is absent", "reject if launch audit fails", "reject if rollback evidence is absent"],
    storageTarget: "reports/jarvis/final-launch-audit-proof.json"
  }
];

const counts = ledgerItems.reduce<Record<LedgerState, number>>((acc, item) => {
  acc[item.state] = (acc[item.state] ?? 0) + 1;
  return acc;
}, {
  SOURCE_READY: 0,
  MISSING: 0,
  BLOCKED: 0,
  REJECTED: 0,
  ACCEPTED_PREVIOUSLY: 0
});

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-live-proof-evidence-ledger.v1",
    module: "Jarvis Live Proof Evidence Ledger",
    generatedAt: new Date().toISOString(),
    jarvisSourceReady: true,
    dockerRuntimeProofGateConnected: true,
    aiEmailProviderProofGateConnected: true,
    payfastAcceptedItnProofGateConnected: true,
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
    counts,
    ledgerItems,
    nextAction: "Capture missing runtime/provider/security/payment evidence, reject unsafe evidence, and keep launch blocked until all launch-critical ledger items are accepted."
  });
}
