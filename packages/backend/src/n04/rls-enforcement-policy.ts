export function assertN04RlsOwnDataEnforced(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  candidateId: string;
  requestedCandidateId: string;
  browserAccess: "own_data_only" | "all_data" | "service_role";
  publicAccessAllowed: boolean;
  serviceRoleVisibleToBrowser: boolean;
}) {
  if (input.publicAccessAllowed !== false) {
    throw new Error("N04 RLS blocked: public candidate data access is not allowed");
  }

  if (input.serviceRoleVisibleToBrowser !== false) {
    throw new Error("N04 RLS blocked: service_role must never be visible to browser");
  }

  if (input.browserAccess !== "own_data_only") {
    throw new Error("N04 RLS blocked: browser access must be own_data_only");
  }

  if (input.actorType === "candidate" && input.candidateId !== input.requestedCandidateId) {
    throw new Error("N04 RLS blocked: candidate cannot access another candidate's data");
  }

  return true;
}