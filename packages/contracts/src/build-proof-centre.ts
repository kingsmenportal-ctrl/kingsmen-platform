export type KingsmenProofStatus =
  | "NOT_STARTED"
  | "BUILT_PENDING_VALIDATION"
  | "VALIDATED"
  | "RUNTIME_PROVEN"
  | "STAGING_PROVEN"
  | "PRODUCTION_READY"
  | "PRODUCTION_ACTIVE"
  | "PAUSED"
  | "REPLACED"
  | "ARCHIVED_FOR_FUTURE";

export interface KingsmenProofReportSummary {
  module: string;
  status: KingsmenProofStatus | string;
  passed: boolean;
  reportPath: string;
  failedChecks?: string[];
  warnings?: string[];
  oracleLiteImpact?: string;
  controlPlaneImpact?: string;
  nextAction?: string;
}

export const KINGSMEN_BUILD_PROOF_RULES = [
  "No claim without file path.",
  "No file path without content.",
  "No content without validator.",
  "No validator without report.",
  "No production claim without runtime proof."
];

export const KINGSMEN_INITIAL_PROOF_REPORTS = [
  "reports/validation/merge-foundation-latest.json",
  "reports/validation/creator-normalize-latest.json",
  "reports/creator/creator-doctor-report.json",
  "reports/creator/creator-audit-existing-report.json",
  "reports/creator/creator-action-scaffold-report.json",
  "reports/creator/creator-action-validate-report.json"
];

export function isValidatedProof(report: KingsmenProofReportSummary): boolean {
  return report.passed === true && (report.failedChecks ?? []).length === 0;
}
