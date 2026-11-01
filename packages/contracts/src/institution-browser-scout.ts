export type InstitutionPathway =
  | 'HIGHER_EDUCATION'
  | 'TVET'
  | 'SETA_LEARNERSHIPS'
  | 'INTERNSHIPS'
  | 'APPRENTICESHIPS'
  | 'EMPLOYMENT';

export type InstitutionTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type InstitutionScoutHealth = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'BROKEN' | 'UNKNOWN';
export type InstitutionBarrier =
  | 'CAPTCHA_REQUIRED'
  | 'OTP_OR_MFA_REQUIRED'
  | 'AUTHENTICATION_REQUIRED'
  | 'PAYMENT_STEP_DETECTED'
  | 'RATE_LIMITED'
  | 'WRITE_STEP_PRESENT'
  | 'PORTAL_CHANGED'
  | 'PORTAL_UNAVAILABLE';

export type InstitutionHandoffMode =
  | 'HUMAN_MAPPING_REVIEW'
  | 'CANDIDATE_CONTROLLED_HANDOFF'
  | 'GUIDED_COMPLETION'
  | 'MANUAL_APPLICATION_PACKET';

export interface InstitutionScoutTarget {
  readonly institutionRef: string;
  readonly displayName: string;
  readonly institutionType: string;
  readonly officialUrl: string;
  readonly approvedHosts: readonly string[];
  readonly tier: InstitutionTier;
  readonly pathways: readonly InstitutionPathway[];
  readonly enabled: boolean;
  readonly mappingVersion?: string;
  readonly expectedStructureFingerprint?: string;
}

export interface InstitutionFieldProposal {
  readonly fieldName: string | null;
  readonly tagName: 'input' | 'select' | 'textarea';
  readonly inputType: string;
  readonly accessibleLabel: string | null;
  readonly required: boolean;
  readonly multiple: boolean;
  readonly acceptedFileTypes: readonly string[];
  readonly locatorProposal: {
    readonly strategy: 'getByLabel' | 'getByRole' | 'manual_review';
    readonly value: string | null;
    readonly confidence: 'HIGH' | 'MEDIUM' | 'NONE';
  };
}

export interface InstitutionCapabilityCard {
  readonly schema: 'kingsmen.institution-capability-card.v1';
  readonly institutionRef: string;
  readonly displayName: string;
  readonly sourceUrl: string;
  readonly observedAt: string;
  readonly tier: InstitutionTier;
  readonly pathways: readonly InstitutionPathway[];
  readonly scoutMode: 'PROBE_READ_ONLY';
  readonly connectionHealth: InstitutionScoutHealth;
  readonly portalStatus: string;
  readonly mappingVersion: string | null;
  readonly mappingStatus:
    | 'BASELINE_REVIEW_REQUIRED'
    | 'MAPPING_STABLE_PENDING_REVIEW'
    | 'MAPPING_DRIFT_REVIEW_REQUIRED';
  readonly structureFingerprint: string;
  readonly barriers: readonly InstitutionBarrier[];
  readonly fields: readonly InstitutionFieldProposal[];
  readonly handoffRecommendation: InstitutionHandoffMode;
  readonly evidenceRefs: readonly string[];
  readonly candidateFacingSafe: false;
  readonly humanReviewRequired: true;
  readonly submissionAttempted: false;
}

export interface InstitutionScoutRunEvidence {
  readonly runRef: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly scoutMode: 'PROBE_READ_ONLY';
  readonly targetsInspected: number;
  readonly formSubmissionAttempts: 0;
  readonly candidateDataRead: false;
  readonly storageStatePersisted: false;
  readonly secretsCaptured: false;
  readonly networkBodiesCaptured: false;
  readonly publicationAttempted: false;
  readonly truthVaultWriteAttempted: false;
}
