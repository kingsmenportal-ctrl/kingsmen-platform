export type N04ProfileCorrectionField =
  | "full_name"
  | "email"
  | "phone"
  | "province"
  | "id_number_hash"
  | "school"
  | "grade"
  | "address"
  | "guardian_contact";

export type N04ProfileCorrectionRequest = {
  correctionId: string;
  candidateId: string;
  field: N04ProfileCorrectionField;
  oldValueSummary: string;
  newValueSummary: string;
  reason: string;
  status: "requested" | "review_pending" | "approved" | "rejected" | "applied";
  sensitiveChange: boolean;
  auditId: string;
  popiaAccessLogId: string;
  createdAt: string;
  productionReady: false;
};