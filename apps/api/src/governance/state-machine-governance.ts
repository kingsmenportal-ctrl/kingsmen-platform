export const BACKEND_STATE_MACHINE_GOVERNS_FLOW = true;

export type CandidateState =
  | "NEW"
  | "INTAKE_PENDING"
  | "EVALUATION_PENDING"
  | "DOCUMENT_PENDING"
  | "EXECUTION_PENDING"
  | "COMPLETED"
  | "FAILED";

const transitions: Record<CandidateState, CandidateState[]> = {
  NEW: ["INTAKE_PENDING"],
  INTAKE_PENDING: ["EVALUATION_PENDING"],
  EVALUATION_PENDING: ["DOCUMENT_PENDING"],
  DOCUMENT_PENDING: ["EXECUTION_PENDING"],
  EXECUTION_PENDING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: ["DOCUMENT_PENDING", "EXECUTION_PENDING"]
};

export function canTransitionState(from: CandidateState, to: CandidateState): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function assertStateTransitionAllowed(from: CandidateState, to: CandidateState): void {
  if (!canTransitionState(from, to)) {
    throw new Error(`STATE_TRANSITION_BLOCKED: ${from} -> ${to}`);
  }
}

export function explainStateAuthority(): string {
  return "Backend state machine controls flow. n8n, Airtable, AI, and UI cannot independently move candidate state.";
}