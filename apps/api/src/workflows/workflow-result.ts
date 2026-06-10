import type { KingsmenState, WorkflowCode } from "../state/state-machine";
import { assertTransition, targetStateForWorkflow } from "../state/state-machine";

export interface WorkflowResultEnvelope<TPayload = unknown> {
  workflowRunId: string;
  workflow: WorkflowCode;
  candidateId?: string;
  applicationId?: string;
  idempotencyKey: string;
  correlationId: string;
  previousState: KingsmenState;
  finalState: KingsmenState;
  status: "SUCCESS" | "FAILED" | "DEFERRED" | "MANUAL_REQUIRED";
  evidenceRef?: string;
  errorCode?: string;
  message: string;
  createdAt: string;
  payload: TPayload;
}

export function assertWorkflowResult<TPayload>(
  result: WorkflowResultEnvelope<TPayload>
): WorkflowResultEnvelope<TPayload> {
  const missing: string[] = [];

  if (!result.workflowRunId) missing.push("workflowRunId");
  if (!result.workflow) missing.push("workflow");
  if (!result.idempotencyKey) missing.push("idempotencyKey");
  if (!result.correlationId) missing.push("correlationId");
  if (!result.previousState) missing.push("previousState");
  if (!result.finalState) missing.push("finalState");
  if (!result.status) missing.push("status");
  if (!result.message) missing.push("message");
  if (!result.createdAt) missing.push("createdAt");

  if (missing.length > 0) {
    throw new Error(`Invalid workflow result. Missing: ${missing.join(", ")}`);
  }

  const expectedTarget = targetStateForWorkflow(result.workflow, result.previousState);

  if (result.finalState !== expectedTarget && result.status !== "FAILED" && result.status !== "MANUAL_REQUIRED") {
    throw new Error(`Workflow ${result.workflow} expected ${expectedTarget} but received ${result.finalState}`);
  }

  assertTransition({
    from: result.previousState,
    to: result.finalState,
    reason: `workflow:${result.workflow}:${result.status}`,
    workflow: result.workflow
  });

  return result;
}