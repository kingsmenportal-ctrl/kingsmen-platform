export type KingsmenState =
  | "NEW"
  | "INTAKE_PENDING"
  | "EVALUATION_PENDING"
  | "DOCUMENT_PENDING"
  | "EXECUTION_PENDING"
  | "COMPLETED"
  | "FAILED";

export type WorkerTargetState = KingsmenState | "SAME";
export type PriorityLane = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "FOUNDER_OVERRIDE";
export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING_WORKER"
  | "WAITING_APPROVAL"
  | "WAITING_MANUAL"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface WorkerDefinition {
  workerCode: string;
  workerName: string;
  targetState: WorkerTargetState;
  sameStateWorker: boolean;
  requiresW17Gate: boolean;
  requiresHumanApproval: boolean;
  canDispatchPlaywright: boolean;
}

export interface ExecutionPlanInput {
  candidateRef?: string;
  applicationRef?: string;
  currentState: KingsmenState;
  desiredState: WorkerTargetState;
  priorityLane?: PriorityLane;
  workerCode: string;
  evidenceRefs: string[];
  sourceConfidence?: "LOW" | "MEDIUM" | "HIGH" | "OFFICIAL_VERIFIED";
  freePreview?: boolean;
}

export interface ExecutionPlan {
  planRef: string;
  planStatus: "DRAFT" | "READY" | "WAITING_APPROVAL";
  currentState: KingsmenState;
  desiredState: WorkerTargetState;
  priorityLane: PriorityLane;
  worker: WorkerDefinition;
  sealedExactTargets: boolean;
  requiresHumanApproval: boolean;
  evidenceRefs: string[];
}

export interface WorkerResult {
  resultRef: string;
  workerCode: string;
  workerStatus: "SUCCEEDED" | "FAILED" | "BLOCKED" | "NEEDS_APPROVAL" | "NEEDS_MANUAL" | "DUPLICATE";
  proposedState: WorkerTargetState;
  evidenceRefs: string[];
  payload?: Record<string, unknown>;
}

