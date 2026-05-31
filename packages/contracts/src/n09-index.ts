export type N09Channel =
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'portal'
  | 'control_plane'
  | 'system'
  | 'failed_safe';

export type N09MessagePurpose =
  | 'candidate_onboarding'
  | 'package_explanation'
  | 'document_request'
  | 'document_received'
  | 'document_rejected'
  | 'route_recommendation'
  | 'known_intent_fast_lane'
  | 'payment_proof_request'
  | 'payment_received'
  | 'refund_review'
  | 'fast_submission_ready'
  | 'source_verification_waiting'
  | 'portal_blocked_map_handoff'
  | 'application_submitted_proof'
  | 'status_update_proof_backed'
  | 'support_followup'
  | 'tribunal_notice'
  | 'founder_digest'
  | 'founder_urgent_alert'
  | 'operator_assignment'
  | 'school_outreach'
  | 'partner_verification'
  | 'candidate_consent_request'
  | 'cv_revamp_delivery'
  | 'cv_revamp_upgrade_offer'
  | 'alumni_success_followup'
  | 'referral_request'
  | 'testimonial_consent_request'
  | 'system_health_alert'
  | 'security_account_backup'
  | 'failed_safe';

export type N09RecipientKind =
  | 'candidate'
  | 'founder'
  | 'operator'
  | 'school'
  | 'partner'
  | 'institution'
  | 'employer'
  | 'alumni'
  | 'system'
  | 'failed_safe';

export interface N09AuditContext {
  readonly tenantRef: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly actorType: 'candidate' | 'founder' | 'operator' | 'worker' | 'system' | 'powershell_creator' | 'provider' | 'failed_safe';
  readonly actorRef: string;
  readonly source: 'api' | 'worker' | 'control_plane' | 'candidate_portal' | 'provider' | 'powershell_creator' | 'validator' | 'seed' | 'failed_safe';
}

export interface N09CreateActionPacketMessageBridgeInput {
  readonly actionPacketRef: string;
  readonly approvalRequestRef?: string;
  readonly founderDecisionRef?: string;
  readonly messageNeeded: boolean;
  readonly recipientKind: N09RecipientKind;
  readonly recipientRef: string;
  readonly recommendedChannel: N09Channel;
  readonly recommendedPurpose: N09MessagePurpose;
  readonly recommendedTemplateRef?: string;
  readonly sourceVerifiedRequired?: boolean;
  readonly sourceVerified?: boolean;
  readonly proofRequired?: boolean;
  readonly proofRef?: string;
  readonly consentRequired?: boolean;
  readonly consentRef?: string;
  readonly bridgeReasonSafe: string;
  readonly candidateSafeSummary?: string;
  readonly founderOperatorSummary?: string;
  readonly blockedReasonSafe?: string;
  readonly productionReady?: false;
  readonly production_ready?: false;
  readonly audit: N09AuditContext;
}

export function n09MakeRef(prefix: string, value: string): string {
  const safePrefix = prefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeValue = value.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safePrefix}_${safeValue}`.slice(0, 180);
}
