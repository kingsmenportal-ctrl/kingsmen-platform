export type JarvisCriticalIncidentAction =
  | 'classify_critical_incident'
  | 'confirm_impact'
  | 'identify_affected_area'
  | 'state_risk_exposure'
  | 'set_containment_action'
  | 'assign_incident_owner'
  | 'pause_execution_for_containment'
  | 'capture_incident_evidence';

export type JarvisCriticalIncidentPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisIncidentSeverity = 'critical' | 'critical_unproven' | 'blocked';

export interface JarvisCriticalIncidentRequest {
  readonly commandRef: string;
  readonly action: JarvisCriticalIncidentAction;
  readonly affectedArea: string;
  readonly confirmedImpact: string;
  readonly riskExposure: string;
  readonly containmentAction: string;
  readonly recommendedCommand: string;
  readonly incidentEvidence: readonly string[];
  readonly unconfirmedMatters: readonly string[];
  readonly ownerAssigned: boolean;
  readonly executionPauseRequired: boolean;
  readonly containmentReady: boolean;
  readonly runtimeIncidentResponseClaimed: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisCriticalIncidentDecision {
  readonly intent: 'CRITICAL_INCIDENT_CONTAINMENT_CONTROL';
  readonly incidentRole: 'confirmed_high_severity_command_event_requiring_containment';
  readonly action: JarvisCriticalIncidentAction;
  readonly affectedArea: string;
  readonly severity: JarvisIncidentSeverity;
  readonly policyStatus: JarvisCriticalIncidentPolicyStatus;
  readonly executionPauseRequired: boolean;
  readonly containmentRequired: boolean;
  readonly approvalRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredIncidentSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'critical_incident_boundary_built_not_live_incident_response_proven';
}

const requiredIncidentSteps = [
  'incident_level_confirmed',
  'affected_area_named',
  'confirmed_impact_stated',
  'unconfirmed_matters_separated',
  'risk_exposure_stated',
  'containment_required_named',
  'recommended_command_set',
  'owner_assigned_or_unassigned'
] as const;

const forbiddenClaims = [
  'critical_incident_must_not_be_claimed_without_evidence',
  'confirmed_impact_must_not_mix_with_unconfirmed_matters',
  'execution_must_not_continue_when_containment_is_required',
  'containment_success_must_not_be_claimed_without_output',
  'runtime_incident_response_must_not_be_claimed_without_runtime_evidence',
  'repo_files_must_not_be_treated_as_live_incident_response_proof'
] as const;

export function jarvisAssessCriticalIncidentRequest(
  request: JarvisCriticalIncidentRequest
): JarvisCriticalIncidentDecision {
  const evidencePresent = request.incidentEvidence.length > 0;
  const requiredFieldsPresent =
    request.affectedArea.length > 0 &&
    request.confirmedImpact.length > 0 &&
    request.riskExposure.length > 0 &&
    request.containmentAction.length > 0 &&
    request.recommendedCommand.length > 0;

  const runtimeProofBoundaryBreached = request.runtimeIncidentResponseClaimed;
  const missingContainment = request.executionPauseRequired && !request.containmentReady;

  const policyStatus: JarvisCriticalIncidentPolicyStatus = !evidencePresent || !requiredFieldsPresent || runtimeProofBoundaryBreached
    ? 'blocked'
    : missingContainment || !request.ownerAssigned || request.unconfirmedMatters.length > 0
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'CRITICAL_INCIDENT_CONTAINMENT_CONTROL',
    incidentRole: 'confirmed_high_severity_command_event_requiring_containment',
    action: request.action,
    affectedArea: request.affectedArea,
    severity: policyStatus === 'blocked' ? 'blocked' : 'critical',
    policyStatus,
    executionPauseRequired: request.executionPauseRequired,
    containmentRequired: true,
    approvalRequired: policyStatus === 'needs_approval',
    forbiddenClaims,
    requiredIncidentSteps,
    requiredProof: [
      'incident_evidence',
      'incident_level_critical',
      'affected_area',
      'confirmed_impact',
      'unconfirmed_matters_if_any',
      'risk_exposure',
      'containment_required',
      'recommended_command',
      'owner_or_unassigned_marker',
      'runtime_evidence_for_incident_response_claims'
    ],
    runtimeProof: null,
    completionStatus: 'critical_incident_boundary_built_not_live_incident_response_proven'
  };
}

export const JARVIS_CRITICAL_INCIDENT_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveIncidentDetection: 'not_proven_without_observability_or_runtime_confirmation',
  containmentExecution: 'not_proven_without_runtime_output',
  evidence: 'required_before_critical_classification',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
