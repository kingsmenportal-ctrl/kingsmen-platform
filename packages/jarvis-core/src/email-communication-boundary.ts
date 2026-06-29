export type JarvisEmailAction =
  | 'search'
  | 'read_thread'
  | 'summarize'
  | 'triage'
  | 'draft_reply'
  | 'create_draft'
  | 'send_email'
  | 'send_draft'
  | 'forward_email'
  | 'archive'
  | 'label'
  | 'delete';

export type JarvisEmailPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisEmailCommunicationRequest {
  readonly commandRef: string;
  readonly action: JarvisEmailAction;
  readonly mailboxScope: string;
  readonly threadContextRead: boolean;
  readonly explicitSendApproval: boolean;
  readonly hasRecipient: boolean;
  readonly hasSubject: boolean;
  readonly includesSensitiveData: boolean;
  readonly includesAttachmentReview: boolean;
  readonly destructiveAction: boolean;
  readonly bulkAction: boolean;
  readonly evidenceCaptureRequired: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisEmailCommunicationDecision {
  readonly intent: 'EMAIL_PRIMARY_COMMUNICATION_CONTROL';
  readonly communicationRole: 'primary_tracked_channel_with_permissioned_actions';
  readonly action: JarvisEmailAction;
  readonly mailboxScope: string;
  readonly policyStatus: JarvisEmailPolicyStatus;
  readonly approvalRequired: boolean;
  readonly threadContextRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly draftSaferThanSend: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'email_boundary_built_not_mailbox_runtime_proven';
}

const forbiddenClaims = [
  'draft_must_not_be_treated_as_sent_email',
  'mailbox_search_must_not_be_treated_as_thread_read',
  'email_claim_must_not_be_treated_as_official_status_without_evidence',
  'email_action_must_not_be_claimed_without_tool_confirmation',
  'private_content_must_not_be_exposed_unnecessarily',
  'bulk_or_destructive_actions_require_explicit_approval'
] as const;

export function jarvisAssessEmailCommunicationRequest(
  request: JarvisEmailCommunicationRequest
): JarvisEmailCommunicationDecision {
  const sendingAction = request.action === 'send_email' || request.action === 'send_draft' || request.action === 'forward_email';
  const requiresRecipient = sendingAction || request.action === 'create_draft' || request.action === 'draft_reply';
  const threadContextRequired = ['read_thread', 'summarize', 'draft_reply', 'send_draft', 'forward_email'].includes(request.action);
  const evidenceRequired = request.evidenceCaptureRequired || sendingAction || request.includesSensitiveData;

  const missingProof =
    (threadContextRequired && !request.threadContextRead) ||
    (requiresRecipient && !request.hasRecipient) ||
    ((request.action === 'send_email' || request.action === 'create_draft') && !request.hasSubject) ||
    (sendingAction && !request.explicitSendApproval);

  const policyStatus: JarvisEmailPolicyStatus = missingProof
    ? 'blocked'
    : request.destructiveAction || request.bulkAction || request.includesSensitiveData || sendingAction
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'EMAIL_PRIMARY_COMMUNICATION_CONTROL',
    communicationRole: 'primary_tracked_channel_with_permissioned_actions',
    action: request.action,
    mailboxScope: request.mailboxScope,
    policyStatus,
    approvalRequired: policyStatus === 'needs_approval',
    threadContextRequired,
    evidenceRequired,
    draftSaferThanSend: sendingAction || request.includesSensitiveData,
    forbiddenClaims,
    requiredProof: [
      'mailbox_search_or_thread_read_confirmation',
      'thread_context_for_replies_forwards_and_summaries',
      'recipient_and_subject_for_new_messages',
      'explicit_send_approval_before_sending',
      'draft_id_or_message_id_after_mailbox_action',
      'evidence_reference_when_correspondence_affects_kingsmen_state'
    ],
    runtimeProof: null,
    completionStatus: 'email_boundary_built_not_mailbox_runtime_proven'
  };
}

export const JARVIS_EMAIL_COMMUNICATION_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  mailboxConnection: 'not_proven_without_mailbox_tool_confirmation',
  threadRead: 'required_for_contextual_email_actions',
  sendApproval: 'required_before_sending',
  evidenceLedger: 'required_for_kingsmen_state_affecting_correspondence',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
