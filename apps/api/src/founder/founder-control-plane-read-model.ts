import {
  buildKingsmenOperatingSystemSpine,
  listKingsmenLaunchBlockers,
  type KingsmenOperatingModule,
  type KingsmenProofStatus
} from "../system/kingsmen-operating-system-spine";

export interface FounderControlPlaneModuleCard {
  moduleCode: string;
  name: string;
  proofStatus: KingsmenProofStatus;
  owner: string;
  validatorCommand: string;
  reportPath: string;
  blockers: string[];
}

export interface FounderControlPlaneQueueCard {
  queue: string;
  purpose: string;
  owner: string;
  status: "OPEN" | "BLOCKED" | "PROOF_REQUIRED" | "FOUNDER_REVIEW_REQUIRED";
  nextAction: string;
}

export interface FounderControlPlaneReadModel {
  generatedAtIso: string;
  productionReady: false;
  publicLaunchAllowed: false;
  authority: {
    backendIsAuthority: true;
    postgresIsTruth: true;
    jarvisRole: "brain_router_not_secret_store_not_final_authority";
    openclawRole: "operator_worker_requires_policy_and_evidence";
    airtableMirrorOnly: true;
    n8nThinRelayOnly: true;
    playwrightScoutOnly: true;
  };
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
  modules: FounderControlPlaneModuleCard[];
  queues: FounderControlPlaneQueueCard[];
  launchBlockers: string[];
  validatorCommands: string[];
}

function countByStatus(modules: KingsmenOperatingModule[], status: KingsmenProofStatus): number {
  return modules.filter((module) => module.proofStatus === status).length;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort();
}

export function buildFounderControlPlaneReadModel(nowIso = new Date().toISOString()): FounderControlPlaneReadModel {
  const spine = buildKingsmenOperatingSystemSpine();
  const modules = spine.modules;
  const launchBlockers = listKingsmenLaunchBlockers();

  return {
    generatedAtIso: nowIso,
    productionReady: false,
    publicLaunchAllowed: false,
    authority: {
      backendIsAuthority: true,
      postgresIsTruth: true,
      jarvisRole: spine.jarvisRole,
      openclawRole: spine.openclawRole,
      airtableMirrorOnly: true,
      n8nThinRelayOnly: true,
      playwrightScoutOnly: true
    },
    totals: {
      modules: modules.length,
      sourceBuilt: countByStatus(modules, "SOURCE_BUILT"),
      validatorRequired: countByStatus(modules, "VALIDATOR_REQUIRED"),
      stagingProofRequired: countByStatus(modules, "STAGING_PROOF_REQUIRED"),
      providerProofRequired: countByStatus(modules, "PROVIDER_PROOF_REQUIRED"),
      founderReviewRequired: countByStatus(modules, "FOUNDER_REVIEW_REQUIRED"),
      readyAfterGate: countByStatus(modules, "READY_AFTER_GATE"),
      blockers: launchBlockers.length
    },
    modules: modules.map((module) => ({
      moduleCode: module.moduleCode,
      name: module.name,
      proofStatus: module.proofStatus,
      owner: module.agentOwner,
      validatorCommand: module.validatorCommand,
      reportPath: module.reportPath,
      blockers: module.launchBlockers
    })),
    queues: [
      {
        queue: "Launch Gate",
        purpose: "Blocks public launch until source, staging, provider, legal, finance, security, and founder proof are real.",
        owner: "FOUNDER_CONTROL",
        status: "BLOCKED",
        nextAction: "Run npm run kingsmen:launch:gate after staging/provider evidence is captured."
      },
      {
        queue: "Jarvis Build Queue",
        purpose: "Routes safe build batches across N00-N20 without becoming final authority.",
        owner: "JARVIS_BRAIN_ROUTER",
        status: "OPEN",
        nextAction: "Continue controlled repo-materialized batches with validators and reports."
      },
      {
        queue: "Payment Proof Queue",
        purpose: "Keeps PayFast live activation blocked until verification and sandbox ITN proof pass.",
        owner: "BACKEND_KERNEL",
        status: "PROVIDER_PROOF_REQUIRED",
        nextAction: "Complete PayFast verification, configure runtime secrets outside Git, and run sandbox ITN proof."
      },
      {
        queue: "Document Vault Proof Queue",
        purpose: "Proves uploads, storage, metadata, POPIA boundary, and review workflows.",
        owner: "POSTGRES_TRUTH_VAULT",
        status: "PROOF_REQUIRED",
        nextAction: "Run document vault staging storage proof and capture redacted evidence."
      },
      {
        queue: "Communications Proof Queue",
        purpose: "Proves email-primary, WhatsApp urgent-only, SMS backup, templates, and message evidence.",
        owner: "BACKEND_KERNEL",
        status: "PROVIDER_PROOF_REQUIRED",
        nextAction: "Run provider staging proof; do not enable bulk WhatsApp."
      },
      {
        queue: "Founder Review Queue",
        purpose: "Captures founder review for launch, refunds, urgent WhatsApp, legal, production risk, and live payments.",
        owner: "FOUNDER_CONTROL",
        status: "FOUNDER_REVIEW_REQUIRED",
        nextAction: "Review unresolved blockers with cause, why it matters, and how to fix."
      }
    ],
    launchBlockers,
    validatorCommands: unique(modules.map((module) => module.validatorCommand).concat([
      "npm run kingsmen:validate:connected-system",
      "npm run payments:validate:clean-sync",
      "npm run kingsmen:launch:gate"
    ]))
  };
}

export const FOUNDER_CONTROL_PLANE_DOCTRINE = {
  founderSeesAllNSeriesModules: true,
  productionReadyFalseUntilRuntimeProof: true,
  publicLaunchBlockedUntilGate: true,
  blockerListMustIncludeCauseAndNextAction: true,
  jarvisCannotHideBlockers: true,
  founderApprovalRequiredForRisk: true
} as const;
