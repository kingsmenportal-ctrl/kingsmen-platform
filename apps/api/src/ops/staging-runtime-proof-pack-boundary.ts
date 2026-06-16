export const STAGING_RUNTIME_PROOF_PACK_SOURCE_ONLY = true;

export type StagingRuntimeProofRequirement = {
  readonly key: string;
  readonly title: string;
  readonly requiredBefore: "staging_deploy" | "private_beta" | "paid_pilot" | "public_launch";
  readonly sourceProofBuilt: boolean;
  readonly runtimeEvidenceRequired: boolean;
  readonly runtimeEvidenceComplete: boolean;
  readonly rawSecretsAllowedInEvidence: boolean;
  readonly rawCandidateDataAllowedInEvidence: boolean;
  readonly evidenceReportPath: string;
};

export type StagingRuntimeProofPack = {
  readonly packKey: "STAGING_RUNTIME_PROOF_PACK_SOURCE_ONLY";
  readonly productionReady: false;
  readonly publicLaunchAllowed: false;
  readonly stagingRuntimeEvidencePending: true;
  readonly requirements: readonly StagingRuntimeProofRequirement[];
};

export const stagingRuntimeProofRequirements: readonly StagingRuntimeProofRequirement[] = [
  {
    key: "truth_vault_persistence_staging",
    title: "API writes command, workflow, evidence, audit, idempotency, heartbeat, and DLQ records to staging PostgreSQL/Supabase",
    requiredBefore: "staging_deploy",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/truth-vault-persistence-staging-latest.json"
  },
  {
    key: "web_backend_boundary_staging",
    title: "Web uses backend API only with KINGSMEN_BACKEND_BASE_URL configured",
    requiredBefore: "staging_deploy",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/web-backend-boundary-staging-latest.json"
  },
  {
    key: "rls_sql_isolation_staging",
    title: "RLS denies anonymous and cross-candidate reads while allowing scoped founder/operator/backend access",
    requiredBefore: "public_launch",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/rls-sql-isolation-staging-latest.json"
  },
  {
    key: "payfast_provider_sandbox_staging",
    title: "PayFast sandbox checkout, ITN, cancel, failure, duplicate, signature, replay, amount, refund-review evidence",
    requiredBefore: "paid_pilot",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/payfast-provider-sandbox-staging-latest.json"
  },
  {
    key: "backup_restore_drill_staging",
    title: "Staging backup and restore drill proves checksum, RPO/RTO, target/source separation, and counts-only verification",
    requiredBefore: "private_beta",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/backup-restore-drill-staging-latest.json"
  },
  {
    key: "secrets_runtime_health_staging",
    title: "Masked runtime secret health proves env vars are configured outside Git without printing values",
    requiredBefore: "staging_deploy",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/security/secrets-wiring-runtime-health-latest.json"
  },
  {
    key: "communications_provider_staging",
    title: "Email send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback-only, redacted evidence",
    requiredBefore: "private_beta",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/communications-provider-staging-latest.json"
  },
  {
    key: "observability_incident_staging",
    title: "Health checks, structured logs, queue/DLQ, alerts, redaction, SEV drill, founder escalation",
    requiredBefore: "public_launch",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/observability-incident-staging-latest.json"
  },
  {
    key: "legal_privacy_publication_staging",
    title: "Published/versioned policies, founder/legal review, consent capture, refund display, DSR path proof",
    requiredBefore: "private_beta",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/staging/legal-privacy-publication-staging-latest.json"
  },
  {
    key: "branch_protection_applied",
    title: "GitHub main protection applied with source-guard required and force-push/deletion disabled",
    requiredBefore: "staging_deploy",
    sourceProofBuilt: true,
    runtimeEvidenceRequired: true,
    runtimeEvidenceComplete: false,
    rawSecretsAllowedInEvidence: false,
    rawCandidateDataAllowedInEvidence: false,
    evidenceReportPath: "reports/repo/main-branch-protection-apply-latest.json"
  }
] as const;

export const stagingRuntimeProofPack: StagingRuntimeProofPack = {
  packKey: "STAGING_RUNTIME_PROOF_PACK_SOURCE_ONLY",
  productionReady: false,
  publicLaunchAllowed: false,
  stagingRuntimeEvidencePending: true,
  requirements: stagingRuntimeProofRequirements
};

export function summarizeStagingRuntimeProofPack(): StagingRuntimeProofPack {
  return stagingRuntimeProofPack;
}
