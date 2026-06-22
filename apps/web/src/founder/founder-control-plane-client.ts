export interface FounderModuleCardView {
  moduleCode: string;
  name: string;
  proofStatus: string;
  owner: string;
  validatorCommand: string;
  reportPath: string;
  blockers: string[];
}

export interface FounderQueueCardView {
  queue: string;
  purpose: string;
  owner: string;
  status: string;
  nextAction: string;
}

export interface FounderControlPlaneViewModel {
  generatedAtIso: string;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  totals: {
    modules: number;
    sourceBuilt: number;
    validatorRequired: number;
    stagingProofRequired: number;
    providerProofRequired: number;
    founderReviewRequired: number;
    readyAfterGate: number;
    blockers: number;
  };
  authority: {
    backendIsAuthority: boolean;
    postgresIsTruth: boolean;
    jarvisRole: string;
    openclawRole: string;
    airtableMirrorOnly: boolean;
    n8nThinRelayOnly: boolean;
    playwrightScoutOnly: boolean;
  };
  modules: FounderModuleCardView[];
  queues: FounderQueueCardView[];
  launchBlockers: string[];
  validatorCommands: string[];
  error?: string;
}

export const FALLBACK_FOUNDER_CONTROL_PLANE: FounderControlPlaneViewModel = {
  generatedAtIso: "source-fallback",
  productionReady: false,
  publicLaunchAllowed: false,
  totals: {
    modules: 21,
    sourceBuilt: 0,
    validatorRequired: 7,
    stagingProofRequired: 8,
    providerProofRequired: 2,
    founderReviewRequired: 4,
    readyAfterGate: 0,
    blockers: 12
  },
  authority: {
    backendIsAuthority: true,
    postgresIsTruth: true,
    jarvisRole: "brain_router_not_secret_store_not_final_authority",
    openclawRole: "operator_worker_requires_policy_and_evidence",
    airtableMirrorOnly: true,
    n8nThinRelayOnly: true,
    playwrightScoutOnly: true
  },
  modules: [
    { moduleCode: "N00", name: "Constitution and Doctrine Lock", proofStatus: "VALIDATOR_REQUIRED", owner: "JARVIS_BRAIN_ROUTER", validatorCommand: "npm run kingsmen:launch:audit", reportPath: "reports/launch/kingsmen-launch-readiness-latest.json", blockers: ["missing doctrine file", "unsafe production flag"] },
    { moduleCode: "N03", name: "PostgreSQL Truth Vault", proofStatus: "STAGING_PROOF_REQUIRED", owner: "POSTGRES_TRUTH_VAULT", validatorCommand: "npm run api:validate:truth-vault", reportPath: "reports/api/truth-vault-persistence-latest.json", blockers: ["RLS failure", "database not reachable"] },
    { moduleCode: "N04", name: "Candidate Portal and Support Centre", proofStatus: "VALIDATOR_REQUIRED", owner: "BACKEND_KERNEL", validatorCommand: "npm run payments:validate:candidate-status", reportPath: "reports/finance/candidate-payment-status-latest.json", blockers: ["candidate sees another candidate", "payment status cached unsafely"] },
    { moduleCode: "N05", name: "Document Vault", proofStatus: "STAGING_PROOF_REQUIRED", owner: "POSTGRES_TRUTH_VAULT", validatorCommand: "npm run document-vault:staging", reportPath: "reports/staging/document-vault-storage-staging-latest.json", blockers: ["storage proof missing", "POPIA boundary missing"] },
    { moduleCode: "N06", name: "Route Universe and Application Workbench", proofStatus: "VALIDATOR_REQUIRED", owner: "JARVIS_BRAIN_ROUTER", validatorCommand: "npm run kingsmen:launch:audit", reportPath: "reports/launch/kingsmen-launch-readiness-latest.json", blockers: ["fake institution data", "no manual fallback"] },
    { moduleCode: "N09", name: "Communications Centre", proofStatus: "PROVIDER_PROOF_REQUIRED", owner: "BACKEND_KERNEL", validatorCommand: "npm run communications:validate", reportPath: "reports/communications/communications-proof-latest.json", blockers: ["bulk WhatsApp", "provider proof missing"] },
    { moduleCode: "N10", name: "Finance and PayFast", proofStatus: "PROVIDER_PROOF_REQUIRED", owner: "BACKEND_KERNEL", validatorCommand: "npm run payments:validate:clean-sync", reportPath: "reports/finance/payfast-clean-sync-carry-forward-latest.json", blockers: ["PayFast verification missing", "sandbox ITN proof missing"] },
    { moduleCode: "N15", name: "Opportunity Engine", proofStatus: "VALIDATOR_REQUIRED", owner: "JARVIS_BRAIN_ROUTER", validatorCommand: "npm run kingsmen:launch:audit", reportPath: "reports/launch/kingsmen-launch-readiness-latest.json", blockers: ["unverified opportunity", "source stale"] },
    { moduleCode: "N16", name: "Execution Orchestrator and Workers", proofStatus: "STAGING_PROOF_REQUIRED", owner: "OPENCLAW_OPERATOR", validatorCommand: "npm run staging:validate:pack", reportPath: "reports/staging/staging-runtime-proof-pack-latest.json", blockers: ["forced portal automation", "no MAP fallback"] },
    { moduleCode: "N20", name: "Final Assembly and Launch Gate", proofStatus: "STAGING_PROOF_REQUIRED", owner: "FOUNDER_CONTROL", validatorCommand: "npm run kingsmen:launch:gate", reportPath: "reports/launch/kingsmen-launch-readiness-latest.json", blockers: ["any required proof missing", "branch not mergeable", "provider not verified"] }
  ],
  queues: [
    { queue: "Launch Gate", purpose: "Blocks public launch until all evidence is real.", owner: "FOUNDER_CONTROL", status: "BLOCKED", nextAction: "Run npm run kingsmen:launch:gate after runtime proofs are captured." },
    { queue: "Jarvis Build Queue", purpose: "Routes safe N00-N20 build batches.", owner: "JARVIS_BRAIN_ROUTER", status: "OPEN", nextAction: "Continue repo-materialized batches with validators." },
    { queue: "Payment Proof Queue", purpose: "Blocks live payments until PayFast proof passes.", owner: "BACKEND_KERNEL", status: "PROVIDER_PROOF_REQUIRED", nextAction: "Complete PayFast verification and sandbox ITN proof." },
    { queue: "Document Vault Proof Queue", purpose: "Proves document storage and review safety.", owner: "POSTGRES_TRUTH_VAULT", status: "PROOF_REQUIRED", nextAction: "Run document vault staging proof." },
    { queue: "Communications Proof Queue", purpose: "Proves email primary and urgent-only WhatsApp.", owner: "BACKEND_KERNEL", status: "PROVIDER_PROOF_REQUIRED", nextAction: "Run communications provider staging proof." },
    { queue: "Founder Review Queue", purpose: "Captures approvals for risk, launch, refunds, and legal.", owner: "FOUNDER_CONTROL", status: "FOUNDER_REVIEW_REQUIRED", nextAction: "Review blockers with cause, why, and how to fix." }
  ],
  launchBlockers: [
    "Runtime secrets must be configured outside Git.",
    "PostgreSQL/Supabase staging proof must pass.",
    "PayFast sandbox ITN proof must pass.",
    "Communications provider staging proof must pass.",
    "Document vault storage proof must pass.",
    "Legal/privacy publication proof must pass.",
    "Backup restore drill must pass.",
    "Founder final launch approval must be recorded."
  ],
  validatorCommands: [
    "npm run kingsmen:validate:connected-system",
    "npm run payments:validate:clean-sync",
    "npm run communications:validate",
    "npm run legal:validate",
    "npm run observability:validate",
    "npm run backup:validate:restore",
    "npm run kingsmen:launch:gate"
  ]
};

