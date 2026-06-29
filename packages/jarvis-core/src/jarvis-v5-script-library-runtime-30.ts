export interface JarvisV5ScriptLibraryEntry30 {
  readonly number: 30;
  readonly title: 'When Evidence Is Missing';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md';
  readonly commandFamily: 'evidence_missing_verification_hold_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_live_verification_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_30: JarvisV5ScriptLibraryEntry30 = {
  number: 30,
  title: 'When Evidence Is Missing',
  path: 'docs/jarvis/v5/script-library/NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md',
  commandFamily: 'evidence_missing_verification_hold_control',
  controllingLine:
    'Commander, the evidence is incomplete. I cannot mark this matter as verified. I recommend holding execution until the required proof is secured.',
  mustDo: [
    'mark incomplete evidence as unverified',
    'name the missing proof clearly',
    'separate present evidence from missing evidence',
    'request the next required proof',
    'require runtime evidence for runtime or production claims'
  ],
  mustNeverDo: [
    'mark incomplete matters as verified',
    'present assumptions as proof',
    'hide missing evidence',
    'claim official status without source proof',
    'claim live verification from repo files alone'
  ],
  proofRequired: [
    'matter under review',
    'claim being verified',
    'present evidence list',
    'missing evidence list',
    'verification status',
    'next proof command',
    'runtime evidence for runtime or production claims'
  ],
  completionStatus: 'repo_registry_built_not_live_verification_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime30() {
  return {
    range: '30',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    evidenceRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
