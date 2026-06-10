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

export function validateCaoChoices(choices: CaoChoiceInput[]): CaoBoundaryDecision {
  const reasons: string[] = [];

  if (choices.length === 0) {
    return { allowed: false, reasons: ["At least one CAO choice is required."] };
  }

  if (choices.length > 6) {
    return { allowed: false, reasons: ["CAO allows a combination of up to six programmes in the route boundary."] };
  }

  const seen = new Set<number>();

  for (const choice of choices) {
    if (choice.choiceNumber < 1 || choice.choiceNumber > 6) {
      reasons.push(`Invalid CAO choice number: ${choice.choiceNumber}.`);
    }

    if (seen.has(choice.choiceNumber)) {
      reasons.push(`Duplicate CAO choice number: ${choice.choiceNumber}.`);
    }

    seen.add(choice.choiceNumber);

    if (!choice.institutionName || !choice.programmeName) {
      reasons.push("Each CAO choice requires institutionName and programmeName.");
    }
  }

  if (reasons.length > 0) {
    return { allowed: false, reasons };
  }

  return {
    allowed: true,
    reasons: ["CAO choices fit the one-application child-choice boundary."]
  };
}

export function caoIsOneKingsmenApplication(): true {
  return true;
}