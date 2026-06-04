export type N03StatusEntity =
  | "payment"
  | "application"
  | "document"
  | "source_authority"
  | "outcome"
  | "partner_sharing"
  | "success_story";

export type N03StatusTransition = {
  transitionId: string;
  entityType: N03StatusEntity;
  entityId: string;
  fromStatus: string;
  toStatus: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  proofId?: string;
  consentId?: string;
  auditId: string;
  founderApproved?: boolean;
  createdAt: string;
};