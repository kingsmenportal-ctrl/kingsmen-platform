import fs from "node:fs";

export const N05_REQUIRED_MODULES = [
  {
    moduleCode: "N05-DOCUMENT-01",
    proofReportPath: "reports/n05/n05-document-01-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-01-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-02",
    proofReportPath: "reports/n05/n05-document-02-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-02-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-03",
    proofReportPath: "reports/n05/n05-document-03-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-03-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-04",
    proofReportPath: "reports/n05/n05-document-04-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-04-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-04B",
    proofReportPath: "reports/n05/n05-document-04b-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-04b-validation-latest.json"
  }
] as const;

export function assertN05CloseoutReadiness() {
  const missing: string[] = [];

  for (const row of N05_REQUIRED_MODULES) {
    if (!fs.existsSync(row.proofReportPath)) missing.push(row.proofReportPath);
    if (!fs.existsSync(row.validationReportPath)) missing.push(row.validationReportPath);
  }

  if (missing.length > 0) {
    throw new Error(`N05 closeout blocked. Missing reports: ${missing.join(", ")}`);
  }

  for (const row of N05_REQUIRED_MODULES) {
    const proof = JSON.parse(fs.readFileSync(row.proofReportPath, "utf8"));
    const validation = JSON.parse(fs.readFileSync(row.validationReportPath, "utf8"));

    if (proof.passed !== true) {
      throw new Error(`N05 closeout blocked. Proof report did not pass: ${row.proofReportPath}`);
    }

    if (validation.passed !== true) {
      throw new Error(`N05 closeout blocked. Validation report did not pass: ${row.validationReportPath}`);
    }

    if (proof.productionReady !== false || validation.productionReady !== false) {
      throw new Error(`N05 closeout blocked. productionReady must remain false for ${row.moduleCode}`);
    }
  }

  return true;
}