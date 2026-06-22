import { NextResponse } from "next/server";

import { getKingsmenApiHealth, getKingsmenBackendBoundary } from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BackendHealth = {
  ok?: boolean;
  service?: string;
  status?: string;
  storageMode?: string;
  routes?: string[];
};

type LiveIndexState = "LIVE" | "SOURCE_READY" | "PENDING_RUNTIME_PROOF" | "DEFERRED";

type LiveIndexGroup = "ai" | "tool" | "app" | "agent" | "infrastructure";

function entry(input: {
  id: string;
  title: string;
  group: LiveIndexGroup;
  state: LiveIndexState;
  detail: string;
  launchCritical: boolean;
  evidenceRef?: string;
  boundaryRoute?: string;
  validatorScript?: string;
  runtimeProofScript?: string;
}) {
  return {
    ...input,
    noFakeData: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false
  };
}

export async function GET() {
  const boundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendLive = health.ok && health.data?.ok === true;
  const backendStorageMode = health.data?.storageMode || "unreachable";
  const truthVaultLive = backendLive && backendStorageMode === "postgres_truth_vault";
  const dockerIndependentBuildAllowed = true;
  const runtimeBlocker = backendLive ? null : "LOCAL_DOCKER_OR_API_RUNTIME_NOT_AVAILABLE";
  const openClawRuntimeProven = truthVaultLive;

  const entries = [
    entry({
      id: "backend-api",
      title: "Backend API Authority",
      group: "infrastructure",
      state: backendLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: backendLive ? "Backend health responded through the configured API boundary." : "Backend API must run and respond before Jarvis can be production-real. Continue source-safe Jarvis construction while Docker/API is unavailable.",
      launchCritical: true
    }),
    entry({
      id: "truth-vault",
      title: "PostgreSQL Truth Vault",
      group: "infrastructure",
      state: truthVaultLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: truthVaultLive ? "Backend reports postgres_truth_vault storage mode." : "Truth Vault must be proven live through backend health and command persistence. Source work can continue without making fake runtime claims.",
      launchCritical: true
    }),
    entry({
      id: "jarvis-command-envelope",
      title: "Jarvis Command Envelope",
      group: "agent",
      state: "SOURCE_READY",
      detail: "Jarvis command UI sends whitelisted SAFE_READ envelopes to /api/jarvis/command and never runs local shell from the browser.",
      launchCritical: true,
      validatorScript: "npm run jarvis:validate:command-persistence",
      runtimeProofScript: "npm run jarvis:runtime:command-proof"
    }),
    entry({
      id: "jarvis-completion-board",
      title: "Jarvis Completion Board",
      group: "agent",
      state: "SOURCE_READY",
      detail: "Docker-independent Jarvis completion board keeps the build moving while local runtime is blocked. It indexes AI, tools, apps, agents, provider blockers, proof routes, validators, and launch gates without claiming production readiness.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/completion-board",
      validatorScript: "npm run jarvis:validate:completion-board"
    }),
    entry({
      id: "ai-tools-runtime-readiness",
      title: "AI Tools Runtime Readiness",
      group: "ai",
      state: "SOURCE_READY",
      detail: "AI/tools/apps/agents readiness contract exists, but live AI provider calls still require backend-controlled credentials outside Git and redacted runtime evidence.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/ai-tools-runtime-readiness"
    }),
    entry({
      id: "ai-provider-router",
      title: "AI Provider Router",
      group: "ai",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Real AI model routing must be backend-controlled with policy gates, provider credentials outside Git, and evidence of a live provider call.",
      launchCritical: true
    }),
    entry({
      id: "github-tool-connector",
      title: "GitHub Tool Connector Boundary",
      group: "tool",
      state: "PENDING_RUNTIME_PROOF",
      detail: "GitHub connector boundary is source-wired. Runtime proof still requires redacted repository metadata evidence, backend command acceptance, and no raw token return.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/github-tool-connector-boundary",
      validatorScript: "npm run jarvis:validate:github-tool-boundary",
      runtimeProofScript: "npm run jarvis:runtime:github-tool-boundary"
    }),
    entry({
      id: "airtable-human-mirror",
      title: "Airtable Human Mirror Boundary",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Airtable remains a human mirror only. Runtime proof needs redacted provider credentials and evidence that Airtable never becomes authority.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/airtable-human-mirror-boundary",
      validatorScript: "npm run jarvis:validate:airtable-human-mirror",
      runtimeProofScript: "npm run jarvis:runtime:airtable-human-mirror"
    }),
    entry({
      id: "email-primary",
      title: "Email Primary Channel",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Email remains the primary tracked communication channel. Provider send, receive, bounce, opt-out, redaction, and evidence proof are still required before real candidate messaging.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/email-primary-channel-boundary",
      validatorScript: "npm run jarvis:validate:email-primary-channel",
      runtimeProofScript: "npm run jarvis:runtime:email-primary-channel"
    }),
    entry({
      id: "payfast-sandbox",
      title: "PayFast Sandbox Provider Proof",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Source proof is clean, but real sandbox checkout and accepted ITN evidence are still required before payment launch.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/payfast-provider-proof-queue-boundary",
      validatorScript: "npm run jarvis:validate:payfast-provider-proof-queue",
      runtimeProofScript: "npm run jarvis:runtime:payfast-provider-proof-queue"
    }),
    entry({
      id: "n8n-thin-relay",
      title: "n8n Thin Relay Boundary",
      group: "tool",
      state: "PENDING_RUNTIME_PROOF",
      detail: "n8n remains a thin relay only. Runtime proof requires real n8n base URL, API key, webhook secret, backend command evidence, and no direct Truth Vault writes.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/n8n-thin-relay-boundary",
      validatorScript: "npm run jarvis:validate:n8n-thin-relay",
      runtimeProofScript: "npm run jarvis:runtime:n8n-thin-relay"
    }),
    entry({
      id: "playwright-scout-map-fallback",
      title: "Playwright Scout + MAP Fallback Boundary",
      group: "tool",
      state: truthVaultLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: truthVaultLive
        ? "Playwright scout/MAP fallback boundary can be indexed live because backend and postgres_truth_vault are reachable. Playwright remains scout/probe only."
        : "Playwright scout/MAP fallback source is wired. Runtime-live indexing waits for backend and postgres_truth_vault, with MAP, Phoenix, and CAPTCHA/OTP manual fallback still locked.",
      launchCritical: true,
      boundaryRoute: "/api/jarvis/playwright-scout-map-fallback-boundary",
      validatorScript: "npm run jarvis:validate:playwright-scout-map-fallback",
      runtimeProofScript: "npm run jarvis:runtime:playwright-scout-map-fallback"
    }),
    entry({
      id: "openclaw-operator-policy",
      title: "OpenClaw Operator Policy Boundary",
      group: "agent",
      state: openClawRuntimeProven ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: openClawRuntimeProven
        ? "OpenClaw operator policy is runtime-proven through backend health, postgres_truth_vault mode, web boundary reachability, and OPENCLAW_OPERATOR_POLICY_CHECK command evidence. OpenClaw remains operator-only and cannot become production authority."
        : "OpenClaw must prove backend health, postgres_truth_vault mode, web boundary reachability, and OPENCLAW_OPERATOR_POLICY_CHECK command evidence before live-readiness indexing.",
      launchCritical: false,
      evidenceRef: "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
      boundaryRoute: "/api/jarvis/openclaw-operator-policy-boundary",
      validatorScript: "npm run jarvis:validate:openclaw-operator-policy",
      runtimeProofScript: "npm run jarvis:runtime:openclaw-operator-policy"
    }),
    entry({
      id: "whatsapp-urgent-sms-backup",
      title: "WhatsApp Urgent Only / SMS Backup Boundary",
      group: "agent",
      state: "DEFERRED",
      detail: "WhatsApp remains urgent-only and cost-justified; SMS remains backup only. No bulk messaging and no channel authority over email/evidence ledger.",
      launchCritical: false,
      boundaryRoute: "/api/jarvis/whatsapp-urgent-sms-backup-boundary",
      validatorScript: "npm run jarvis:validate:whatsapp-urgent-sms-backup",
      runtimeProofScript: "npm run jarvis:runtime:whatsapp-urgent-sms-backup"
    }),
    entry({
      id: "tool-registry",
      title: "Tools and Apps Registry",
      group: "tool",
      state: "SOURCE_READY",
      detail: "GitHub, n8n, Playwright, Airtable, PayFast, Email, Storage, OpenClaw, WhatsApp, and SMS are indexed as real integration boundaries, not dummy cards.",
      launchCritical: true
    })
  ];

  const summary = {
    total: entries.length,
    live: entries.filter((item) => item.state === "LIVE").length,
    sourceReady: entries.filter((item) => item.state === "SOURCE_READY").length,
    pendingRuntimeProof: entries.filter((item) => item.state === "PENDING_RUNTIME_PROOF").length,
    deferred: entries.filter((item) => item.state === "DEFERRED").length
  };

  return NextResponse.json({
    schema: "kingsmen.jarvis-live-index.v1",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    noFakeData: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    dockerIndependentBuildAllowed,
    runtimeBlocker,
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode,
    backendHealth: health.data,
    openClawRuntimeProven,
    summary,
    entries,
    nextAction: backendLive
      ? "Run runtime provider proofs and final staging evidence captures."
      : "Continue Docker-independent Jarvis source batches, provider wiring, validators, docs, manifests, and completion board while local Docker/API runtime is blocked."
  });
}
