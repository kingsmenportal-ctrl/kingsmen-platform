export function assertN04ProfileReviewDecisionSafe(input: {
  reviewerActorType: "founder" | "operator" | "system" | "candidate";
  decision: "approve" | "reject" | "request_more_info";
  reason?: string;
  auditId?: string;
  oldValuePreserved?: boolean;
  silentOverwriteBlocked?: boolean;
}) {
  if (input.reviewerActorType === "candidate") {
    throw new Error("Candidate cannot approve own profile correction");
  }

  if (!input.reason || !input.auditId) {
    throw new Error("N04 profile review requires reason and auditId");
  }

  if (input.oldValuePreserved !== true) {
    throw new Error("N04 profile review must preserve old value");
  }

  if (input.silentOverwriteBlocked !== true) {
    throw new Error("N04 profile review must block silent overwrite");
  }

  return true;
}