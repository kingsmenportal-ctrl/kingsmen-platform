export type N06CaoParentRecord = {
  parentApplicationId: string;
  candidateId: string;
  countsAsKingsmenManagedApplication: true;
  productionReady: false;
};

export type N06CaoChoiceRecord = {
  choiceId: string;
  parentApplicationId: string;
  programmeName: string;
  institutionName: string;
  choiceOrder: number;
  countsAsSeparateKingsmenApplication: false;
  productionReady: false;
};

const parents = new Map<string, N06CaoParentRecord>();
const choices = new Map<string, N06CaoChoiceRecord>();

export const n06CaoChoiceRepository = {
  async saveParent(record: N06CaoParentRecord) {
    if (!record.parentApplicationId || !record.candidateId) {
      throw new Error("N06 CAO parent repository save requires parentApplicationId and candidateId");
    }

    parents.set(record.parentApplicationId, record);
    return record;
  },

  async saveChoice(record: N06CaoChoiceRecord) {
    if (!record.choiceId || !record.parentApplicationId) {
      throw new Error("N06 CAO choice repository save requires choiceId and parentApplicationId");
    }

    if (record.countsAsSeparateKingsmenApplication !== false) {
      throw new Error("N06 CAO child choice must not count as separate Kingsmen application");
    }

    choices.set(record.choiceId, record);
    return record;
  },

  async listChoices(parentApplicationId: string) {
    return [...choices.values()].filter((choice) => choice.parentApplicationId === parentApplicationId);
  }
} as const;