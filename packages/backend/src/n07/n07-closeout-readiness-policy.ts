import fs from "node:fs";

export const N07_REQUIRED_MODULES = [
  {
    moduleCode: "N07-AIRTABLE-01",
    proofReportPath: "reports/n07/n07-airtable-01-proof-latest.json",
    validationReportPath: "reports/validation/n07-airtable-01-validation-latest.json"
  },
  {
    moduleCode: "N07-AIRTABLE-02",
    proofReportPath: "reports/n07/n07-airtable-02-proof-latest.json",
    validationReportPath: "reports/validation/n07-airtable-02-validation-latest.json"
  },
  {
    moduleCode: "N07-AIRTABLE-03",
    proofReportPath: "reports/n07/n07-airtable-03-proof-latest.json",
    validationReportPath: "reports/validation/n07-airtable-03-validation-latest.json"
  }
] as const;

export function assertN07CloseoutReadiness() {
  const missing: string[] = [];

  for (const row of N07_REQUIRED_MODULES) {
    if (!fs.existsSync(row.proofReportPath)) missing.push(row.proofReportPath);
    if (!fs.existsSync(row.validationReportPath)) missing.push(row.validationReportPath);
  }

  if (missing.length > 0) {
    throw new Error(`N07 closeout blocked. Missing reports: ${missing.join(", ")}`);
  }

  for (const row of N07_REQUIRED_MODULES) {
    const proof = JSON.parse(fs.readFileSync(row.proofReportPath, "utf8"));
    const validation = JSON.parse(fs.readFileSync(row.validationReportPath, "utf8"));

    if (proof.passed !== true) throw new Error(`N07 proof did not pass: ${row.proofReportPath}`);
    if (validation.passed !== true) throw new Error(`N07 validation did not pass: ${row.validationReportPath}`);
    if (proof.productionReady !== false || validation.productionReady !== false) {
      throw new Error(`N07 productionReady must remain false for ${row.moduleCode}`);
    }
  }

  return true;
}