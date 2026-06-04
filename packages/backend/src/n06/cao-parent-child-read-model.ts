export function buildN06CaoParentChildReadModel(input: {
  candidateId: string;
  parentApplicationId: string;
  choices: Array<{
    choiceId: string;
    programmeName: string;
    institutionName: string;
    campus?: string;
    choiceOrder: number;
    sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  }>;
}) {
  if (!input.candidateId || !input.parentApplicationId) {
    throw new Error("N06 CAO parent-child read model requires candidateId and parentApplicationId");
  }

  return {
    schema: "kingsmen.n06-cao-parent-child-read-model.v1",
    candidateId: input.candidateId,
    parentApplicationId: input.parentApplicationId,
    countsAsOneKingsmenApplication: true,
    childChoiceCountsAsSeparateKingsmenApplication: false,
    choices: input.choices,
    candidateCanFinalizeOfficialOrder: false,
    noGuaranteeLanguageRequired: true,
    productionReady: false
  } as const;
}