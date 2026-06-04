export function assertN04SessionRiskSafe(input: {
  riskLevel: "low" | "medium" | "high" | "blocked";
  deviceTrustLevel: "unknown" | "trusted" | "suspicious" | "blocked";
  requiresReview?: boolean;
  serviceRoleVisibleToBrowser: boolean;
  browserAccess: "own_data_only" | "all_data" | "service_role";
}) {
  if (input.serviceRoleVisibleToBrowser !== false) {
    throw new Error("N04 session risk blocked: service_role must never be visible to browser");
  }

  if (input.browserAccess !== "own_data_only") {
    throw new Error("N04 session risk blocked: browser access must be own_data_only");
  }

  if ((input.riskLevel === "high" || input.deviceTrustLevel === "suspicious") && input.requiresReview !== true) {
    throw new Error("N04 suspicious/high-risk session requires review");
  }

  if (input.riskLevel === "blocked" || input.deviceTrustLevel === "blocked") {
    throw new Error("N04 blocked session/device cannot continue");
  }

  return true;
}