export type KingsmenProofStatus =
  | "SOURCE_BUILT"
  | "VALIDATOR_REQUIRED"
  | "STAGING_PROOF_REQUIRED"
  | "PROVIDER_PROOF_REQUIRED"
  | "FOUNDER_REVIEW_REQUIRED"
  | "READY_AFTER_GATE";

export type KingsmenAgentOwner =
  | "BACKEND_KERNEL"
  | "POSTGRES_TRUTH_VAULT"
  | "JARVIS_BRAIN_ROUTER"
  | "OPENCLAW_OPERATOR"
  | "POWERSHELL_CREATOR"
  | "PLAYWRIGHT_SCOUT"
  | "AIRTABLE_MIRROR"
  | "N8N_THIN_RELAY"
  | "FOUNDER_CONTROL";

export interface KingsmenOperatingModule {
  moduleCode: string;
  name: string;
  purpose: string;
  appSurface: string[];
  truthSurface: string[];
  agentOwner: KingsmenAgentOwner;
  toolBoundary: string;
  validatorCommand: string;
  reportPath: string;
  proofStatus: KingsmenProofStatus;
  launchBlockers: string[];
}

export interface KingsmenJarvisCommandPolicy {
  command: string;
  allowed: boolean;
  requiresFounderApproval: boolean;
  evidenceRequired: boolean;
  deniedReason?: string;
}

export interface KingsmenOperatingSystemSpine {
  id: "kingsmen.connected-operating-system-spine.v1";
  productionReady: false;
  publicLaunchAllowed: false;
  noUselessLayers: true;
  backendIsAuthority: true;
  postgresIsTruth: true;
  jarvisRole: "brain_router_not_secret_store_not_final_authority";
  openclawRole: "operator_worker_requires_policy_and_evidence";
  modules: KingsmenOperatingModule[];
  jarvisCommandPolicy: KingsmenJarvisCommandPolicy[];
  finalLaunchGate: {
    command: "npm run kingsmen:launch:gate";
    blocksPublicLaunchUntilAllRuntimeProofsPass: true;
  };
}

