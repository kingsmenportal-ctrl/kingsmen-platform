export function assertCaoParentChildModel(input: {
  applicationSystem: string;
  parentApplicationCount: number;
  childChoiceCount: number;
  countsAsKingsmenManagedApplications: number;
}) {
  if (input.applicationSystem === "cao") {
    if (input.parentApplicationCount !== 1) {
      throw new Error("CAO must be represented as one Kingsmen parent application");
    }

    if (input.childChoiceCount < 1) {
      throw new Error("CAO parent application must track programme choices as child choices");
    }

    if (input.countsAsKingsmenManagedApplications !== 1) {
      throw new Error("CAO child choices must not each count as separate Kingsmen managed applications");
    }
  }

  return true;
}