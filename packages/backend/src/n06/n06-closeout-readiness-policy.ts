import fs from "node:fs";

export const N06_REQUIRED_MODULES = [
  {
    moduleCode: "N06-ROUTE-01",
    proofReportPath: "reports/n06/n06-route-01-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-01-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-02",
    proofReportPath: "reports/n06/n06-route-02-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-02-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-03",
    proofReportPath: "reports/n06/n06-route-03-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-03-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-04",
    proofReportPath: "reports/n06/n06-route-04-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-04-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-04B",
    proofReportPath: "reports/n06/n06-route-04b-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-04b-validation-latest.json"
  }
] as const;

export function assertN06CloseoutReadiness() {
  const missing: string[] = [];

  for (const row of N06_REQUIRED_MODULES) {
    if (!fs.existsSync(row.proofReportPath)) missing.push(row.proofReportPath);
    if (!fs.existsSync(row.validationReportPath)) missing.push(row.validationReportPath);
  }

  if (missing.length > 0) {
    throw new Error(`N06 closeout blocked. Missing reports: ${missing.join(", ")}`);
  }

  for (const row of N06_REQUIRED_MODULES) {
    const proof = JSON.parse(fs.readFileSync(row.proofReportPath, "utf8"));
    const validation = JSON.parse(fs.readFileSync(row.validationReportPath, "utf8"));

    if (proof.passed !== true) {
      throw new Error(`N06 closeout blocked. Proof report did not pass: ${row.proofReportPath}`);
    }

    if (validation.passed !== true) {
      throw new Error(`N06 closeout blocked. Validation report did not pass: ${row.validationReportPath}`);
    }

    if (proof.productionReady !== false || validation.productionReady !== false) {
      throw new Error(`N06 closeout blocked. productionReady must remain false for ${row.moduleCode}`);
    }
  }

  return true;
}