export const KINGSMEN_OPERATING_MODULES: KingsmenOperatingModule[] = [
  {
    moduleCode: "N00",
    name: "Constitution and Doctrine Lock",
    purpose: "Keeps Kingsmen laws, no-guarantee rules, POPIA boundaries, no-useless-layer rule, and launch safety doctrine authoritative.",
    appSurface: ["docs", "manifests", "validators"],
    truthSurface: ["kingsmen-laws", "privacy doctrine", "source-confidence bands"],
    agentOwner: "JARVIS_BRAIN_ROUTER",
    toolBoundary: "Jarvis may read and route doctrine; founder approves production-risk changes.",
    validatorCommand: "npm run kingsmen:launch:audit",
    reportPath: "reports/launch/kingsmen-launch-readiness-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["missing doctrine file", "unsafe production flag", "raw secret committed"]
  },
  {
    moduleCode: "N01",
    name: "Repository Foundation and Oracle Lite Runtime",
    purpose: "Keeps GitHub, PowerShell creator, Docker/runtime skeletons, and source guard as build evidence.",
    appSurface: ["repo", "PowerShell", "source guard"],
    truthSurface: ["GitHub evidence", "validator reports"],
    agentOwner: "POWERSHELL_CREATOR",
    toolBoundary: "PowerShell writes controlled files and reports; GitHub stores proof.",
    validatorCommand: "npm run repo:validate:branch-protection",
    reportPath: "reports/repo/main-branch-protection-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["branch protection not applied", "source guard failing"]
  },
  {
    moduleCode: "N02",
    name: "Backend Kernel and Command Bus",
    purpose: "Receives commands, applies policy, keeps idempotency, and refuses unsafe actions.",
    appSurface: ["/api/commands", "/api/workflow-results", "/health"],
    truthSurface: ["command ledger", "workflow result ledger", "correlation IDs"],
    agentOwner: "BACKEND_KERNEL",
    toolBoundary: "Backend is authority; n8n is relay only.",
    validatorCommand: "npm run api:validate",
    reportPath: "reports/api/api-validation-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["policy bypass", "missing idempotency", "unhandled command"]
  },
  {
    moduleCode: "N03",
    name: "PostgreSQL Truth Vault",
    purpose: "Stores candidates, applications, documents, route evidence, finance, communications, and audit truth.",
    appSurface: ["database migrations", "RLS", "read models"],
    truthSurface: ["PostgreSQL", "Supabase/Oracle compatible SQL"],
    agentOwner: "POSTGRES_TRUTH_VAULT",
    toolBoundary: "PostgreSQL is truth; Airtable is mirror only.",
    validatorCommand: "npm run api:validate:truth-vault",
    reportPath: "reports/api/truth-vault-persistence-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["RLS failure", "database not reachable", "missing migrations"]
  },
  {
    moduleCode: "N04",
    name: "Candidate Portal and Support Centre",
    purpose: "Candidate intake, auth boundary, dashboard, profile review, payment status, support, and evidence visibility.",
    appSurface: ["/candidate/payment-status", "candidate dashboard", "support centre"],
    truthSurface: ["candidate read model", "payment read model", "support evidence"],
    agentOwner: "BACKEND_KERNEL",
    toolBoundary: "Web reads backend only; it cannot mutate truth directly.",
    validatorCommand: "npm run payments:validate:candidate-status",
    reportPath: "reports/finance/candidate-payment-status-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["web writes local truth", "candidate sees another candidate", "payment status cached unsafely"]
  },
  {
    moduleCode: "N05",
    name: "Document Vault",
    purpose: "Stores document uploads, review state, evidence, and POPIA-safe document workflows.",
    appSurface: ["document upload", "document review", "document-vault staging proof"],
    truthSurface: ["document metadata", "storage evidence", "review events"],
    agentOwner: "POSTGRES_TRUTH_VAULT",
    toolBoundary: "Storage provider proof required; raw private documents are not committed to Git.",
    validatorCommand: "npm run document-vault:staging",
    reportPath: "reports/staging/document-vault-storage-staging-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["storage proof missing", "document evidence unsafe", "POPIA boundary missing"]
  },
  {
    moduleCode: "N06",
    name: "Route Universe and Application Workbench",
    purpose: "Routes candidates across CAO, NSFAS, universities, TVET, SETA/QCTO, bursaries, employers, WIL, and fallback paths.",
    appSurface: ["application workbench", "route readiness", "source confidence"],
    truthSurface: ["route sources", "application child items", "manual application package evidence"],
    agentOwner: "JARVIS_BRAIN_ROUTER",
    toolBoundary: "Jarvis recommends; backend policy and verified source confidence decide.",
    validatorCommand: "npm run kingsmen:launch:audit",
    reportPath: "reports/launch/kingsmen-launch-readiness-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["fake institution data", "missing source confidence", "no manual fallback"]
  },
  {
    moduleCode: "N07",
    name: "Airtable Mirror and Source Authority",
    purpose: "Mirrors useful operational views without becoming system truth.",
    appSurface: ["Airtable mirror", "sync reports"],
    truthSurface: ["PostgreSQL remains truth", "Airtable mirror evidence"],
    agentOwner: "AIRTABLE_MIRROR",
    toolBoundary: "Airtable is mirror only; write-back requires backend policy.",
    validatorCommand: "npm run staging:validate:pack",
    reportPath: "reports/staging/staging-runtime-proof-pack-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["Airtable treated as truth", "sync evidence missing"]
  },
  {
    moduleCode: "N08",
    name: "Founder Control Plane",
    purpose: "Shows system health, queues, finance, applications, documents, incidents, approvals, and launch blockers.",
    appSurface: ["founder console", "operator command room", "launch dashboard"],
    truthSurface: ["health reads", "queue state", "approval records"],
    agentOwner: "FOUNDER_CONTROL",
    toolBoundary: "Founder approves production-risk actions.",
    validatorCommand: "npm run observability:validate",
    reportPath: "reports/ops/observability-incident-proof-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["no founder approval path", "alerts missing cause/why/how-to-fix"]
  },
  {
    moduleCode: "N09",
    name: "Communications Centre",
    purpose: "Email-primary notifications, urgent WhatsApp only, SMS backup, templates, and evidence ledger.",
    appSurface: ["email", "urgent WhatsApp", "SMS backup", "templates"],
    truthSurface: ["message evidence ledger", "provider staging reports"],
    agentOwner: "BACKEND_KERNEL",
    toolBoundary: "No bulk WhatsApp; provider send requires staging proof.",
    validatorCommand: "npm run communications:validate",
    reportPath: "reports/communications/communications-proof-latest.json",
    proofStatus: "PROVIDER_PROOF_REQUIRED",
    launchBlockers: ["bulk WhatsApp", "provider proof missing", "untracked message"]
  },
  {
    moduleCode: "N10",
    name: "Finance and PayFast",
    purpose: "Pricing, orders, invoices, PayFast ITN, evidence ledger, refunds, entitlements, and payment status.",
    appSurface: ["/api/payments/payfast/itn", "/payments/return", "/payments/cancel", "/candidate/payment-status"],
    truthSurface: ["finance_orders", "finance_payments", "payfast_itn_receipts", "finance_service_entitlements"],
    agentOwner: "BACKEND_KERNEL",
    toolBoundary: "PayFast is evidence provider; PostgreSQL finance truth decides status.",
    validatorCommand: "npm run payments:validate:clean-sync",
    reportPath: "reports/finance/payfast-clean-sync-carry-forward-latest.json",
    proofStatus: "PROVIDER_PROOF_REQUIRED",
    launchBlockers: ["PayFast verification missing", "sandbox ITN proof missing", "founder payment approval missing"]
  },
  {
    moduleCode: "N11",
    name: "AI Decision Engine and Destiny Map",
    purpose: "Produces guidance, readiness scoring, next actions, and explainable recommendations without guaranteeing outcomes.",
    appSurface: ["Destiny Map", "readiness review", "recommendations"],
    truthSurface: ["decision evidence", "source confidence", "manual review flags"],
    agentOwner: "JARVIS_BRAIN_ROUTER",
    toolBoundary: "AI guides; backend policy and human/founder gates decide sensitive actions.",
    validatorCommand: "npm run kingsmen:launch:audit",
    reportPath: "reports/launch/kingsmen-launch-readiness-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["guarantee wording", "unexplainable decision", "missing source evidence"]
  },
  {
    moduleCode: "N12",
    name: "Governance, Tribunal, Audit and POPIA",
    purpose: "Controls disputes, corrections, appeals, audit logs, consent, privacy, and refund review boundaries.",
    appSurface: ["tribunal intake", "audit trail", "privacy/refund terms"],
    truthSurface: ["audit ledger", "consent proof", "review records"],
    agentOwner: "FOUNDER_CONTROL",
    toolBoundary: "Refunds and sensitive decisions require human review.",
    validatorCommand: "npm run legal:validate",
    reportPath: "reports/legal/legal-privacy-proof-latest.json",
    proofStatus: "FOUNDER_REVIEW_REQUIRED",
    launchBlockers: ["legal publication missing", "privacy proof missing", "AI-only refund approval"]
  },
  {
    moduleCode: "N13",
    name: "Observability, Incidents and Backups",
    purpose: "Health checks, incident severity, dead-letter queue review, backups, restore drills, and founder alerts.",
    appSurface: ["/health", "incident reports", "backup scripts", "restore drills"],
    truthSurface: ["incident ledger", "backup evidence", "restore proof"],
    agentOwner: "OPENCLAW_OPERATOR",
    toolBoundary: "OpenClaw executes controlled checks; founder receives cause/why/how-to-fix.",
    validatorCommand: "npm run backup:validate:restore",
    reportPath: "reports/ops/backup-restore-proof-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["restore drill missing", "DLQ unreviewed", "health proof missing"]
  },
  {
    moduleCode: "N14",
    name: "Integrations Registry",
    purpose: "Keeps providers, credentials, URLs, readiness, and proof status visible without storing raw secrets.",
    appSurface: ["credential scan", "provider matrix", "activation report"],
    truthSurface: ["redacted readiness", "provider proof", "runtime health"],
    agentOwner: "JARVIS_BRAIN_ROUTER",
    toolBoundary: "Jarvis inventories and redacts; secrets stay outside Git.",
    validatorCommand: "npm run secrets:validate:wiring",
    reportPath: "reports/security/secrets-wiring-proof-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["raw secret in Git", "runtime secret proof missing", "provider placeholder"]
  },
  {
    moduleCode: "N15",
    name: "Opportunity Engine",
    purpose: "Tracks bursaries, learnerships, jobs, internships, WIL, employer links, SETA/QCTO, and opportunity eligibility.",
    appSurface: ["opportunity workbench", "employer links", "skills pipeline"],
    truthSurface: ["opportunity sources", "candidate eligibility", "application evidence"],
    agentOwner: "JARVIS_BRAIN_ROUTER",
    toolBoundary: "Only verified/credited links; no fake opportunities.",
    validatorCommand: "npm run kingsmen:launch:audit",
    reportPath: "reports/launch/kingsmen-launch-readiness-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["unverified opportunity", "source stale", "missing fallback route"]
  },
  {
    moduleCode: "N16",
    name: "Execution Orchestrator and Workers",
    purpose: "Dispatches safe work to n8n, Playwright scout, MAP fallback, Phoenix fallback, and operator queues.",
    appSurface: ["workflow queue", "worker dispatch", "manual fallback"],
    truthSurface: ["workflow result ledger", "MAP evidence", "Phoenix fallback evidence"],
    agentOwner: "OPENCLAW_OPERATOR",
    toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
    validatorCommand: "npm run staging:validate:pack",
    reportPath: "reports/staging/staging-runtime-proof-pack-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["forced portal automation", "no MAP fallback", "no workflow evidence"]
  },
  {
    moduleCode: "N17",
    name: "Founder Control and Growth Caps",
    purpose: "Controls 500 active-candidate start cap, growth sequence, revenue view, approval gates, and operating hours.",
    appSurface: ["founder dashboard", "growth cap report", "revenue report"],
    truthSurface: ["candidate cap ledger", "finance read model", "approval evidence"],
    agentOwner: "FOUNDER_CONTROL",
    toolBoundary: "Caps limit volume only, not capability.",
    validatorCommand: "npm run kingsmen:launch:audit",
    reportPath: "reports/launch/kingsmen-launch-readiness-latest.json",
    proofStatus: "FOUNDER_REVIEW_REQUIRED",
    launchBlockers: ["cap misconfigured", "pricing drift", "no founder approval"]
  },
  {
    moduleCode: "N18",
    name: "Public Website and Sales Funnel",
    purpose: "Explains services, pricing, no-guarantee boundaries, legal pages, and payment entry without unsafe claims.",
    appSurface: ["public site", "pricing", "terms", "privacy", "refund policy"],
    truthSurface: ["published legal proof", "pricing catalog", "launch report"],
    agentOwner: "BACKEND_KERNEL",
    toolBoundary: "No guarantee claims; public launch blocked until legal and runtime proof.",
    validatorCommand: "npm run legal:validate",
    reportPath: "reports/legal/legal-privacy-proof-latest.json",
    proofStatus: "FOUNDER_REVIEW_REQUIRED",
    launchBlockers: ["legal page missing", "refund terms missing", "guarantee wording"]
  },
  {
    moduleCode: "N19",
    name: "Mobile PWA and Accessibility",
    purpose: "Provides mobile-first candidate access, offline-friendly evidence, and accessible portal flows.",
    appSurface: ["PWA", "mobile portal", "offline status"],
    truthSurface: ["read-only cached views", "sync evidence", "accessibility reports"],
    agentOwner: "BACKEND_KERNEL",
    toolBoundary: "Mobile cache cannot become truth.",
    validatorCommand: "npm run web:validate:backend-boundary",
    reportPath: "reports/web/safe-web-backend-boundary-latest.json",
    proofStatus: "VALIDATOR_REQUIRED",
    launchBlockers: ["offline writes to truth", "accessibility proof missing"]
  },
  {
    moduleCode: "N20",
    name: "Final Assembly and Launch Gate",
    purpose: "Aggregates all source, staging, provider, legal, security, payment, and founder proof before public launch.",
    appSurface: ["launch gate", "final evidence pack", "handover"],
    truthSurface: ["reports/launch", "reports/staging", "reports/finance", "reports/security"],
    agentOwner: "FOUNDER_CONTROL",
    toolBoundary: "Final launch gate blocks public launch until evidence is real.",
    validatorCommand: "npm run kingsmen:launch:gate",
    reportPath: "reports/launch/kingsmen-launch-readiness-latest.json",
    proofStatus: "STAGING_PROOF_REQUIRED",
    launchBlockers: ["any required proof missing", "branch not mergeable", "provider not verified"]
  }
];

