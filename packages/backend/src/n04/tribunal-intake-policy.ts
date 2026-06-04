export function assertN04TribunalIntakeSafe(input: {
  issueType: string;
  evidenceIds?: string[];
  auditId?: string;
  founderOperatorReviewRequired?: boolean;
  candidateVisible?: boolean;
}) {
  if (!input.auditId) {
    throw new Error("N04 tribunal intake requires auditId");
  }

  if (!input.evidenceIds || input.evidenceIds.length === 0) {
    throw new Error("N04 tribunal intake requires evidence");
  }

  if (input.founderOperatorReviewRequired !== true) {
    throw new Error("N04 tribunal intake requires founder/operator review");
  }

  if (input.candidateVisible !== true) {
    throw new Error("N04 tribunal intake must be candidate-visible");
  }

  return true;
}