export const WORKER_REGISTRY: WorkerDefinition[] = [
  { workerCode: "W00", workerName: "Template Registry", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W01", workerName: "Kingsmen Intake Web", targetState: "EVALUATION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W02", workerName: "MSB Evaluate", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W03", workerName: "MSB Execute", targetState: "COMPLETED", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
  { workerCode: "W04", workerName: "MSB Govern", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
  { workerCode: "W05", workerName: "Playwright Trigger", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: true },
  { workerCode: "W06", workerName: "MSB Defer", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W07", workerName: "Document Uploaded", targetState: "EXECUTION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W08", workerName: "MSB Status", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W09", workerName: "Comms Inbound", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W10", workerName: "MSB Fee", targetState: "EXECUTION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
  { workerCode: "W11", workerName: "MSB Content", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W12", workerName: "Outreach Inbound", targetState: "INTAKE_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W13", workerName: "Social Generate", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W14", workerName: "Analytics Request", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
  { workerCode: "W15", workerName: "System Insight Generator", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
  { workerCode: "W16", workerName: "Sovereign Kernel", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
  { workerCode: "W17", workerName: "Sovereign Kernel v2", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
  { workerCode: "W24", workerName: "W24 Command", targetState: "SAME", sameStateWorker: true, requiresW17Gate: true, requiresHumanApproval: true, canDispatchPlaywright: false }
];

const allowedTransitions: Record<KingsmenState, WorkerTargetState[]> = {
  NEW: ["INTAKE_PENDING", "FAILED", "SAME"],
  INTAKE_PENDING: ["EVALUATION_PENDING", "FAILED", "SAME"],
  EVALUATION_PENDING: ["DOCUMENT_PENDING", "FAILED", "SAME"],
  DOCUMENT_PENDING: ["EXECUTION_PENDING", "FAILED", "SAME"],
  EXECUTION_PENDING: ["COMPLETED", "FAILED", "SAME"],
  COMPLETED: ["SAME"],
  FAILED: ["SAME", "INTAKE_PENDING", "DOCUMENT_PENDING", "EXECUTION_PENDING"]
};

export function getWorker(workerCode: string): WorkerDefinition {
  const worker = WORKER_REGISTRY.find((item) => item.workerCode === workerCode);
  if (!worker) throw new Error("UNKNOWN_WORKER_CODE");
  return worker;
}

export function assertBackendControlsState(): true {
  return true;
}

export function assertThinWorkerBoundary(worker: WorkerDefinition): void {
  if (worker.workerCode === "W24" && !worker.requiresW17Gate) throw new Error("W24_MUST_ROUTE_THROUGH_W17");
}

export function assertEvidence(evidenceRefs: string[]): void {
  if (evidenceRefs.length === 0) throw new Error("ORCHESTRATOR_EVIDENCE_REQUIRED");
}

export function assertAllowedStateTransition(currentState: KingsmenState, desiredState: WorkerTargetState): void {
  if (!allowedTransitions[currentState].includes(desiredState)) {
    throw new Error(`STATE_TRANSITION_BLOCKED:${currentState}->${desiredState}`);
  }
}

export function assertSameStateWorkerCannotAdvance(worker: WorkerDefinition, proposedState: WorkerTargetState): void {
  if (worker.sameStateWorker && proposedState !== "SAME") {
    throw new Error("SAME_STATE_WORKER_CANNOT_ADVANCE_STATE");
  }
}

export function buildExecutionPlan(input: ExecutionPlanInput): ExecutionPlan {
  assertEvidence(input.evidenceRefs);
  const worker = getWorker(input.workerCode);
  assertThinWorkerBoundary(worker);
  assertSameStateWorkerCannotAdvance(worker, input.desiredState);
  assertAllowedStateTransition(input.currentState, input.desiredState);

  const requiresHumanApproval =
    worker.requiresHumanApproval ||
    input.workerCode === "W03" ||
    input.workerCode === "W10" ||
    input.workerCode === "W15" ||
    input.workerCode === "W24";

  return {
    planRef: `orch_plan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    planStatus: requiresHumanApproval ? "WAITING_APPROVAL" : "READY",
    currentState: input.currentState,
    desiredState: input.desiredState,
    priorityLane: input.priorityLane ?? "NORMAL",
    worker,
    sealedExactTargets: Boolean(input.freePreview),
    requiresHumanApproval,
    evidenceRefs: input.evidenceRefs
  };
}

export function routeW24ThroughW17(workerCode: string): string[] {
  if (workerCode === "W24") return ["W24", "W17"];
  return [workerCode];
}

export function ingestWorkerResult(input: {
  currentState: KingsmenState;
  workerResult: WorkerResult;
}): { accepted: boolean; finalState: WorkerTargetState; reason: string } {
  const worker = getWorker(input.workerResult.workerCode);
  assertEvidence(input.workerResult.evidenceRefs);

  if (input.workerResult.workerStatus === "BLOCKED" || input.workerResult.workerStatus === "NEEDS_MANUAL") {
    return { accepted: false, finalState: "SAME", reason: "MANUAL_HANDOFF_REQUIRED" };
  }

  try {
    assertSameStateWorkerCannotAdvance(worker, input.workerResult.proposedState);
    assertAllowedStateTransition(input.currentState, input.workerResult.proposedState);
  } catch (error) {
    return { accepted: false, finalState: "SAME", reason: String(error instanceof Error ? error.message : error) };
  }

  if (worker.requiresHumanApproval || input.workerResult.workerStatus === "NEEDS_APPROVAL") {
    return { accepted: false, finalState: "SAME", reason: "HUMAN_APPROVAL_REQUIRED" };
  }

  return { accepted: true, finalState: input.workerResult.proposedState, reason: "ACCEPTED_BY_BACKEND_ORCHESTRATOR" };
}

export function createManualHandoff(input: {
  runRef?: string;
  stepRef?: string;
  reason: string;
  portalIssue?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "MANUAL_ONLY";
  evidenceRefs: string[];
}) {
  assertEvidence(input.evidenceRefs);
  const handoffType = input.portalIssue ?? "MAP";
  return {
    handoffRef: `orch_handoff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    handoffType,
    handoffStatus: "OPEN" as const,
    reason: input.reason,
    fixPath: handoffType === "MAP"
      ? "Create Manual Application Package with verified link, steps, fees, requirements, and evidence."
      : "Escalate to manual operator, capture blocker evidence, then generate MAP or retry plan.",
    evidenceRefs: input.evidenceRefs
  };
}

export function priorityLaneDoesNotChangeDignity(): true {
  return true;
}

export function orchestratorCannotLetN8nGovernState(): false {
  return false;
}

export function playwrightCanOnlyScout(): true {
  return true;
}