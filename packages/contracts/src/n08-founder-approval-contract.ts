export type N08ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paused"
  | "rolled_back"
  | "expired";

export type N08FounderApprovalRequest = {
  approvalId: string;
  actionPacketId: string;
  commandId: string;
  status: N08ApprovalStatus;
  highRisk: boolean;
  founderApprovalRequired: boolean;
  requestedBy: "system" | "operator" | "worker";
  evidenceId: string;
  auditId: string;
  proofId?: string;
  productionReady: false;
};

export type N08FounderApprovalDecision = {
  approvalId: string;
  decision: "approve" | "reject" | "pause" | "rollback";
  decidedBy: "founder";
  reason: string;
  evidenceId: string;
  auditId: string;
  productionReady: false;
};