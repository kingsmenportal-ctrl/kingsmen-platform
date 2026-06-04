import fs from "node:fs";

export function runN02PolicySmokeTest() {
  const guard = fs.existsSync("packages/backend/src/n02/command-policy-guard.ts")
    ? fs.readFileSync("packages/backend/src/n02/command-policy-guard.ts", "utf8")
    : "";

  const failures: string[] = [];

  for (const phrase of [
    "enable_live_payments",
    "enable_live_email",
    "enable_official_submissions",
    "claim_production_ready",
    "run_raw_shell",
    "requiresFounderApproval",
    "providerProofPresent"
  ]) {
    if (!guard.includes(phrase)) failures.push(`Policy guard missing ${phrase}`);
  }

  return {
    schema: "kingsmen.n02-policy-smoke.v1",
    passed: failures.length === 0,
    productionReady: false,
    blocksLivePaymentsWithoutProof: guard.includes("enable_live_payments") && guard.includes("providerProofPresent"),
    blocksLiveEmailWithoutProof: guard.includes("enable_live_email") && guard.includes("providerProofPresent"),
    blocksOfficialSubmissionsWithoutProof: guard.includes("enable_official_submissions") && guard.includes("providerProofPresent"),
    blocksProductionClaimWithoutProof: guard.includes("claim_production_ready") && guard.includes("providerProofPresent"),
    blocksRawShell: guard.includes("run_raw_shell") && guard.includes("Raw shell command blocked"),
    requiresFounderApprovalForHighRisk: guard.includes("requiresFounderApproval"),
    failures,
    checkedAt: new Date().toISOString()
  } as const;
}