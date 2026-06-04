import fs from "node:fs";

export function getN02BackendReadiness() {
  const n00 = fs.existsSync("reports/constitution/n00-constitution-proof-latest.json");
  const n0201 = fs.existsSync("reports/n02/n02-kernel-01-proof-latest.json");
  const n0202 = fs.existsSync("reports/n02/n02-kernel-02-proof-latest.json");

  return {
    schema: "kingsmen.n02-readiness.v1",
    readyForNextLayer: n00 && n0201 && n0202,
    productionReady: false,
    n00ConstitutionProofPresent: n00,
    n02Kernel01ProofPresent: n0201,
    n02Kernel02ProofPresent: n0202,
    livePaymentsAllowed: false,
    liveEmailAllowed: false,
    officialSubmissionsAllowed: false,
    rawShellAllowed: false,
    nextAction: n00 && n0201 && n0202
      ? "Continue to N03 - PostgreSQL Truth Vault reality check/build."
      : "Repair missing N00/N02 proof reports.",
    checkedAt: new Date().toISOString()
  } as const;
}