export const KINGSMEN_JARVIS_COMMAND_POLICY: KingsmenJarvisCommandPolicy[] = [
  { command: "READ_SYSTEM_STATUS", allowed: true, requiresFounderApproval: false, evidenceRequired: true },
  { command: "RUN_VALIDATOR", allowed: true, requiresFounderApproval: false, evidenceRequired: true },
  { command: "PLAN_REPO_PATCH", allowed: true, requiresFounderApproval: false, evidenceRequired: true },
  { command: "CREATE_SAFE_WORK_BATCH", allowed: true, requiresFounderApproval: false, evidenceRequired: true },
  { command: "GENERATE_MANUAL_APPLICATION_PACKAGE", allowed: true, requiresFounderApproval: false, evidenceRequired: true },
  { command: "ESCALATE_FOUNDER_APPROVAL", allowed: true, requiresFounderApproval: true, evidenceRequired: true },
  { command: "ACTIVATE_LIVE_PAYMENTS", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Requires PayFast verification, sandbox ITN proof, runtime secrets, and founder approval." },
  { command: "APPROVE_REFUND_AUTOMATICALLY", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Refunds require human review and evidence." },
  { command: "BULK_WHATSAPP_MARKETING", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "WhatsApp is urgent-only, not bulk marketing." },
  { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
  { command: "STORE_RAW_SECRET", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Jarvis is not a secret store; raw secrets stay outside Git." }
];

export function buildKingsmenOperatingSystemSpine(): KingsmenOperatingSystemSpine {
  return {
    id: "kingsmen.connected-operating-system-spine.v1",
    productionReady: false,
    publicLaunchAllowed: false,
    noUselessLayers: true,
    backendIsAuthority: true,
    postgresIsTruth: true,
    jarvisRole: "brain_router_not_secret_store_not_final_authority",
    openclawRole: "operator_worker_requires_policy_and_evidence",
    modules: KINGSMEN_OPERATING_MODULES,
    jarvisCommandPolicy: KINGSMEN_JARVIS_COMMAND_POLICY,
    finalLaunchGate: {
      command: "npm run kingsmen:launch:gate",
      blocksPublicLaunchUntilAllRuntimeProofsPass: true
    }
  };
}

export function getKingsmenModuleByCode(moduleCode: string): KingsmenOperatingModule | undefined {
  return KINGSMEN_OPERATING_MODULES.find((module) => module.moduleCode === moduleCode);
}

export function listKingsmenLaunchBlockers(): string[] {
  return KINGSMEN_OPERATING_MODULES.flatMap((module) => module.launchBlockers.map((blocker) => `${module.moduleCode}: ${blocker}`));
}

export function isJarvisCommandAllowed(command: string): KingsmenJarvisCommandPolicy {
  return KINGSMEN_JARVIS_COMMAND_POLICY.find((entry) => entry.command === command) ?? {
    command,
    allowed: false,
    requiresFounderApproval: true,
    evidenceRequired: true,
    deniedReason: "Unknown Jarvis command; route through policy and founder review first."
  };
}
