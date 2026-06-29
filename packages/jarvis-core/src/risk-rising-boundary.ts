export type JarvisRiskRisingAction =
  | 'assess_rising_risk'
  | 'identify_risk_cause'
  | 'estimate_operational_cost'
  | 'recommend_intervention'
  | 'assign_owner'
  | 'set_next_command'
  | 'review_escalation_threshold'
  | 'separate_rising_risk_from_critical_incident';

export type JarvisRiskRisingPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisRiskLevel = 'watch' | 'rising' | 'high' | 'critical_unproven' | 'blocked';

export interface JarvisRiskRisingRequest {
  readonly commandRef: string;
  readonly action: JarvisRiskRisingAction;
  readonly matter: string;
  readonly currentCondition: string;
  readonly riskEvidence: readonly string[];
  readonly riskCauseIdentified: boolean;
  readonly operationalCostEstimated: boolean;
  readonly ownerAssigned: boolean;
  readonly interventionRecommended: boolean;
  readonly criticalIncidentClaimed: boolean;
  readonly criticalIncidentProofPresent: boolean;
  readonly runtimeRiskMonitoringClaimed: boolean;
  readonly affectsSensitiveState: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisRiskRisingDecision {
  readonly intent: 'RISK_RISING_EARLY_INTERVENTION_CONTROL';
  readonly riskRole: 'early_intervention_signal_not_critical_incident_by_default';
  readonly action: JarvisRiskRisingAction;
  readonly matter: string;
  readonly currentCondition: string;
  readonly riskLevel: JarvisRiskLevel;
  readonly policyStatus: JarvisRiskRisingPolicyStatus;
  readonly interventionRequired: boolean;
  readonly approvalRequired: boolean;
  readonly escalationAllowed: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredRiskSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'risk_rising_boundary_built_not_live_risk_monitoring_proven';
}

const requiredRiskSteps = [
  'matter_identified',
  'current_condition_stated',
  'risk_evidence_listed',
  'risk_cause_identified',
  'operational_cost_estimated',
  'recommended_intervention_set',
  'owner_assigned_or_unassigned',
  'next_command_set'
] as const;

const forbiddenClaims = [
  'rising_risk_must_not_be_hidden_as_stable',
  'rising_risk_must_not_be_called_critical_without_proof',
  'intervention_must_not_be_recommended_without_cause',
  'operational_cost_must_not_be_ignored',
  'runtime_risk_monitoring_must_not_be_claimed_without_runtime_evidence',
  'repo_files_must_not_be_treated_as_live_risk_monitoring_proof'
] as const;

export function jarvisAssessRiskRisingRequest(
  request: JarvisRiskRisingRequest
): JarvisRiskRisingDecision {
  const hasRiskEvidence = request.riskEvidence.length > 0;
  const criticalClaimWithoutProof = request.criticalIncidentClaimed && !request.criticalIncidentProofPresent;
  const runtimeProofBoundaryBreached = request.runtimeRiskMonitoringClaimed;
  const missingInterventionBasis =
    !hasRiskEvidence ||
    !request.riskCauseIdentified ||
    !request.operationalCostEstimated ||
    !request.interventionRecommended;

  const policyStatus: JarvisRiskRisingPolicyStatus = criticalClaimWithoutProof || runtimeProofBoundaryBreached || missingInterventionBasis
    ? 'blocked'
    : request.affectsSensitiveState || !request.ownerAssigned
      ? 'needs_approval'
      : 'allowed';

  const riskLevel: JarvisRiskLevel = policyStatus === 'blocked'
    ? 'blocked'
    : request.criticalIncidentClaimed && request.criticalIncidentProofPresent
      ? 'high'
      : request.affectsSensitiveState
        ? 'high'
        : 'rising';

  return {
    intent: 'RISK_RISING_EARLY_INTERVENTION_CONTROL',
    riskRole: 'early_intervention_signal_not_critical_incident_by_default',
    action: request.action,
    matter: request.matter,
    currentCondition: request.currentCondition,
    riskLevel,
    policyStatus,
    interventionRequired: policyStatus !== 'blocked',
    approvalRequired: policyStatus === 'needs_approval',
    escalationAllowed: request.criticalIncidentClaimed && request.criticalIncidentProofPresent,
    forbiddenClaims,
    requiredRiskSteps,
    requiredProof: [
      'matter_under_risk',
      'current_condition',
      'evidence_showing_risk_is_rising',
      'risk_cause',
      'operational_cost_if_delayed',
      'recommended_intervention',
      'owner_or_unassigned_marker',
      'next_command',
      'runtime_evidence_for_runtime_risk_monitoring_claims'
    ],
    runtimeProof: null,
    completionStatus: 'risk_rising_boundary_built_not_live_risk_monitoring_proven'
  };
}

export const JARVIS_RISK_RISING_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveRiskMonitoring: 'not_proven_without_observability_or_runtime_confirmation',
  escalation: 'critical_incident_requires_distinct_proof',
  intervention: 'recommended_before_operational_cost_increases',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
