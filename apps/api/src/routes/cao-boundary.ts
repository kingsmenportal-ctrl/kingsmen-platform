import { validateApplicationChildChoices } from "./application-lifecycle-policy";

export interface CaoChoiceInput {
  choiceNumber: number;
  institutionName: string;
  programmeName: string;
  caoProgrammeCode?: string;
  sourceUrl?: string;
}

export interface CaoBoundaryDecision {
  allowed: boolean;
  reasons: string[];
}

/** Backwards-compatible CAO adapter; all child-choice validation lives in one policy. */
export function validateCaoChoices(choices: CaoChoiceInput[]): CaoBoundaryDecision {
  return validateApplicationChildChoices(choices);
}

export function caoIsOneKingsmenApplication(): true {
  return true;
}
