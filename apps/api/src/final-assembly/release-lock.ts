import { RELEASE_DOCTRINE, assertReleaseDoctrineLocked } from "./release-doctrine";

export interface ReleaseLockResult {
  releaseKey: string;
  lockStatus: "locked";
  releaseName: string;
  doctrine: typeof RELEASE_DOCTRINE;
  message: string;
}

export function lockOracleLiteFounderRelease(): ReleaseLockResult {
  assertReleaseDoctrineLocked(RELEASE_DOCTRINE);

  return {
    releaseKey: "oracle_lite_founder_release",
    lockStatus: "locked",
    releaseName: "Kingsmen Meta Ultra National - Oracle Lite Founder Release",
    doctrine: RELEASE_DOCTRINE,
    message:
      "N00-N20 is locked as a repo-materialized release. Future work must be deployment wiring, DB apply, UI routing, CI, security hardening, or evidence-backed repair."
  };
}

export function founderMustApproveUnlock(reason: string): void {
  if (!reason || reason.trim().length < 12) {
    throw new Error("FOUNDER_FINAL_AUTHORITY: Unlocking the release requires a clear founder-approved reason.");
  }
}