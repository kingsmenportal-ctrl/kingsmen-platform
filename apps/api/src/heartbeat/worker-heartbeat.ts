export type WorkerHeartbeatStatus = "RUNNING" | "OK" | "WARNING" | "FAILED" | "STOPPED";

export interface WorkerHeartbeat {
  workerCode: string;
  workflowRunId?: string;
  correlationId: string;
  status: WorkerHeartbeatStatus;
  heartbeatAt: string;
  metadata: Record<string, unknown>;
}

export function createWorkerHeartbeat(input: {
  workerCode: string;
  workflowRunId?: string;
  correlationId: string;
  status?: WorkerHeartbeatStatus;
  metadata?: Record<string, unknown>;
}): WorkerHeartbeat {
  if (!input.workerCode) throw new Error("workerCode is required.");
  if (!input.correlationId) throw new Error("correlationId is required.");

  return {
    workerCode: input.workerCode,
    workflowRunId: input.workflowRunId,
    correlationId: input.correlationId,
    status: input.status ?? "RUNNING",
    heartbeatAt: new Date().toISOString(),
    metadata: input.metadata ?? {}
  };
}