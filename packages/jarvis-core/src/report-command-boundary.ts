export type JarvisReportAction =
  | 'prepare_report'
  | 'status_report'
  | 'incident_report'
  | 'finance_report'
  | 'document_report'
  | 'calendar_report'
  | 'email_report'
  | 'validator_report'
  | 'handover_report'
  | 'public_report';

export type JarvisReportPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export type JarvisReportRiskLevel = 'low' | 'watch' | 'high' | 'blocked';

export interface JarvisReportCommandRequest {
  readonly commandRef: string;
  readonly action: JarvisReportAction;
  readonly reportScope: string;
  readonly hasSourceBasis: boolean;
  readonly hasVerifiedFacts: boolean;
  readonly hasUnresolvedMatters: boolean;
  readonly hasRiskExposure: boolean;
  readonly hasResponsibleOwner: boolean;
  readonly hasRecommendedNextCommand: boolean;
  readonly includesPrivateData: boolean;
  readonly externalFacing: boolean;
  readonly evidenceRefsAttached: boolean;
  readonly claimsExecutionComplete: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisReportCommandDecision {
  readonly intent: 'REPORT_COMMAND_INTELLIGENCE_CONTROL';
  readonly reportRole: 'structured_command_intelligence_not_execution_proof';
  readonly action: JarvisReportAction;
  readonly reportScope: string;
  readonly policyStatus: JarvisReportPolicyStatus;
  readonly riskLevel: JarvisReportRiskLevel;
  readonly approvalRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly privacyMinimizationRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredSections: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'report_boundary_built_not_report_runtime_proven';
}

const forbiddenClaims = [
  'report_text_must_not_be_treated_as_execution_proof',
  'summary_must_not_hide_unresolved_matters',
  'assumptions_must_not_be_presented_as_verified_facts',
  'private_report_contents_must_not_be_exposed_unnecessarily',
  'public_or_external_reports_require_share_safety_review',
  'repo_files_must_not_be_treated_as_live_report_generation_proof'
] as const;

const requiredSections = [
  'present_status',
  'verified_facts',
  'unresolved_matters',
  'risk_exposure',
  'responsible_owner',
  'recommended_next_command',
  'evidence_or_proof_state'
] as const;

export function jarvisAssessReportCommandRequest(
  request: JarvisReportCommandRequest
): JarvisReportCommandDecision {
  const evidenceRequired = request.claimsExecutionComplete || request.action === 'validator_report' || request.action === 'finance_report' || request.includesPrivateData;
  const privacyMinimizationRequired = request.includesPrivateData || request.externalFacing;

  const missingCommandSections =
    !request.hasSourceBasis ||
    !request.hasVerifiedFacts ||
    !request.hasUnresolvedMatters ||
    !request.hasRiskExposure ||
    !request.hasResponsibleOwner ||
    !request.hasRecommendedNextCommand;

  const missingProof =
    missingCommandSections ||
    (evidenceRequired && !request.evidenceRefsAttached) ||
    (request.claimsExecutionComplete && !request.evidenceRefsAttached);

  const policyStatus: JarvisReportPolicyStatus = missingProof
    ? 'blocked'
    : request.includesPrivateData || request.externalFacing || request.claimsExecutionComplete
      ? 'needs_approval'
      : 'allowed';

  const riskLevel: JarvisReportRiskLevel = policyStatus === 'blocked'
    ? 'blocked'
    : request.externalFacing || request.includesPrivateData || request.claimsExecutionComplete
      ? 'high'
      : request.hasUnresolvedMatters || request.hasRiskExposure
        ? 'watch'
        : 'low';

  return {
    intent: 'REPORT_COMMAND_INTELLIGENCE_CONTROL',
    reportRole: 'structured_command_intelligence_not_execution_proof',
    action: request.action,
    reportScope: request.reportScope,
    policyStatus,
    riskLevel,
    approvalRequired: policyStatus === 'needs_approval',
    evidenceRequired,
    privacyMinimizationRequired,
    forbiddenClaims,
    requiredSections,
    requiredProof: [
      'report_scope_and_report_type',
      'source_basis_or_checked_records',
      'verified_facts_separated_from_assumptions',
      'unresolved_matters_and_risk_exposure',
      'responsible_owner_or_unassigned_marker',
      'recommended_next_command',
      'evidence_references_before_execution_complete_claims'
    ],
    runtimeProof: null,
    completionStatus: 'report_boundary_built_not_report_runtime_proven'
  };
}

export const JARVIS_REPORT_COMMAND_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  reportGeneration: 'not_proven_without_source_and_runtime_confirmation',
  evidenceLedger: 'required_for_execution_completion_claims',
  privateData: 'requires_minimization_and_share_safety_review',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
