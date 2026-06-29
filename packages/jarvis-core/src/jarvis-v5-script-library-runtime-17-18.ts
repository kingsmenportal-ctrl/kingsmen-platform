export type JarvisV5ScriptNumber17To18 = 17 | 18;

export interface JarvisV5ScriptLibraryEntry17To18 {
  readonly number: JarvisV5ScriptNumber17To18;
  readonly title: string;
  readonly path: string;
  readonly commandFamily: string;
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_live_runtime_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_17_TO_18: readonly JarvisV5ScriptLibraryEntry17To18[] = [
  {
    number: 17,
    title: 'When the Commander Asks About Supabase',
    path: 'docs/jarvis/v5/script-library/NUMBER_17_WHEN_THE_COMMANDER_ASKS_ABOUT_SUPABASE.md',
    commandFamily: 'supabase_platform_support',
    controllingLine:
      'Commander, Supabase may assist with PostgreSQL, authentication, storage, or edge services where suitable, but Kingsmen doctrine still requires clear state control, audit logging, and disciplined access.',
    mustDo: [
      'preserve PostgreSQL truth doctrine',
      'require disciplined access control',
      'require audit and evidence for sensitive actions',
      'separate repo proof from live Supabase proof'
    ],
    mustNeverDo: [
      'treat Supabase as final truth',
      'claim live project connection from repo files',
      'weaken private-data controls',
      'claim production completion without runtime evidence'
    ],
    proofRequired: [
      'Supabase boundary decision',
      'project/runtime probe for live claims',
      'validator output',
      'audit and evidence plan for sensitive work'
    ],
    completionStatus: 'repo_registry_built_not_live_runtime_proven'
  },
  {
    number: 18,
    title: 'When the Commander Asks About GitHub',
    path: 'docs/jarvis/v5/script-library/NUMBER_18_WHEN_THE_COMMANDER_ASKS_ABOUT_GITHUB.md',
    commandFamily: 'github_repo_evidence_change_control',
    controllingLine:
      'Commander, I shall inspect the repository evidence, separate committed files from runtime proof, and act only through traceable GitHub changes.',
    mustDo: [
      'inspect exact repo and path',
      'separate commit proof from runtime proof',
      'avoid blind overwrites',
      'return commit SHA for repo changes'
    ],
    mustNeverDo: [
      'claim runtime proof from commit alone',
      'claim migration applied because file exists',
      'expose secrets or private records',
      'write unrelated paths'
    ],
    proofRequired: [
      'exact repo and path',
      'file inspection before update/delete',
      'commit SHA for repo change',
      'validator or CI output before build-pass claims'
    ],
    completionStatus: 'repo_registry_built_not_live_runtime_proven'
  }
] as const;

export function jarvisGetV5ScriptEntry17To18(number: JarvisV5ScriptNumber17To18) {
  const entry = JARVIS_V5_SCRIPT_LIBRARY_17_TO_18.find((item) => item.number === number);
  if (!entry) throw new Error(`Jarvis V5 script number not registered in 17-18 range: ${number}`);
  return entry;
}

export function jarvisSummarizeV5ScriptRuntime17To18() {
  return {
    range: '17_to_18',
    totalRegistered: JARVIS_V5_SCRIPT_LIBRARY_17_TO_18.length,
    expectedTotal: 2,
    runtimeRegistry: 'built',
    liveRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
