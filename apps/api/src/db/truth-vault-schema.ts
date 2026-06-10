export const N03_TRUTH_TABLES = [
  "system_runtime_config",
  "candidates",
  "candidate_profiles",
  "applications",
  "idempotency_keys",
  "command_log",
  "workflow_runs",
  "evidence_ledger",
  "audit_events",
  "source_authorities",
  "route_sources",
  "worker_heartbeats",
  "dead_letter_queue",
  "approval_requests"
] as const;

export type N03TruthTable = (typeof N03_TRUTH_TABLES)[number];

export const N03_REQUIRED_INDEX_MARKERS = [
  "idx_candidates_email",
  "idx_candidates_state",
  "idx_applications_candidate",
  "idx_applications_state",
  "idx_command_log_idempotency",
  "idx_workflow_runs_correlation",
  "idx_evidence_candidate",
  "idx_audit_correlation",
  "idx_dlq_status",
  "idx_approval_status"
] as const;

export const N03_RLS_REQUIRED = true;

export interface TruthVaultTableStatus {
  table: N03TruthTable;
  exists: boolean;
  rlsEnabled: boolean;
  checkedAt: string;
}