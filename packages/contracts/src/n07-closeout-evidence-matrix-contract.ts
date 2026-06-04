export type N07CloseoutModuleCode =
  | "N07-AIRTABLE-01"
  | "N07-AIRTABLE-02"
  | "N07-AIRTABLE-03";

export type N07CloseoutEvidenceRow = {
  moduleCode: N07CloseoutModuleCode;
  proofReportPath: string;
  validationReportPath: string;
  passed: boolean;
  productionReady: false;
};

export type N07CloseoutEvidenceMatrix = {
  schema: "kingsmen.n07-closeout-evidence-matrix.v1";
  productionReady: false;
  rows: N07CloseoutEvidenceRow[];
  allPassed: boolean;
  postgresTruthPreserved: true;
  airtableMirrorOnly: true;
  handoverTo: "N08-FOUNDER-CONTROL";
};