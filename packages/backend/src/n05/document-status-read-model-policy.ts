export function assertN05DocumentStatusReadModelSafe(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  candidateId: string;
  requestedCandidateId: string;
  candidateSafe: boolean;
  candidateVerificationActionAvailable: boolean;
}) {
  if (input.actorType === "candidate" && input.candidateId !== input.requestedCandidateId) {
    throw new Error("N05 document status view blocked: candidate can read only own documents");
  }

  if (input.candidateSafe !== true) {
    throw new Error("N05 document status view must be candidate-safe");
  }

  if (input.candidateVerificationActionAvailable !== false) {
    throw new Error("N05 document status view blocked: candidate verification action must not be available");
  }

  return true;
}