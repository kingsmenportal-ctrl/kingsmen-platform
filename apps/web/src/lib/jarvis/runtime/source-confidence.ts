import type { JarvisSourceConfidenceDecision } from './types';

interface SourceConfidenceInput {
  hasEvidence: boolean;
  isOfficial?: boolean;
  isTrusted?: boolean;
  isFresh?: boolean;
  hasConflict?: boolean;
  isUnsafe?: boolean;
}

export function classifySourceConfidence(input: SourceConfidenceInput): JarvisSourceConfidenceDecision {
  if (input.isUnsafe) {
    return { band: 'blocked_or_unsafe', mayAnswerConfidently: false, mayTriggerAction: false, requiresReview: true, reason: 'Unsafe source or claim.' };
  }

  if (!input.hasEvidence) {
    return { band: 'low_unverified_or_stale', mayAnswerConfidently: false, mayTriggerAction: false, requiresReview: true, reason: 'Evidence is missing.' };
  }

  if (input.hasConflict) {
    return { band: 'medium_needs_review', mayAnswerConfidently: false, mayTriggerAction: false, requiresReview: true, reason: 'Source conflict detected.' };
  }

  if (input.isOfficial && input.isFresh) {
    return { band: 'verified_official', mayAnswerConfidently: true, mayTriggerAction: true, requiresReview: false, reason: 'Official and fresh source.' };
  }

  if (input.isTrusted && input.isFresh) {
    return { band: 'high_trusted_recent', mayAnswerConfidently: true, mayTriggerAction: false, requiresReview: false, reason: 'Trusted recent source.' };
  }

  return { band: 'low_unverified_or_stale', mayAnswerConfidently: false, mayTriggerAction: false, requiresReview: true, reason: 'Source is weak, stale, or indirect.' };
}
