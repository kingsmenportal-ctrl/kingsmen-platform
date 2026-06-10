export interface WorkflowObservationInput {
  workflowCode: string;
  workflowRunRef?: string;
  startedAtMs: number;
  endedAtMs?: number;
  retryCount?: number;
  failed?: boolean;
  blocked?: boolean;
  failureReason?: string;
  evidenceRefs: string[];
}

export interface WorkflowObservation {
  observationRef: string;
  workflowCode: string;
  workflowRunRef?: string;
  status: "SUCCESS" | "RUNNING" | "FAILED" | "RETRYING" | "BLOCKED" | "UNKNOWN";
  durationMs?: number;
  retryCount: number;
  failureReason?: string;
  fixPath: string;
  evidenceRefs: string[];
}

export function observeWorkflowRun(input: WorkflowObservationInput): WorkflowObservation {
  const retryCount = input.retryCount ?? 0;
  const status = input.blocked ? "BLOCKED" : input.failed ? (retryCount > 0 ? "RETRYING" : "FAILED") : input.endedAtMs ? "SUCCESS" : "RUNNING";
  const durationMs = input.endedAtMs ? Math.max(0, input.endedAtMs - input.startedAtMs) : undefined;

  return {
    observationRef: `wfobs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    workflowCode: input.workflowCode,
    workflowRunRef: input.workflowRunRef,
    status,
    durationMs,
    retryCount,
    failureReason: input.failureReason,
    fixPath: status === "FAILED" || status === "BLOCKED" ? "Route to retry, manual fallback, or operator review according to workflow policy." : "",
    evidenceRefs: input.evidenceRefs
  };
}