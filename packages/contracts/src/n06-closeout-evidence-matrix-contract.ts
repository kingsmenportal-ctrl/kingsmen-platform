export type N06CloseoutModuleCode =
  | "N06-ROUTE-01"
  | "N06-ROUTE-02"
  | "N06-ROUTE-03"
  | "N06-ROUTE-04"
  | "N06-ROUTE-04B";

export type N06CloseoutEvidenceRow = {
  moduleCode: N06CloseoutModuleCode;
  proofReportPath: string;
  validationReportPath: string;
  passed: boolean;
  productionReady: false;
};

export type N06CloseoutEvidenceMatrix = {
  schema: "kingsmen.n06-closeout-evidence-matrix.v1";
  productionReady: false;
  rows: N06CloseoutEvidenceRow[];
  allPassed: boolean;
  handoverTo: "N07-AIRTABLE-SYNC";
};