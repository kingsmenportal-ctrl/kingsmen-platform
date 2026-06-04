export type N04CloseoutModuleCode =
  | "N04-CANDIDATE-01"
  | "N04-CANDIDATE-02"
  | "N04-CANDIDATE-03"
  | "N04-CANDIDATE-04"
  | "N04-CANDIDATE-05"
  | "N04-CANDIDATE-06"
  | "N04-CANDIDATE-07"
  | "N04-CANDIDATE-08"
  | "N04-CANDIDATE-09"
  | "N04-CANDIDATE-10";

export type N04CloseoutEvidenceRow = {
  moduleCode: N04CloseoutModuleCode;
  proofReportPath: string;
  validationReportPath: string;
  passed: boolean;
  productionReady: false;
};

export type N04CloseoutEvidenceMatrix = {
  schema: "kingsmen.n04-closeout-evidence-matrix.v1";
  productionReady: false;
  rows: N04CloseoutEvidenceRow[];
  allPassed: boolean;
  handoverTo: "N05-DOCUMENT-VAULT";
};