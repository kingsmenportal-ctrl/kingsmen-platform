export type JarvisMiddayBriefAction =
  | 'prepare_midday_brief'
  | 'review_progress_since_morning'
  | 'list_completed_work'
  | 'list_delayed_matters'
  | 'list_blocked_items'
  | 'identify_rising_risks'
  | 'recommend_afternoon_command'
  | 'mark_unverified_fields';

export type JarvisMiddayBriefPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisMiddayCommandStatus = 'Green' | 'Amber' | 'Red' | 'requires_review';

export interface JarvisMiddayBriefRequest {
  readonly commandRef: string;
  readonly action: JarvisMiddayBriefAction;
  readonly morningBaselineAvailable: boolean;
  readonly progressEvidenceAvailable: boolean;
  readonly completedWorkListed: boolean;
  readonly delayedMattersListed: boolean;
  readonly blockedItemsListed: boolean;
  readonly risingRisksChecked: boolean;
  readonly afternoonCommandRecommended: boolean;
  readonly includesPrivateDetails: boolean;
  readonly claimsRuntimeBriefGenerated: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisMiddayBriefDecision {
  readonly intent: 'MIDDAY_COMMAND_BRIEF_CONTROL';
  readonly briefRole: 'operational_checkpoint_not_live_progress_proof';
  readonly action: JarvisMiddayBriefAction;
  readonly commandStatus: JarvisMiddayCommandStatus;
  readonly policyStatus: JarvisMiddayBriefPolicyStatus;
  readonly reviewRequired: boolean;
  readonly privateDataMinimizationRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredBriefSections: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'midday_brief_boundary_built_not_live_brief_proven';
}

const requiredBriefSections = [
  'midday_opening',
  'morning_baseline_or_requires_review',
  'progress_since_morning',
  'completed_work',
  'delayed_matters',
  'blocked_items',
  'rising_risks',
  'recommended_afternoon_command',
  'proof_state'
] as const;

const forbiddenClaims = [
  'midday_brief_must_not_invent_progress',
  'morning_baseline_must_not_be_invented',
  'completed_work_must_not_be_claimed_without_evidence',
  'delays_and_blocks_must_not_be_hidden',
  'rising_risks_must_not_be_ignored',
  'repo_files_must_not_be_treated_as_live_midday_brief_proof'
] as const;

export function jarvisAssessMiddayBriefRequest(
  request: JarvisMiddayBriefRequest
): JarvisMiddayBriefDecision {
  const missingBody =
    !request.completedWorkListed ||
    !request.delayedMattersListed ||
    !request.blockedItemsListed ||
    !request.risingRisksChecked ||
    !request.afternoonCommandRecommended;

  const unverifiedPosition = !request.morningBaselineAvailable || !request.progressEvidenceAvailable;
  const runtimeBoundaryBreached = request.claimsRuntimeBriefGenerated;

  const policyStatus: JarvisMiddayBriefPolicyStatus = missingBody || runtimeBoundaryBreached
    ? 'blocked'
    : unverifiedPosition || request.includesPrivateDetails
      ? 'needs_approval'
      : 'allowed';

  const commandStatus: JarvisMiddayCommandStatus = policyStatus === 'blocked'
    ? 'Red'
    : unverifiedPosition || request.includesPrivateDetails
      ? 'Amber'
      : 'Green';

  return {
    intent: 'MIDDAY_COMMAND_BRIEF_CONTROL',
    briefRole: 'operational_checkpoint_not_live_progress_proof',
    action: request.action,
    commandStatus,
    policyStatus,
    reviewRequired: policyStatus !== 'allowed',
    privateDataMinimizationRequired: request.includesPrivateDetails,
    forbiddenClaims,
    requiredBriefSections,
    requiredProof: [
      'morning_baseline_or_requires_review_marker',
      'progress_evidence_or_requires_review_marker',
      'completed_work_with_evidence',
      'delayed_matters_or_none_marker',
      'blocked_items_or_none_marker',
      'rising_risks_or_none_marker',
      'recommended_afternoon_command',
      'runtime_evidence_for_live_brief_claims'
    ],
    runtimeProof: null,
    completionStatus: 'midday_brief_boundary_built_not_live_brief_proven'
  };
}

export const JARVIS_MIDDAY_BRIEF_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveMiddayBrief: 'not_proven_without_current_sources_and_runtime_confirmation',
  progressFields: 'must_be_verified_or_marked_requires_review',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
