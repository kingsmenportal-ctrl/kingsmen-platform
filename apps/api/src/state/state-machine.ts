export const KINGSMEN_STATES = [
  "NEW",
  "INTAKE_PENDING",
  "EVALUATION_PENDING",
  "DOCUMENT_PENDING",
  "EXECUTION_PENDING",
  "COMPLETED",
  "FAILED"
] as const;

export type KingsmenState = (typeof KINGSMEN_STATES)[number];

export const SAME_STATE_WORKERS = [
  "W04",
  "W05",
  "W08",
  "W09",
  "W13",
  "W14",
  "W15",
  "W16",
  "W17",
  "W24"
] as const;

export type SameStateWorker = (typeof SAME_STATE_WORKERS)[number];

export const CORE_TRANSITIONS: Record<KingsmenState, KingsmenState[]> = {
  NEW: ["INTAKE_PENDING", "FAILED"],
  INTAKE_PENDING: ["EVALUATION_PENDING", "FAILED"],
  EVALUATION_PENDING: ["DOCUMENT_PENDING", "FAILED"],
  DOCUMENT_PENDING: ["EXECUTION_PENDING", "FAILED"],
  EXECUTION_PENDING: ["COMPLETED", "DOCUMENT_PENDING", "FAILED"],
  COMPLETED: [],
  FAILED: ["DOCUMENT_PENDING", "EXECUTION_PENDING"]
};

export type WorkflowCode =
  | "W00"
  | "W01"
  | "W02"
  | "W03"
  | "W04"
  | "W05"
  | "W06"
  | "W07"
  | "W08"
  | "W09"
  | "W10"
  | "W11"
  | "W12"
  | "W13"
  | "W14"
  | "W15"
  | "W16"
  | "W17"
  | "W24";

export const WORKFLOW_TARGET_STATE: Record<WorkflowCode, KingsmenState | "SAME"> = {
  W00: "SAME",
  W01: "EVALUATION_PENDING",
  W02: "DOCUMENT_PENDING",
  W03: "COMPLETED",
  W04: "SAME",
  W05: "SAME",
  W06: "DOCUMENT_PENDING",
  W07: "EXECUTION_PENDING",
  W08: "SAME",
  W09: "SAME",
  W10: "EXECUTION_PENDING",
  W11: "DOCUMENT_PENDING",
  W12: "INTAKE_PENDING",
  W13: "SAME",
  W14: "SAME",
  W15: "SAME",
  W16: "SAME",
  W17: "SAME",
  W24: "SAME"
};

export interface TransitionInput {
  from: KingsmenState;
  to: KingsmenState;
  reason: string;
  workflow?: WorkflowCode;
}

export function isKingsmenState(value: string): value is KingsmenState {
  return KINGSMEN_STATES.includes(value as KingsmenState);
}

export function canTransition(from: KingsmenState, to: KingsmenState): boolean {
  if (from === to) return true;
  return CORE_TRANSITIONS[from].includes(to);
}

export function assertTransition(input: TransitionInput): TransitionInput {
  if (!canTransition(input.from, input.to)) {
    throw new Error(`Illegal Kingsmen state transition: ${input.from} -> ${input.to}`);
  }

  if (!input.reason || input.reason.trim().length < 3) {
    throw new Error("Transition reason is required.");
  }

  return input;
}

export function targetStateForWorkflow(workflow: WorkflowCode, currentState: KingsmenState): KingsmenState {
  const target = WORKFLOW_TARGET_STATE[workflow];
  if (target === "SAME") return currentState;
  return target;
}