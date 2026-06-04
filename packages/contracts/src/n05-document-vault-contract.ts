export type N05DocumentStatus =
  | "requested"
  | "uploaded"
  | "ocr_pending"
  | "ocr_reviewed"
  | "verification_pending"
  | "verified"
  | "rejected"
  | "fraud_review"
  | "expired"
  | "replaced";

export type N05DocumentRecord = {
  documentId: string;
  candidateId: string;
  documentType: string;
  status: N05DocumentStatus;
  storageRef: string;
  candidateCanViewOwn: true;
  candidateCanVerify: false;
  evidenceId: string;
  auditId: string;
  createdAt: string;
  productionReady: false;
};