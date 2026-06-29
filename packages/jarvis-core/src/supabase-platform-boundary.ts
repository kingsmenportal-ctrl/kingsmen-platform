export type JarvisSupabaseServiceArea =
  | 'postgresql'
  | 'auth'
  | 'storage'
  | 'edge_functions'
  | 'realtime'
  | 'cron'
  | 'queues'
  | 'data_api'
  | 'project_runtime_probe';

export type JarvisSupabasePolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export type JarvisSupabaseRisk = 'low' | 'watch' | 'high' | 'blocked';

export interface JarvisSupabasePlatformRequest {
  readonly commandRef: string;
  readonly serviceArea: JarvisSupabaseServiceArea;
  readonly target: string;
  readonly containsPrivateData: boolean;
  readonly exposesApiSurface: boolean;
  readonly changesAuthOrAccess: boolean;
  readonly touchesStorageDocuments: boolean;
  readonly touchesProductionProject: boolean;
  readonly hasAccessPolicy: boolean;
  readonly hasAuditPlan: boolean;
  readonly hasEvidencePlan: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisSupabasePlatformDecision {
  readonly intent: 'SUPABASE_PLATFORM_SUPPORT_REQUEST';
  readonly platformRole: 'supports_postgresql_auth_storage_edge_services_under_kingsmen_doctrine';
  readonly doctrine: {
    readonly postgresqlTruthVaultStillControls: true;
    readonly backendPolicyGateRequired: true;
    readonly auditLoggingRequired: true;
    readonly evidenceRequiredForSensitiveActions: true;
    readonly liveRuntimeProofRequired: true;
  };
  readonly serviceArea: JarvisSupabaseServiceArea;
  readonly target: string;
  readonly policyStatus: JarvisSupabasePolicyStatus;
  readonly risk: JarvisSupabaseRisk;
  readonly accessPolicyRequired: boolean;
  readonly auditRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly commanderApprovalRequired: boolean;
  readonly forbiddenActions: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'supabase_boundary_built_not_live_project_proven';
}

const forbiddenActions = [
  'supabase_must_not_replace_postgresql_truth_doctrine',
  'private_tables_must_not_be_exposed_without_access_policy',
  'storage_must_not_expose_private_documents_by_default',
  'auth_changes_must_not_bypass_policy_gate',
  'generated_api_access_is_not_automatically_safe',
  'live_project_status_must_not_be_claimed_from_repo_files'
] as const;

export function jarvisAssessSupabasePlatform(
  request: JarvisSupabasePlatformRequest
): JarvisSupabasePlatformDecision {
  const sensitive =
    request.containsPrivateData ||
    request.changesAuthOrAccess ||
    request.touchesStorageDocuments ||
    request.touchesProductionProject;

  const accessPolicyRequired = request.containsPrivateData || request.exposesApiSurface || request.changesAuthOrAccess;
  const auditRequired = sensitive || request.serviceArea === 'auth' || request.serviceArea === 'data_api';
  const evidenceRequired = sensitive || request.touchesProductionProject;
  const missingControl =
    (accessPolicyRequired && !request.hasAccessPolicy) ||
    (auditRequired && !request.hasAuditPlan) ||
    (evidenceRequired && !request.hasEvidencePlan);

  const policyStatus: JarvisSupabasePolicyStatus = missingControl
    ? 'blocked'
    : sensitive || request.touchesProductionProject
      ? 'needs_approval'
      : 'allowed';

  const risk: JarvisSupabaseRisk = policyStatus === 'blocked'
    ? 'blocked'
    : request.touchesProductionProject || request.changesAuthOrAccess
      ? 'high'
      : sensitive || request.exposesApiSurface
        ? 'watch'
        : 'low';

  return {
    intent: 'SUPABASE_PLATFORM_SUPPORT_REQUEST',
    platformRole: 'supports_postgresql_auth_storage_edge_services_under_kingsmen_doctrine',
    doctrine: {
      postgresqlTruthVaultStillControls: true,
      backendPolicyGateRequired: true,
      auditLoggingRequired: true,
      evidenceRequiredForSensitiveActions: true,
      liveRuntimeProofRequired: true
    },
    serviceArea: request.serviceArea,
    target: request.target,
    policyStatus,
    risk,
    accessPolicyRequired,
    auditRequired,
    evidenceRequired,
    commanderApprovalRequired: policyStatus === 'needs_approval',
    forbiddenActions,
    requiredProof: [
      'current_supabase_docs_or_project_state_when_live_behaviour_is_required',
      'postgresql_truth_vault_boundary_preserved',
      'access_policy_for_private_or_exposed_data',
      'audit_plan_for_auth_data_api_or_sensitive_actions',
      'evidence_plan_for_production_or_private_data_actions',
      'runtime_project_probe_before_claiming_live_status'
    ],
    runtimeProof: null,
    completionStatus: 'supabase_boundary_built_not_live_project_proven'
  };
}

export const JARVIS_SUPABASE_PLATFORM_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  projectConnection: 'not_proven_without_live_project_probe',
  database: 'postgresql_truth_vault_doctrine_still_controls',
  auth: 'requires_policy_and_audit_for_sensitive_changes',
  storage: 'requires_private_document_boundary',
  edgeRealtimeCronQueues: 'support_services_not_authority',
  validator: 'required_for_repo_proof',
  productionCompletion: 'not_claimed_without_runtime_execution'
} as const;
