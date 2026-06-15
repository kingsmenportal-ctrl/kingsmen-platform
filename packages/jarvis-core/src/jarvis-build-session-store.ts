export type JarvisBuildSessionState =
  | 'opened'
  | 'scoped'
  | 'planned'
  | 'waiting_review'
  | 'validating'
  | 'complete'
  | 'blocked';

export type JarvisBuildSessionRecord = {
  readonly sessionRef: string;
  readonly moduleRef: string;
  readonly founderRef: string;
  readonly state: JarvisBuildSessionState;
  readonly scopedPaths: readonly string[];
  readonly validatorRefs: readonly string[];
  readonly safeSummary: string;
  readonly updatedAtIso: string;
};

export function jarvisCreateBuildSession(input: {
  readonly sessionRef: string;
  readonly moduleRef: string;
  readonly founderRef: string;
  readonly scopedPaths?: readonly string[];
  readonly validatorRefs?: readonly string[];
  readonly safeSummary: string;
  readonly nowIso?: string;
}): JarvisBuildSessionRecord {
  return {
    sessionRef: input.sessionRef,
    moduleRef: input.moduleRef,
    founderRef: input.founderRef,
    state: 'opened',
    scopedPaths: input.scopedPaths ?? [],
    validatorRefs: input.validatorRefs ?? [],
    safeSummary: input.safeSummary,
    updatedAtIso: input.nowIso ?? new Date().toISOString()
  };
}

export function jarvisAdvanceBuildSession(
  session: JarvisBuildSessionRecord,
  nextState: JarvisBuildSessionState,
  safeSummary: string,
  nowIso = new Date().toISOString()
): JarvisBuildSessionRecord {
  return {
    ...session,
    state: nextState,
    safeSummary,
    updatedAtIso: nowIso
  };
}

export const JARVIS_BUILD_SESSION_STORE_LIVE = true;
