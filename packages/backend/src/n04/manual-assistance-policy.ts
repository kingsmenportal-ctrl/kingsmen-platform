const MAP_REQUIRED_REASONS = new Set([
  "captcha_or_otp",
  "portal_down",
  "selector_changed",
  "source_uncertain"
]);

export function assertN04ManualAssistanceSafe(input: {
  reason: string;
  mapFallbackRequired?: boolean;
  evidenceId?: string;
  auditId?: string;
  founderOperatorReviewRequired?: boolean;
}) {
  if (!input.evidenceId || !input.auditId) {
    throw new Error("N04 manual assistance requires evidence and auditId");
  }

  if (MAP_REQUIRED_REASONS.has(input.reason) && input.mapFallbackRequired !== true) {
    throw new Error(`N04 manual assistance requires MAP fallback for reason: ${input.reason}`);
  }

  if (input.founderOperatorReviewRequired !== true) {
    throw new Error("N04 manual assistance requires founder/operator review");
  }

  return true;
}