export interface JarvisBuildSessionSnapshot {
  readonly sessionRef: string;
  readonly moduleRef: string;
  readonly stage: 'planned' | 'in_review' | 'validated' | 'blocked' | 'closed';
  readonly safeSummary: string;
  readonly changedPathCount: number;
  readonly validatorStatus: 'pass' | 'warn' | 'fail' | 'not_run';
  readonly updatedAtIso: string;
}

export interface JarvisBuildSessionPersistenceRecord {
  readonly recordRef: string;
  readonly sessionRef: string;
  readonly payloadVersion: 1;
  readonly snapshot: JarvisBuildSessionSnapshot;
  readonly persistenceNotice: 'store_snapshot_only';
}

export function jarvisCreateBuildSessionPersistenceRecord(
  recordRef: string,
  snapshot: JarvisBuildSessionSnapshot,
): JarvisBuildSessionPersistenceRecord {
  return {
    recordRef,
    sessionRef: snapshot.sessionRef,
    payloadVersion: 1,
    snapshot,
    persistenceNotice: 'store_snapshot_only',
  };
}
