import type { MobileExperienceSummary, MobileQuickAction, MobileStatusCard } from "./candidate-mobile-types";
import { buildMobileExperienceSummary } from "./mobile-policy";

export interface CandidateMobileHomeReadModel {
  candidateId: string;
  summary: MobileExperienceSummary;
  quickActions: MobileQuickAction[];
  statusCards: MobileStatusCard[];
  lockedWarnings: string[];
}

export function buildCandidateMobileHomeReadModel(input: {
  candidateId: string;
  quickActions: MobileQuickAction[];
  statusCards: MobileStatusCard[];
}): CandidateMobileHomeReadModel {
  return {
    candidateId: input.candidateId,
    summary: buildMobileExperienceSummary(),
    quickActions: input.quickActions.filter((a) => a.enabled),
    statusCards: input.statusCards,
    lockedWarnings: [
      "Candidate mobile is read/write only through approved backend commands.",
      "Candidates can submit missing information but cannot override backend state.",
      "Official decisions, deadlines, fees, and requirements require source evidence."
    ]
  };
}