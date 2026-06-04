export type N04AccountRecoveryRequest = {
  recoveryId: string;
  candidateId?: string;
  email?: string;
  phone?: string;
  reason: "lost_access" | "email_change" | "phone_change" | "security_review";
  status: "requested" | "review_pending" | "approved" | "rejected" | "completed";
  popiaAccessLogRequired: true;
  auditId: string;
  createdAt: string;
};