export interface JarvisPatchWriterDryRunResult {
  readonly resultRef: string;
  readonly patchPlanRef: string;
  readonly plannedFileCount: number;
  readonly blockedFileCount: number;
  readonly readyForReview: boolean;
  readonly safeSummary: string;
}

export interface JarvisValidatorRunnerPlan {
  readonly planRef: string;
  readonly commandRef: string;
  readonly validatorCommands: readonly string[];
  readonly dryRun: boolean;
  readonly safeSummary: string;
}

export interface JarvisHudTimelineEntry {
  readonly entryRef: string;
  readonly commandRef: string;
  readonly stage: string;
  readonly safeSummary: string;
  readonly createdAtIso: string;
}

export interface JarvisFounderApprovalRecord {
  readonly approvalRef: string;
  readonly commandRef: string;
  readonly approvedBy: string;
  readonly approvedScope: string;
  readonly expiresAtIso?: string;
  readonly safeSummary: string;
}

export interface JarvisGitEvidenceRecord {
  readonly evidenceRef: string;
  readonly commandRef: string;
  readonly branch: string;
  readonly changedPaths: readonly string[];
  readonly safeSummary: string;
}

export interface JarvisLocalCommandPlan {
  readonly planRef: string;
  readonly commandRef: string;
  readonly workingDirectory: string;
  readonly commandText: string;
  readonly dryRun: true;
  readonly safeSummary: string;
}
