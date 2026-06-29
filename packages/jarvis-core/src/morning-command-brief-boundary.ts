export type JarvisMorningBriefAction =
  | 'prepare_morning_brief'
  | 'check_command_context'
  | 'check_kingsmen_position'
  | 'list_attention_matters'
  | 'recommend_first_command'
  | 'mark_unverified_fields';

export type JarvisMorningBriefPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisMorningCommandStatus = 'Green' | 'Amber' | 'Red' | 'requires_review';

export interface JarvisMorningBriefRequest {
  readonly commandRef: string;
  readonly action: JarvisMorningBriefAction;
  readonly dateTimeKnown: boolean;
  readonly locationKnown: boolean;
  readonly weatherVerified: boolean;
  readonly calendarVerified: boolean;
  readonly systemHealthVerified: boolean;
  readonly kingsmenPositionChecked: boolean;
  readonly attentionMattersListed: boolean;
  readonly firstCommandRecommended: boolean;
  readonly includesPrivateDetails: boolean;
  readonly claimsRuntimeBriefGenerated: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisMorningBriefDecision {
  readonly intent: 'MORNING_COMMAND_BRIEF_CONTROL';
  readonly briefRole: 'daily_command_opening_position_report_not_live_proof';
  readonly action: JarvisMorningBriefAction;
  readonly commandStatus: JarvisMorningCommandStatus;
  readonly policyStatus: JarvisMorningBriefPolicyStatus;
  readonly reviewRequired: boolean;
  readonly privateDataMinimizationRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredBriefSections: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'morning_brief_boundary_built_not_live_brief_proven';
}

const requiredBriefSections = [
  'greeting_and_jarvis_online',
  'date_time_location_weather_calendar',
  'command_status',
  'kingsmen_position',
  'matters_requiring_attention',
  'recommended_first_command',
  'proof_state'
] as const;

const forbiddenClaims = [
  'morning_brief_must_not_invent_current_fields',
  'weather_must_not_be_claimed_without_verification',
  'calendar_must_not_be_claimed_without_verification',
  'system_health_must_not_be_claimed_without_evidence',
  'private_details_must_not_be_exposed_unnecessarily',
  'repo_files_must_not_be_treated_as_live_morning_brief_proof'
] as const;

export function jarvisAssessMorningBriefRequest(
  request: JarvisMorningBriefRequest
): JarvisMorningBriefDecision {
  const liveFieldsUnverified = !request.dateTimeKnown || !request.locationKnown || !request.weatherVerified || !request.calendarVerified;
  const positionUnverified = !request.systemHealthVerified || !request.kingsmenPositionChecked;
  const missingBriefBody = !request.attentionMattersListed || !request.firstCommandRecommended;
  const runtimeBoundaryBreached = request.claimsRuntimeBriefGenerated;

  const policyStatus: JarvisMorningBriefPolicyStatus = missingBriefBody || runtimeBoundaryBreached
    ? 'blocked'
    : liveFieldsUnverified || positionUnverified || request.includesPrivateDetails
      ? 'needs_approval'
      : 'allowed';

  const commandStatus: JarvisMorningCommandStatus = policyStatus === 'blocked'
    ? 'Red'
    : liveFieldsUnverified || positionUnverified || request.includesPrivateDetails
      ? 'Amber'
      : 'Green';

  return {
    intent: 'MORNING_COMMAND_BRIEF_CONTROL',
    briefRole: 'daily_command_opening_position_report_not_live_proof',
    action: request.action,
    commandStatus,
    policyStatus,
    reviewRequired: policyStatus !== 'allowed',
    privateDataMinimizationRequired: request.includesPrivateDetails,
    forbiddenClaims,
    requiredBriefSections,
    requiredProof: [
      'date_time_location_source_or_requires_review_marker',
      'weather_source_or_requires_review_marker',
      'calendar_source_or_requires_review_marker',
      'system_health_evidence_or_requires_review_marker',
      'kingsmen_position_statuses',
      'matters_requiring_attention',
      'recommended_first_command',
      'runtime_evidence_for_live_brief_claims'
    ],
    runtimeProof: null,
    completionStatus: 'morning_brief_boundary_built_not_live_brief_proven'
  };
}

export const JARVIS_MORNING_BRIEF_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveMorningBrief: 'not_proven_without_current_sources_and_runtime_confirmation',
  currentFields: 'must_be_verified_or_marked_requires_review',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
