import type { JarvisDecision, JarvisMode } from './index';

export type JarvisPatchOperationKind =
  | 'create_file'
  | 'update_file'
  | 'validate_only'
  | 'blocked_change';

export type JarvisValidatorStatus = 'passed' | 'failed' | 'warning' | 'not_run';

export type JarvisHudStage =
  | 'idle'
  | 'planning'
  | 'policy_review'
  | 'patch_ready'
  | 'validation_running'
  | 'validation_failed'
  | 'validation_passed'
  | 'approval_required'
  | 'blocked';

export interface JarvisPatchOperation {
  readonly path: string;
  readonly operationKind: JarvisPatchOperationKind;
  readonly safeReason: string;
}

export interface JarvisPatchPlanContract {
  readonly patchPlanRef: string;
  readonly commandRef: string;
  readonly taskRef: string;
  readonly moduleRef: string;
  readonly scopeRoot: string;
  readonly operations: readonly JarvisPatchOperation[];
  readonly validatorCommands: readonly string[];
  readonly requiresFounderApproval: boolean;
  readonly readyForPatchWriter: boolean;
  readonly safeSummary: string;
}

export interface JarvisChangedFileRecord {
  readonly path: string;
  readonly operationKind: JarvisPatchOperationKind;
  readonly status: 'planned' | 'changed' | 'blocked' | 'unchanged';
  readonly safeReason: string;
}

export interface JarvisChangedFilesReport {
  readonly reportRef: string;
  readonly patchPlanRef: string;
  readonly commandRef: string;
  readonly moduleRef: string;
  readonly changedFiles: readonly JarvisChangedFileRecord[];
  readonly blockedFiles: readonly JarvisChangedFileRecord[];
  readonly validatorCommands: readonly string[];
  readonly safeSummary: string;
}

export interface JarvisValidatorResultRecord {
  readonly validatorRef: string;
  readonly command: string;
  readonly status: JarvisValidatorStatus;
  readonly safeSummary: string;
  readonly evidenceRef?: string;
}

export interface JarvisValidatorResultLedger {
  readonly ledgerRef: string;
  readonly commandRef: string;
  readonly moduleRef: string;
  readonly results: readonly JarvisValidatorResultRecord[];
  readonly overallStatus: JarvisValidatorStatus;
  readonly safeSummary: string;
}

export interface JarvisHudReadModel {
  readonly hudRef: string;
  readonly commandRef: string;
  readonly mode: JarvisMode;
  readonly stage: JarvisHudStage;
  readonly decision: JarvisDecision;
  readonly moduleRef?: string;
  readonly nextAction: string;
  readonly visibleSummary: string;
  readonly changedFileCount: number;
  readonly blockedFileCount: number;
  readonly validatorStatus: JarvisValidatorStatus;
  readonly founderApprovalRequired: boolean;
}
