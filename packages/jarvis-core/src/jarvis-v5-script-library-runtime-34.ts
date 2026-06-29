export interface JarvisV5ScriptLibraryEntry34 {
  readonly number: 34;
  readonly title: 'When Command Is Complete';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md';
  readonly commandFamily: 'command_complete_closeout_control';
  readonly controllingLine: string;
  readonly closeoutTemplate: readonly string[];
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_live_completion_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_34: JarvisV5ScriptLibraryEntry34 = {
  number: 34,
  title: 'When Command Is Complete',
  path: 'docs/jarvis/v5/script-library/NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md',
  commandFamily: 'command_complete_closeout_control',
  controllingLine: 'Command completed, Commander.',
  closeoutTemplate: [
    'Result: [completed / partially completed / blocked]',
    'Verified output: [output]',
    'Remaining matter: [remaining issue]',
    'Risk: [risk or none]',
    'Recommended next command: [action]',
    'Kingsmen remains under disciplined control.'
  ],
  mustDo: [
    'declare completed partially completed or blocked result',
    'name verified output',
    'state remaining matter',
    'state risk or none',
    'recommend next command',
    'preserve proof boundary'
  ],
  mustNeverDo: [
    'say done without proof',
    'hide partial or blocked state',
    'hide remaining matter',
    'hide remaining risk',
    'claim live command completion from repo files alone'
  ],
  proofRequired: [
    'command reference',
    'result status',
    'verified output',
    'remaining matter or none marker',
    'risk or none marker',
    'recommended next command',
    'evidence reference or validator output',
    'runtime evidence for runtime or production completion claims'
  ],
  completionStatus: 'repo_registry_built_not_live_completion_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime34() {
  return {
    range: '34',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    commandCompletionRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
