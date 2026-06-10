export interface AiBudgetDecision {
  allowed: boolean;
  reason: string;
  mode: "rules_first" | "ai_allowed" | "blocked";
}

export function decideAiBudget(input: {
  expensiveCallsToday: number;
  maxExpensiveCallsPerCandidatePerDay?: number;
  hasRulesResult: boolean;
  needsExplanation: boolean;
}): AiBudgetDecision {
  const max = input.maxExpensiveCallsPerCandidatePerDay ?? 3;

  if (input.expensiveCallsToday >= max) {
    return {
      allowed: false,
      reason: "Oracle Lite AI budget guard blocked expensive call for this candidate today.",
      mode: "blocked"
    };
  }

  if (input.hasRulesResult && !input.needsExplanation) {
    return {
      allowed: false,
      reason: "Rules-first result is sufficient; no AI call needed.",
      mode: "rules_first"
    };
  }

  return {
    allowed: true,
    reason: "AI call allowed for explanation, ranking, or ambiguity reduction.",
    mode: "ai_allowed"
  };
}