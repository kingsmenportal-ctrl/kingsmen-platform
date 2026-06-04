export type N03RlsBoundary = {
  tableName: string;
  ownerColumn?: "candidate_id" | "actor_id" | "created_by";
  candidateCanReadOwn: boolean;
  candidateCanWriteOwnDraftOnly: boolean;
  founderCanReview: boolean;
  serviceRoleBackendOnly: true;
  publicAccessAllowed: false;
};