export function assertN04SessionSafe(input: {
  candidateId: string;
  ownerUserId: string;
  browserAccess: "own_data_only" | "all_data" | "service_role";
  serviceRoleVisibleToBrowser: boolean;
  auditId?: string;
}) {
  if (!input.candidateId || !input.ownerUserId) {
    throw new Error("N04 session requires candidateId and ownerUserId");
  }

  if (!input.auditId) {
    throw new Error("N04 session requires auditId");
  }

  if (input.browserAccess !== "own_data_only") {
    throw new Error("N04 browser session must be own_data_only");
  }

  if (input.serviceRoleVisibleToBrowser !== false) {
    throw new Error("N04 service_role must never be visible to browser");
  }

  return true;
}