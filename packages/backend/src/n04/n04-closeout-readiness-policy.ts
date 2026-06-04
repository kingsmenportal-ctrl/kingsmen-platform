import fs from "node:fs";

export const N04_REQUIRED_PROOF_REPORTS = [
  "reports/n04/n04-candidate-01-proof-latest.json",
  "reports/n04/n04-candidate-02-proof-latest.json",
  "reports/n04/n04-candidate-03-proof-latest.json",
  "reports/n04/n04-candidate-04-proof-latest.json",
  "reports/n04/n04-candidate-05-proof-latest.json",
  "reports/n04/n04-candidate-06-proof-latest.json",
  "reports/n04/n04-candidate-07-proof-latest.json",
  "reports/n04/n04-candidate-08-proof-latest.json",
  "reports/n04/n04-candidate-09-proof-latest.json",
  "reports/n04/n04-candidate-10-proof-latest.json"
] as const;

export const N04_REQUIRED_VALIDATION_REPORTS = [
  "reports/validation/n04-candidate-01-validation-latest.json",
  "reports/validation/n04-candidate-02-validation-latest.json",
  "reports/validation/n04-candidate-03-validation-latest.json",
  "reports/validation/n04-candidate-04-validation-latest.json",
  "reports/validation/n04-candidate-05-validation-latest.json",
  "reports/validation/n04-candidate-06-validation-latest.json",
  "reports/validation/n04-candidate-07-validation-latest.json",
  "reports/validation/n04-candidate-08-validation-latest.json",
  "reports/validation/n04-candidate-09-validation-latest.json",
  "reports/validation/n04-candidate-10-validation-latest.json"
] as const;

export function assertN04CloseoutReadiness() {
  const missing = [...N04_REQUIRED_PROOF_REPORTS, ...N04_REQUIRED_VALIDATION_REPORTS].filter((path) => !fs.existsSync(path));

  if (missing.length > 0) {
    throw new Error(`N04 closeout blocked. Missing reports: ${missing.join(", ")}`);
  }

  for (const path of [...N04_REQUIRED_PROOF_REPORTS, ...N04_REQUIRED_VALIDATION_REPORTS]) {
    const report = JSON.parse(fs.readFileSync(path, "utf8"));
    if (report.passed !== true) {
      throw new Error(`N04 closeout blocked. Report did not pass: ${path}`);
    }
    if (report.productionReady !== false) {
      throw new Error(`N04 closeout blocked. productionReady must remain false: ${path}`);
    }
  }

  return true;
}