import type { CandidateMobileDevice } from "./candidate-mobile-types";

export function registerMobileDevice(input: Omit<CandidateMobileDevice, "trustLevel"> & { knownDevice?: boolean }): CandidateMobileDevice {
  return {
    candidateId: input.candidateId,
    accountId: input.accountId,
    deviceLabel: input.deviceLabel,
    deviceFingerprintHash: input.deviceFingerprintHash,
    trustLevel: input.knownDevice ? "trusted" : "new",
    metadata: input.metadata ?? {}
  };
}

export function requireTrustedDevice(device: CandidateMobileDevice, actionKey: string): void {
  const sensitive = ["payment_status", "upload_document", "continue_intake", "manual_package"];
  if (sensitive.includes(actionKey) && device.trustLevel !== "trusted") {
    throw new Error("DEVICE_TRUST_REQUIRED: This candidate mobile action requires a trusted device.");
  }
  if (device.trustLevel === "revoked") {
    throw new Error("DEVICE_REVOKED: This device cannot access the candidate portal.");
  }
}