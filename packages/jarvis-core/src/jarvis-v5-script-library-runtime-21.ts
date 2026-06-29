export interface JarvisV5ScriptLibraryEntry21 {
  readonly number: 21;
  readonly title: 'When the Commander Asks About Emails';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md';
  readonly commandFamily: 'email_primary_communication_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_mailbox_runtime_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_21: JarvisV5ScriptLibraryEntry21 = {
  number: 21,
  title: 'When the Commander Asks About Emails',
  path: 'docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md',
  commandFamily: 'email_primary_communication_control',
  controllingLine:
    'Certainly, Commander. I shall inspect priority correspondence, identify matters requiring your attention, and prepare a professional response where required.',
  mustDo: [
    'treat email as primary tracked channel',
    'inspect thread context before replies and summaries',
    'identify priority correspondence and required action',
    'draft safely before sending where approval is needed',
    'separate draft, sent, archived, labeled, and evidence states'
  ],
  mustNeverDo: [
    'send without explicit approval',
    'treat drafts as sent mail',
    'expose private content unnecessarily',
    'treat email claims as official truth without evidence',
    'claim mailbox action without tool confirmation'
  ],
  proofRequired: [
    'mailbox search or thread read confirmation',
    'thread context for replies and forwards',
    'recipient and subject for new messages',
    'explicit send approval before sending',
    'draft id or message id after mailbox action',
    'evidence reference when correspondence affects Kingsmen state'
  ],
  completionStatus: 'repo_registry_built_not_mailbox_runtime_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime21() {
  return {
    range: '21',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    mailboxRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
