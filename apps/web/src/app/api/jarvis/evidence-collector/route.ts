import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EvidenceItem = {
  id: string;
  title: string;
  evidenceType: "SOURCE" | "VALIDATOR" | "RUNTIME" | "PROVIDER" | "LAUNCH" | "BLOCKER";
  state: "CAPTURED" | "PENDING" | "BLOCKED" | "DEFERRED";
  source: string;
  requiredBeforeLaunch: boolean;
  detail: string;
};

const evidenceItems: EvidenceItem[] = [
  {
    id: "jarvis-completion-board-source",
    title: "Jarvis Completion Board Source Proof",
    evidenceType: "VALIDATOR",
    state: "CAPTURED",
    source: "scripts/validators/validate-jarvis-completion-board.mjs",
    requiredBeforeLaunch: true,
    detail: "Completion board source is validator-backed and Docker independent."
  },
  {
    id: "jarvis-dashboard-source",
    title: "Jarvis Dashboard Source Proof",
    evidenceType: "VALIDATOR",
    state: "CAPTURED",
    source: "scripts/validators/validate-jarvis-dashboard-completion-board.mjs",
    requiredBeforeLaunch: true,
    detail: "Main Jarvis dashboard reads status, completion board, and live index."
  },
  {
    id: "jarvis-final-hud-source",
    title: "Jarvis Final HUD Source Proof",
    evidenceType: "SOURCE",
    state: "CAPTURED",
    source: "/api/jarvis/final-command-hud",
    requiredBeforeLaunch: true,
    detail: "Final Jarvis HUD is source-ready and explicitly not production-ready."
  },
  {
    id: "provider-credential-checklist-source",
    title: "Provider Credential Checklist Source Proof",
    evidenceType: "SOURCE",
    state: "CAPTURED",
    source: "/api/jarvis/provider-credential-checklist",
    requiredBeforeLaunch: true,
    detail: "Provider names and credential names are listed without values."
  },
  {
    id: "openclaw-runtime-proof",
    title: "OpenClaw Operator Policy Runtime Proof",
    evidenceType: "RUNTIME",
    state: "CAPTURED",
    source: "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
    requiredBeforeLaunch: false,
    detail: "OpenClaw remains operator-only and cannot bypass approval or write Truth Vault directly."
  },
  {
    id: "playwright-map-runtime-proof",
    title: "Playwright Scout MAP Runtime Proof",
    evidenceType: "RUNTIME",
    state: "CAPTURED",
    source: "reports/jarvis/jarvis-playwright-scout-map-fallback-boundary-proof-latest.json",
    requiredBeforeLaunch: true,
    detail: "Playwright remains scout/probe only and falls back to MAP/Phoenix/manual routes."
  },
  {
    id: "backend-truth-vault-runtime",
    title: "Backend and Truth Vault Runtime Proof",
    evidenceType: "RUNTIME",
    state: "BLOCKED",
    source: "/api/system/health",
    requiredBeforeLaunch: true,
    detail: "Blocked until Docker/API is stable locally or staging backend is connected."
  },
  {
    id: "ai-provider-live-proof",
    title: "AI Provider Live Proof",
    evidenceType: "PROVIDER",
    state: "PENDING",
    source: "/api/jarvis/ai-tools-runtime-readiness",
    requiredBeforeLaunch: true,
    detail: "Pending real provider configuration and redacted backend live-call evidence."
  },
  {
    id: "email-provider-proof",
    title: "Email Provider Proof",
    evidenceType: "PROVIDER",
    state: "PENDING",
    source: "/api/jarvis/email-primary-channel-boundary",
    requiredBeforeLaunch: true,
    detail: "Pending send, receive, bounce, opt-out, redaction, and evidence proof."
  },
  {
    id: "payfast-itn-proof",
    title: "PayFast Sandbox ITN Proof",
    evidenceType: "PROVIDER",
    state: "PENDING",
    source: "/api/jarvis/payfast-provider-proof-queue-boundary",
    requiredBeforeLaunch: true,
    detail: "Pending sandbox checkout, accepted ITN, duplicate rejection, failed payment rejection, refund review, and founder approval."
  },
  {
    id: "branch-protection-proof",
    title: "Branch Protection Proof",
    evidenceType: "LAUNCH",
    state: "PENDING",
    source: "repo:validate:branch-protection",
    requiredBeforeLaunch: true,
    detail: "Pending final branch protection evidence before launch."
  }
];

const counts = evidenceItems.reduce<Record<string, number>>((acc, item) => {
  acc[item.state] = (acc[item.state] ?? 0) + 1;
  return acc;
}, {});

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-evidence-collector.v1",
    module: "Jarvis Evidence Collector",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    evidenceAuthority: "reports, validators, backend runtime proofs, and provider evidence only",
    counts,
    evidenceItems,
    nextAction: "Resolve blocked runtime and pending provider proofs before final launch gate."
  });
}
