export type JarvisKingsmenSurface =
  | "backend"
  | "postgres"
  | "candidate_portal"
  | "document_vault"
  | "route_universe"
  | "communications"
  | "finance"
  | "opportunity_engine"
  | "execution_orchestrator"
  | "founder_control"
  | "observability"
  | "launch_gate";

export interface JarvisKingsmenBridgeSurface {
  surface: JarvisKingsmenSurface;
  authority: "backend" | "postgres" | "founder" | "source_validator";
  safeRead: boolean;
  safeWrite: boolean;
  validatorCommand: string;
  evidencePath: string;
  deniedActions: string[];
}

export interface JarvisKingsmenCommandRoute {
  command: string;
  surface: JarvisKingsmenSurface;
  dispatchTo: "BACKEND_API" | "VALIDATOR" | "FOUNDER_REVIEW" | "POWER_SHELL_CREATOR" | "MANUAL_PACKAGE";
  requiresEvidence: boolean;
  requiresFounderApproval: boolean;
  mayChangeTruth: boolean;
}

export const JARVIS_KINGSMEN_BRIDGE_SURFACES: JarvisKingsmenBridgeSurface[] = [
  {
    surface: "backend",
    authority: "backend",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run api:validate",
    evidencePath: "reports/api/api-validation-latest.json",
    deniedActions: ["bypassPolicy", "skipIdempotency"]
  },
  {
    surface: "postgres",
    authority: "postgres",
    safeRead: true,
    safeWrite: false,
    validatorCommand: "npm run api:validate:truth-vault",
    evidencePath: "reports/api/truth-vault-persistence-latest.json",
    deniedActions: ["directBrowserWrite", "disableRls", "commitPrivateData"]
  },
  {
    surface: "candidate_portal",
    authority: "backend",
    safeRead: true,
    safeWrite: false,
    validatorCommand: "npm run web:validate:backend-boundary",
    evidencePath: "reports/web/safe-web-backend-boundary-latest.json",
    deniedActions: ["localTruthWrite", "crossCandidateRead"]
  },
  {
    surface: "document_vault",
    authority: "postgres",
    safeRead: true,
    safeWrite: false,
    validatorCommand: "npm run document-vault:staging",
    evidencePath: "reports/staging/document-vault-storage-staging-latest.json",
    deniedActions: ["commitRawDocument", "skipReview"]
  },
  {
    surface: "route_universe",
    authority: "backend",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run kingsmen:launch:audit",
    evidencePath: "reports/launch/kingsmen-launch-readiness-latest.json",
    deniedActions: ["fakeInstitutionData", "ignoreSourceConfidence", "forceAutomationOnCaptcha"]
  },
  {
    surface: "communications",
    authority: "backend",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run communications:validate",
    evidencePath: "reports/communications/communications-proof-latest.json",
    deniedActions: ["bulkWhatsapp", "untrackedSend", "providerSendWithoutProof"]
  },
  {
    surface: "finance",
    authority: "postgres",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run payments:validate:clean-sync",
    evidencePath: "reports/finance/payfast-clean-sync-carry-forward-latest.json",
    deniedActions: ["markPaidFromReturnUrl", "aiRefundApproval", "livePaymentWithoutProof"]
  },
  {
    surface: "opportunity_engine",
    authority: "backend",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run kingsmen:launch:audit",
    evidencePath: "reports/launch/kingsmen-launch-readiness-latest.json",
    deniedActions: ["fakeOpportunity", "unverifiedEmployer", "staleSourceWithoutFlag"]
  },
  {
    surface: "execution_orchestrator",
    authority: "backend",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run staging:validate:pack",
    evidencePath: "reports/staging/staging-runtime-proof-pack-latest.json",
    deniedActions: ["forcePortalSubmit", "ignoreMapFallback", "runOtpFlowUnattended"]
  },
  {
    surface: "founder_control",
    authority: "founder",
    safeRead: true,
    safeWrite: false,
    validatorCommand: "npm run observability:validate",
    evidencePath: "reports/ops/observability-incident-proof-latest.json",
    deniedActions: ["approveOwnRisk", "hideBlocker", "skipReview"]
  },
  {
    surface: "observability",
    authority: "source_validator",
    safeRead: true,
    safeWrite: true,
    validatorCommand: "npm run observability:validate",
    evidencePath: "reports/ops/observability-incident-proof-latest.json",
    deniedActions: ["dropIncident", "skipDlqReview"]
  },
  {
    surface: "launch_gate",
    authority: "founder",
    safeRead: true,
    safeWrite: false,
    validatorCommand: "npm run kingsmen:launch:gate",
    evidencePath: "reports/launch/kingsmen-launch-readiness-latest.json",
    deniedActions: ["publicLaunchWithoutGate", "productionReadyTrueWithoutProof"]
  }
];

