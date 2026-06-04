export type N04DeviceTrustLevel = "unknown" | "trusted" | "suspicious" | "blocked";

export type N04DeviceTrustRecord = {
  deviceTrustId: string;
  candidateId: string;
  deviceIdHash: string;
  trustLevel: N04DeviceTrustLevel;
  reason: string;
  auditId: string;
  popiaAccessLogId: string;
  createdAt: string;
  productionReady: false;
};