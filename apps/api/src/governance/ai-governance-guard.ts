export const AI_GOVERNANCE_BLOCKED_ACTIONS = [
  "money",
  "refunds",
  "official_status",
  "submissions",
  "fraud",
  "privacy",
  "hard_blockers"
] as const;

export type AiGovernanceBlockedAction = typeof AI_GOVERNANCE_BLOCKED_ACTIONS[number];

export function assertAiDoesNotGovern(action: string): void {
  const normalized = action.toLowerCase().replace(/[\s-]+/g, "_") as AiGovernanceBlockedAction;
  if (AI_GOVERNANCE_BLOCKED_ACTIONS.includes(normalized)) {
    throw new Error(`AI_GOVERNANCE_BLOCKED: AI may suggest but must not govern ${normalized}.`);
  }
}

export function aiMayRecommend(): true {
  return true;
}

export function aiMayGovernOfficialStatus(): false {
  return false;
}

export function aiMaySubmitApplication(): false {
  return false;
}

export function aiMayApproveRefund(): false {
  return false;
}

export function aiMayConfirmFraud(): false {
  return false;
}