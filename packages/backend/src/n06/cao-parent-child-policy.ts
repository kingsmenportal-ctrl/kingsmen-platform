export function assertN06CaoParentChildSafe(input: {
  applicationSystem: "cao" | "institution_direct" | "other";
  parentApplicationCount: number;
  childChoiceCount: number;
  countsAsKingsmenManagedApplications: number;
}) {
  if (input.applicationSystem === "cao") {
    if (input.parentApplicationCount !== 1) {
      throw new Error("N06 CAO must remain one Kingsmen parent application");
    }

    if (input.childChoiceCount < 1) {
      throw new Error("N06 CAO must track programme choices as child choices");
    }

    if (input.countsAsKingsmenManagedApplications !== 1) {
      throw new Error("N06 CAO child choices must not each count as separate Kingsmen managed applications");
    }
  }

  return true;
}