export type N05CloseoutModuleCode =
  | "N05-DOCUMENT-01"
  | "N05-DOCUMENT-02"
  | "N05-DOCUMENT-03"
  | "N05-DOCUMENT-04"
  | "N05-DOCUMENT-04B";

export type N05CloseoutEvidenceRow = {
  moduleCode: N05CloseoutModuleCode;
  proofReportPath: string;
  validationReportPath: string;
  passed: boolean;
  productionReady: false;
};

export type N05CloseoutEvidenceMatrix = {
  schema: "kingsmen.n05-closeout-evidence-matrix.v1";
  productionReady: false;
  rows: N05CloseoutEvidenceRow[];
  allPassed: boolean;
  handoverTo: "N06-ROUTE-UNIVERSE";
};