export const JARVIS_KINGSMEN_COMMAND_ROUTES: JarvisKingsmenCommandRoute[] = [
  { command: "SYSTEM_STATUS", surface: "launch_gate", dispatchTo: "VALIDATOR", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: false },
  { command: "VALIDATE_MODULE", surface: "launch_gate", dispatchTo: "VALIDATOR", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: false },
  { command: "BUILD_SAFE_BATCH", surface: "backend", dispatchTo: "POWER_SHELL_CREATOR", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: false },
  { command: "CANDIDATE_READ", surface: "candidate_portal", dispatchTo: "BACKEND_API", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: false },
  { command: "DOCUMENT_REVIEW_QUEUE", surface: "document_vault", dispatchTo: "BACKEND_API", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: false },
  { command: "ROUTE_RECOMMENDATION", surface: "route_universe", dispatchTo: "BACKEND_API", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: true },
  { command: "SEND_EMAIL_NOTICE", surface: "communications", dispatchTo: "BACKEND_API", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: true },
  { command: "SEND_URGENT_WHATSAPP", surface: "communications", dispatchTo: "FOUNDER_REVIEW", requiresEvidence: true, requiresFounderApproval: true, mayChangeTruth: true },
  { command: "PAYMENT_STATUS_READ", surface: "finance", dispatchTo: "BACKEND_API", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: false },
  { command: "REFUND_REVIEW_PACK", surface: "finance", dispatchTo: "FOUNDER_REVIEW", requiresEvidence: true, requiresFounderApproval: true, mayChangeTruth: false },
  { command: "OPPORTUNITY_MATCH", surface: "opportunity_engine", dispatchTo: "BACKEND_API", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: true },
  { command: "MAP_FALLBACK", surface: "execution_orchestrator", dispatchTo: "MANUAL_PACKAGE", requiresEvidence: true, requiresFounderApproval: false, mayChangeTruth: true },
  { command: "INCIDENT_ESCALATE", surface: "observability", dispatchTo: "FOUNDER_REVIEW", requiresEvidence: true, requiresFounderApproval: true, mayChangeTruth: true },
  { command: "PUBLIC_LAUNCH_APPROVAL", surface: "launch_gate", dispatchTo: "FOUNDER_REVIEW", requiresEvidence: true, requiresFounderApproval: true, mayChangeTruth: true }
];

export function listJarvisKingsmenBridgeSurfaces(): JarvisKingsmenBridgeSurface[] {
  return JARVIS_KINGSMEN_BRIDGE_SURFACES;
}

export function resolveJarvisKingsmenCommandRoute(command: string): JarvisKingsmenCommandRoute | undefined {
  return JARVIS_KINGSMEN_COMMAND_ROUTES.find((route) => route.command === command);
}

export function assertJarvisKingsmenDeniedAction(surface: JarvisKingsmenSurface, action: string): boolean {
  const target = JARVIS_KINGSMEN_BRIDGE_SURFACES.find((item) => item.surface === surface);
  return Boolean(target?.deniedActions.includes(action));
}

export const JARVIS_KINGSMEN_SYSTEM_BRIDGE_DOCTRINE = {
  jarvisIsBrainRouter: true,
  backendRemainsAuthority: true,
  postgresRemainsTruth: true,
  founderApprovalRequiredForRisk: true,
  rawSecretsNeverStoredByJarvis: true,
  evidenceRequiredForEveryCommand: true,
  playrightScoutOnlyMapFallbackOnBlock: true,
  airtableMirrorOnly: true,
  n8nThinRelayOnly: true
} as const;
