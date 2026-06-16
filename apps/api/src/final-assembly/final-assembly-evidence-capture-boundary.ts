export const FINAL_ASSEMBLY_EVIDENCE_CAPTURE_BOUNDARY_SOURCE_ONLY = 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_BOUNDARY_SOURCE_ONLY';

export type FinalAssemblyEvidenceReportKey =
  | 'truth_vault_persistence_staging'
  | 'web_backend_boundary_staging'
  | 'rls_sql_isolation_staging'
  | 'payfast_provider_sandbox_staging'
  | 'backup_restore_drill_staging'
  | 'secrets_runtime_health_staging'
  | 'communications_provider_staging'
  | 'observability_incident_staging'
  | 'legal_privacy_publication_staging'
  | 'main_branch_protection_apply';

export type FinalAssemblyEvidenceReportState = {
  key: FinalAssemblyEvidenceReportKey;
  path: string;
  exists: boolean;
  passed: boolean;
  reviewed: boolean;
  redacted: boolean;
  sha256?: string;
  generatedAt?: string;
};

export const requiredFinalAssemblyEvidenceReports: ReadonlyArray<{ key: FinalAssemblyEvidenceReportKey; path: string }> = [
  { key: 'truth_vault_persistence_staging', path: 'reports/staging/truth-vault-persistence-staging-latest.json' },
  { key: 'web_backend_boundary_staging', path: 'reports/staging/web-backend-boundary-staging-latest.json' },
  { key: 'rls_sql_isolation_staging', path: 'reports/staging/rls-sql-isolation-staging-latest.json' },
  { key: 'payfast_provider_sandbox_staging', path: 'reports/staging/payfast-provider-sandbox-staging-latest.json' },
  { key: 'backup_restore_drill_staging', path: 'reports/staging/backup-restore-drill-staging-latest.json' },
  { key: 'secrets_runtime_health_staging', path: 'reports/security/secrets-wiring-runtime-health-latest.json' },
  { key: 'communications_provider_staging', path: 'reports/staging/communications-provider-staging-latest.json' },
  { key: 'observability_incident_staging', path: 'reports/staging/observability-incident-staging-latest.json' },
  { key: 'legal_privacy_publication_staging', path: 'reports/staging/legal-privacy-publication-staging-latest.json' },
  { key: 'main_branch_protection_apply', path: 'reports/repo/main-branch-protection-apply-latest.json' }
] as const;

export const finalAssemblyEvidenceCaptureBoundary = {
  boundary: FINAL_ASSEMBLY_EVIDENCE_CAPTURE_BOUNDARY_SOURCE_ONLY,
  status: 'foundation_built_pending_final_evidence_capture_review',
  productionReady: false,
  publicLaunchAllowed: false,
  finalAssemblyCanOpen: false,
  finalAssemblyEvidencePending: true,
  finalAssemblyFounderReviewRequired: true,
  rawReportBodiesMayBeCopiedIntoBundle: false,
  rawCandidateDataAllowedInBundle: false,
  providerCredentialsAllowedInBundle: false,
  reportHashRequired: true,
  reportPassStatusRequired: true,
  reportReviewStatusRequired: true,
  bundleOutputPath: 'reports/final-assembly/final-assembly-evidence-bundle-latest.json',
  validationOutputPath: 'reports/final-assembly/final-assembly-evidence-validation-latest.json',
  requiredReports: requiredFinalAssemblyEvidenceReports
} as const;

export const finalAssemblyEvidenceCaptureScenarios = [
  'all_required_staging_reports_are_declared',
  'missing_report_keeps_final_assembly_blocked',
  'failed_report_keeps_final_assembly_blocked',
  'unreviewed_report_keeps_final_assembly_blocked',
  'report_hash_recorded_without_copying_body',
  'bundle_has_no_raw_candidate_data',
  'bundle_has_no_provider_credentials',
  'founder_review_required_before_launch_gate_open',
  'final_assembly_readiness_engine_remains_pending_until_evidence_review',
  'public_launch_remains_blocked_until_final_bundle_validated'
] as const;

export function summarizeFinalAssemblyEvidence(states: FinalAssemblyEvidenceReportState[]) {
  const totalReports = requiredFinalAssemblyEvidenceReports.length;
  const presentReports = states.filter((state) => state.exists).length;
  const passedReports = states.filter((state) => state.exists && state.passed).length;
  const reviewedReports = states.filter((state) => state.exists && state.passed && state.reviewed).length;
  const redactedReports = states.filter((state) => state.exists && state.redacted).length;
  const allReportsPresent = presentReports === totalReports;
  const allReportsPassed = passedReports === totalReports;
  const allReportsReviewed = reviewedReports === totalReports;
  const allReportsRedacted = redactedReports === totalReports;

  return {
    totalReports,
    presentReports,
    passedReports,
    reviewedReports,
    redactedReports,
    allReportsPresent,
    allReportsPassed,
    allReportsReviewed,
    allReportsRedacted,
    finalAssemblyCanOpen: false,
    productionReady: false,
    publicLaunchAllowed: false,
    finalAssemblyFounderReviewRequired: true,
    finalAssemblyEvidencePending: !(allReportsPresent && allReportsPassed && allReportsReviewed && allReportsRedacted)
  };
}
