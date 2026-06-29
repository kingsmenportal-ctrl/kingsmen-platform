export type JarvisCalendarAction =
  | 'search_events'
  | 'read_event'
  | 'daily_brief'
  | 'find_free_window'
  | 'meeting_prep'
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'respond_invite';

export type JarvisCalendarPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisCalendarCommandRequest {
  readonly commandRef: string;
  readonly action: JarvisCalendarAction;
  readonly dateScope: string;
  readonly timezone: string;
  readonly hasExactTime: boolean;
  readonly hasDuration: boolean;
  readonly hasAttendees: boolean;
  readonly eventAlreadyRead: boolean;
  readonly touchesRecurringEvent: boolean;
  readonly touchesPrivateOrSensitiveEvent: boolean;
  readonly explicitWriteApproval: boolean;
  readonly destructiveAction: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisCalendarCommandDecision {
  readonly intent: 'CALENDAR_TIME_COMMAND_CONTROL';
  readonly calendarRole: 'time_position_and_scheduling_control_surface';
  readonly action: JarvisCalendarAction;
  readonly dateScope: string;
  readonly timezone: string;
  readonly policyStatus: JarvisCalendarPolicyStatus;
  readonly approvalRequired: boolean;
  readonly exactTimeRequired: boolean;
  readonly durationRequired: boolean;
  readonly eventInspectionRequired: boolean;
  readonly conflictCheckRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'calendar_boundary_built_not_calendar_runtime_proven';
}

const forbiddenClaims = [
  'calendar_suggestion_must_not_be_treated_as_event_created',
  'calendar_search_must_not_be_treated_as_full_event_read',
  'availability_must_not_be_claimed_without_calendar_evidence',
  'event_update_or_delete_must_not_happen_without_event_inspection',
  'recurring_event_changes_require_special_scope',
  'calendar_action_must_not_be_claimed_without_tool_confirmation'
] as const;

export function jarvisAssessCalendarCommandRequest(
  request: JarvisCalendarCommandRequest
): JarvisCalendarCommandDecision {
  const writeAction = request.action === 'create_event' || request.action === 'update_event' || request.action === 'delete_event' || request.action === 'respond_invite';
  const exactTimeRequired = request.action === 'create_event' || request.action === 'update_event' || request.action === 'find_free_window';
  const durationRequired = request.action === 'create_event' || request.action === 'update_event' || request.action === 'find_free_window';
  const eventInspectionRequired = request.action === 'read_event' || request.action === 'update_event' || request.action === 'delete_event' || request.action === 'respond_invite' || request.touchesRecurringEvent;
  const conflictCheckRequired = request.action === 'create_event' || request.action === 'update_event' || request.action === 'find_free_window' || request.action === 'daily_brief';

  const missingProof =
    (exactTimeRequired && !request.hasExactTime) ||
    (durationRequired && !request.hasDuration) ||
    (eventInspectionRequired && !request.eventAlreadyRead) ||
    (writeAction && !request.explicitWriteApproval);

  const policyStatus: JarvisCalendarPolicyStatus = missingProof
    ? 'blocked'
    : request.destructiveAction || request.touchesRecurringEvent || request.touchesPrivateOrSensitiveEvent || writeAction
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'CALENDAR_TIME_COMMAND_CONTROL',
    calendarRole: 'time_position_and_scheduling_control_surface',
    action: request.action,
    dateScope: request.dateScope,
    timezone: request.timezone,
    policyStatus,
    approvalRequired: policyStatus === 'needs_approval',
    exactTimeRequired,
    durationRequired,
    eventInspectionRequired,
    conflictCheckRequired,
    forbiddenClaims,
    requiredProof: [
      'date_scope_and_timezone',
      'event_search_or_event_read_confirmation',
      'exact_time_and_duration_for_write_or_free_window_actions',
      'conflict_check_for_scheduling_actions',
      'explicit_write_approval_before_create_update_delete_or_response',
      'event_id_or_calendar_action_confirmation_after_write'
    ],
    runtimeProof: null,
    completionStatus: 'calendar_boundary_built_not_calendar_runtime_proven'
  };
}

export const JARVIS_CALENDAR_COMMAND_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  calendarConnection: 'not_proven_without_calendar_tool_confirmation',
  eventSearch: 'required_for_schedule_position',
  eventWrite: 'requires_exact_details_and_approval',
  conflictCheck: 'required_for_scheduling_actions',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
