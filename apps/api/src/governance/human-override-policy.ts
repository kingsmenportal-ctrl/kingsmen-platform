import type { HumanOverrideRequest } from "./governance-types";

export function createHumanOverrideRequest(input: Omit<HumanOverrideRequest, "overrideRef" | "overrideStatus" | "noSilentOverride">): HumanOverrideRequest {
  if (!input.overrideReason.trim()) throw new Error("OVERRIDE_REASON_REQUIRED");
  if (input.evidenceRefs.length === 0) throw new Error("OVERRIDE_EVIDENCE_REQUIRED");

  return {
    ...input,
    overrideRef: `ovr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    overrideStatus: "PENDING_REVIEW",
    noSilentOverride: true
  };
}

export function assertNoSilentOverride(request: HumanOverrideRequest): void {
  if (!request.noSilentOverride) throw new Error("NO_SILENT_OVERRIDE");
  if (!request.overrideReason.trim()) throw new Error("OVERRIDE_REASON_REQUIRED");
  if (request.evidenceRefs.length === 0) throw new Error("OVERRIDE_EVIDENCE_REQUIRED");
}