export async function fetchFounderControlPlane(input: { apiBaseUrl?: string } = {}): Promise<FounderControlPlaneViewModel> {
  const apiBaseUrl = input.apiBaseUrl ?? process.env.KINGSMEN_API_BASE_URL ?? process.env.NEXT_PUBLIC_KINGSMEN_API_BASE_URL;
  if (!apiBaseUrl) {
    return {
      ...FALLBACK_FOUNDER_CONTROL_PLANE,
      error: "Backend API base URL is not configured. Showing source fallback control-plane data."
    };
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/founder/control-plane`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store"
    });
    const body = await response.json() as { ok?: boolean; readModel?: FounderControlPlaneViewModel };
    if (body.ok && body.readModel) return body.readModel;
    return { ...FALLBACK_FOUNDER_CONTROL_PLANE, error: "Backend returned an invalid founder control-plane response." };
  } catch (error) {
    return {
      ...FALLBACK_FOUNDER_CONTROL_PLANE,
      error: error instanceof Error ? error.message : "Founder control-plane lookup failed."
    };
  }
}

export const FOUNDER_CONTROL_PLANE_CLIENT_DOCTRINE = {
  backendReadPreferred: true,
  noLocalTruthMutation: true,
  noSecretsDisplayed: true,
  fallbackIsSourceOnlyAndMarked: true,
  cacheDisabledForRuntimeStatus: true
} as const;
