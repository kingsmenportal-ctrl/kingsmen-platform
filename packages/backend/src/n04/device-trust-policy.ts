export function assertN04DeviceTrustSafe(input: {
  candidateId: string;
  deviceIdHash?: string;
  trustLevel: "unknown" | "trusted" | "suspicious" | "blocked";
  auditId?: string;
  popiaAccessLogId?: string;
}) {
  if (!input.candidateId || !input.deviceIdHash) {
    throw new Error("N04 device trust requires candidateId and deviceIdHash");
  }

  if (!input.auditId) {
    throw new Error("N04 device trust requires auditId");
  }

  if (!input.popiaAccessLogId) {
    throw new Error("N04 device trust requires POPIA access log");
  }

  if (input.trustLevel === "blocked") {
    throw new Error("N04 blocked device cannot continue candidate portal session");
  }

  return true;
}