export type JarvisPostgreSQLAccessType =
  | 'read_model'
  | 'raw_read'
  | 'mutation'
  | 'migration'
  | 'policy_review'
  | 'runtime_probe';

export type JarvisPostgreSQLPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export type JarvisPostgreSQLRisk = 'low' | 'watch' | 'high' | 'blocked';

export interface JarvisPostgreSQLTruthVaultRequest {
  readonly commandRef: string;
  readonly domain: string;
  readonly accessType: JarvisPostgreSQLAccessType;
  readonly containsPrivateData: boolean;
  readonly touchesPaymentTruth: boolean;
  readonly touchesOfficialStatus: boolean;
  readonly touchesCandidateOutcome: boolean;
  readonly hasEvidenceRef: boolean;
  readonly hasAuditRef: boolean;
  readonly hasRlsBoundary: boolean;
  readonly requestedByCommander: boolean;
  readonly target: string;
}

export interface JarvisPostgreSQLTruthVaultDecision {
  readonly intent: 'POSTGRESQL_TRUTH_VAULT_OR_DATABASE_REQUEST';
  readonly truthVaultRole: 'authority_layer_through_governed_schema_policy_audit_evidence';
  readonly doctrine: {
    readonly postgresqlIsTruthVault: true;
    readonly airtableIsMirrorOnly: true;
    readonly n8nIsThinWorkerOnly: true;
    readonly playwrightIsScoutOnly: true;
    readonly openclawIsGatewayOnly: true;
  };
  readonly domain: string;
  readonly target: string;
  readonly accessType: JarvisPostgreSQLAccessType;
  readonly rlsRequired: boolean;
  readonly auditRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly privateDataRisk: 'none' | 'limited' | 'high' | 'blocked';
  readonly policyStatus: JarvisPostgreSQLPolicyStatus;
  readonly risk: JarvisPostgreSQLRisk;
  readonly forbiddenActions: readonly string[];
  readonly requiredProof: readonly string[];
  readonly safeReadModelRequired: boolean;
  readonly runtimeProof: null;
  readonly completionStatus: 'truth_boundary_built_not_runtime_proven';
}

const forbiddenAuthorityActions = [
  'airtable_must_not_override_postgresql_truth',
  'n8n_must_not_silently_mutate_truth',
  'playwright_must_not_mark_official_status',
  'openclaw_must_not_write_truth_without_policy_gate',
  'raw_private_rows_must_not_be_exposed_unnecessarily',
  'payment_truth_requires_verified_provider_or_finance_evidence',
  'official_status_requires_verified_source_evidence'
] as const;

export function jarvisAssessPostgreSQLTruthVault(
  request: JarvisPostgreSQLTruthVaultRequest
): JarvisPostgreSQLTruthVaultDecision {
  const isSensitive =
    request.containsPrivateData ||
    request.touchesPaymentTruth ||
    request.touchesOfficialStatus ||
    request.touchesCandidateOutcome;

  const rlsRequired = request.containsPrivateData || isSensitive;
  const auditRequired = request.accessType !== 'read_model' || isSensitive;
  const evidenceRequired =
    request.accessType === 'mutation' ||
    request.touchesPaymentTruth ||
    request.touchesOfficialStatus ||
    request.touchesCandidateOutcome;

  const missingSensitiveProof =
    (rlsRequired && !request.hasRlsBoundary) ||
    (auditRequired && !request.hasAuditRef) ||
    (evidenceRequired && !request.hasEvidenceRef);

  const policyStatus: JarvisPostgreSQLPolicyStatus = missingSensitiveProof
    ? 'blocked'
    : request.accessType === 'mutation' || request.accessType === 'raw_read'
      ? 'needs_approval'
      : 'allowed';

  const risk: JarvisPostgreSQLRisk = policyStatus === 'blocked'
    ? 'blocked'
    : isSensitive
      ? 'high'
      : request.accessType === 'migration' || request.accessType === 'policy_review'
        ? 'watch'
        : 'low';

  return {
    intent: 'POSTGRESQL_TRUTH_VAULT_OR_DATABASE_REQUEST',
    truthVaultRole: 'authority_layer_through_governed_schema_policy_audit_evidence',
    doctrine: {
      postgresqlIsTruthVault: true,
      airtableIsMirrorOnly: true,
      n8nIsThinWorkerOnly: true,
      playwrightIsScoutOnly: true,
      openclawIsGatewayOnly: true
    },
    domain: request.domain,
    target: request.target,
    accessType: request.accessType,
    rlsRequired,
    auditRequired,
    evidenceRequired,
    privateDataRisk: request.containsPrivateData ? 'high' : isSensitive ? 'limited' : 'none',
    policyStatus,
    risk,
    forbiddenActions: forbiddenAuthorityActions,
    requiredProof: [
      'governed_schema_or_migration',
      'policy_gate_decision',
      'row_level_security_when_private_data_exists',
      'audit_event_for_sensitive_mutation',
      'evidence_reference_before_final_truth_state',
      'read_model_for_dashboard_summary',
      'backup_and_rollback_path_for_migration',
      'runtime_connection_and_query_proof_before_claiming_live_database_status'
    ],
    safeReadModelRequired: request.accessType === 'raw_read' || request.containsPrivateData,
    runtimeProof: null,
    completionStatus: 'truth_boundary_built_not_runtime_proven'
  };
}

export const JARVIS_POSTGRESQL_TRUTH_VAULT_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  databaseConnection: 'not_proven_without_live_database_url_and_runtime_probe',
  schemasMigrations: 'migration_file_required_and_validator_checked',
  rlsAuditEvidenceLedger: 'required_by_boundary_and_migration',
  readModels: 'required_for_dashboard_safe_summary',
  hudPanel: 'required_separate_ui_component',
  voiceResponse: 'required_safe_response_contract',
  validator: 'required_for_repo_proof',
  productionCompletion: 'not_claimed_without_runtime_execution'
} as const;
