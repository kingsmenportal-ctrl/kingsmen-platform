export type JarvisConsoleBackendReadStatus = 'ready' | 'empty' | 'degraded';

export interface JarvisConsoleBackendSnapshot {
  readonly snapshotRef: string;
  readonly generatedAtIso: string;
  readonly sourceName: string;
  readonly status: JarvisConsoleBackendReadStatus;
  readonly activeSessionCount: number;
  readonly pendingReviewCount: number;
  readonly latestValidatorStatus: 'pass' | 'fail' | 'warning' | 'not_run';
  readonly safeSummary: string;
}

export interface JarvisConsoleBackendReadContract {
  readonly contractName: 'JarvisConsoleBackendReadContract';
  readonly route: '/founder/jarvis/console';
  readonly method: 'GET';
  readonly readOnly: true;
  readonly authorityNote: 'read_model_only_not_truth_source';
}

export const jarvisConsoleBackendReadContract: JarvisConsoleBackendReadContract = {
  contractName: 'JarvisConsoleBackendReadContract',
  route: '/founder/jarvis/console',
  method: 'GET',
  readOnly: true,
  authorityNote: 'read_model_only_not_truth_source',
};
