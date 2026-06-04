export type N04CandidateSession = {
  sessionId: string;
  candidateId: string;
  ownerUserId: string;
  deviceId?: string;
  ipHash?: string;
  userAgentHash?: string;
  authProvider: "supabase" | "local_dev" | "other";
  browserAccess: "own_data_only";
  serviceRoleVisibleToBrowser: false;
  createdAt: string;
  expiresAt: string;
  productionReady: false;
};