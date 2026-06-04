export function assertN05CandidateOwnDocumentBoundary(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  candidateId: string;
  ownerCandidateId: string;
  action: "upload" | "read" | "request_replace" | "verify" | "reject" | "delete";
}) {
  if (input.actorType === "candidate" && input.candidateId !== input.ownerCandidateId) {
    throw new Error("N05 own-document boundary blocked: candidate can access only own documents");
  }

  if (input.actorType === "candidate" && ["verify", "reject", "delete"].includes(input.action)) {
    throw new Error(`N05 own-document boundary blocked: candidate cannot ${input.action} documents`);
  }

  return true;
}