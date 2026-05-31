import type {
  N09Channel,
  N09CreateActionPacketMessageBridgeInput,
  N09MessagePurpose,
  N09RecipientKind
} from "../../contracts/src/n09-index";
import { n09MakeRef } from "../../contracts/src/n09-index";
import { n09AssertChannelAllowed } from "./n09-channel-policy";
import {
  n09AssertProductionReadyFalse,
  n09AssertSafeText,
  N09MessagePolicyError
} from "./n09-message-safety-policy";

const SOURCE_VERIFIED_PURPOSES = new Set<N09MessagePurpose>([
  "route_recommendation",
  "known_intent_fast_lane",
  "payment_proof_request",
  "fast_submission_ready",
  "portal_blocked_map_handoff",
  "application_submitted_proof",
  "status_update_proof_backed"
]);

const PROOF_REQUIRED_PURPOSES = new Set<N09MessagePurpose>([
  "application_submitted_proof",
  "status_update_proof_backed",
  "payment_received",
  "testimonial_consent_request"
]);

const CONSENT_RELATED_PURPOSES = new Set<N09MessagePurpose>([
  "candidate_consent_request",
  "testimonial_consent_request",
  "referral_request",
  "alumni_success_followup"
]);

const CANDIDATE_SAFE_CHANNELS = new Set<N09Channel>([
  "email",
  "whatsapp",
  "sms",
  "portal",
  "failed_safe"
]);

const DIRECT_CANDIDATE_RECIPIENTS = new Set<N09RecipientKind>([
  "candidate",
  "alumni"
]);

function n09IsBlank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

function n09AssertNoUnsafeSummary(value: string | undefined, fieldName: string): void {
  if (n09IsBlank(value)) return;

  const text = value.trim();
  n09AssertSafeText(text, fieldName);

  const forbiddenPatterns = [
    /guarantee(d)?\s+(acceptance|funding|placement|employment|job|success)/i,
    /100%\s*success/i,
    /we\s+are\s+the\s+institution/i,
    /officially\s+accepted\s+without\s+proof/i,
    /pay\s+this\s+fee\s+without\s+verified\s+source/i,
    /service[_-]?role/i,
    /database[_-]?url/i,
    /raw\s+document/i,
    /raw\s+evidence/i,
    /api[_-]?key/i,
    /smtp\s+password/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      throw new N09MessagePolicyError(
        "N09_BRIDGE_UNSAFE_SUMMARY_FORBIDDEN",
        `Action-packet bridge summary is unsafe: ${fieldName}.`
      );
    }
  }
}

function n09AssertCandidateChannelAllowed(args: {
  readonly recipientKind: N09RecipientKind;
  readonly recommendedChannel: N09Channel;
}): void {
  if (
    DIRECT_CANDIDATE_RECIPIENTS.has(args.recipientKind) &&
    !CANDIDATE_SAFE_CHANNELS.has(args.recommendedChannel)
  ) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_CANDIDATE_CHANNEL_FORBIDDEN",
      "Candidate-facing bridge messages cannot use founder/operator control-plane channels."
    );
  }
}

function n09AssertTemplateWhenMessageNeeded(input: N09CreateActionPacketMessageBridgeInput): void {
  if (input.messageNeeded !== true) return;

  if (n09IsBlank(input.recommendedTemplateRef)) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_TEMPLATE_REQUIRED",
      "A message-producing action-packet bridge requires recommendedTemplateRef."
    );
  }

  if (n09IsBlank(input.recipientRef)) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_RECIPIENT_REQUIRED",
      "A message-producing action-packet bridge requires recipientRef."
    );
  }
}

function n09AssertSourceProofConsentRules(input: N09CreateActionPacketMessageBridgeInput): void {
  const sourceRequired =
    input.sourceVerifiedRequired === true ||
    SOURCE_VERIFIED_PURPOSES.has(input.recommendedPurpose);

  if (sourceRequired && input.sourceVerified !== true) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_SOURCE_VERIFICATION_REQUIRED",
      "Action-packet bridge cannot recommend candidate instructions until source verification is true."
    );
  }

  const proofRequired =
    input.proofRequired === true ||
    PROOF_REQUIRED_PURPOSES.has(input.recommendedPurpose);

  if (proofRequired && n09IsBlank(input.proofRef)) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_PROOF_REQUIRED",
      "Action-packet bridge cannot recommend proof/status/success messaging without proofRef."
    );
  }

  if (input.consentRequired === true && n09IsBlank(input.consentRef)) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_CONSENT_REQUIRED",
      "Action-packet bridge cannot recommend consent-gated messaging without consentRef."
    );
  }

  if (
    input.recommendedPurpose === "testimonial_consent_request" &&
    n09IsBlank(input.proofRef)
  ) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_SUCCESS_PROOF_REQUIRED",
      "Success/testimonial messaging requires proof before any consent request can be bridged."
    );
  }

  if (
    CONSENT_RELATED_PURPOSES.has(input.recommendedPurpose) &&
    input.recipientKind !== "candidate" &&
    input.recipientKind !== "alumni"
  ) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_CONSENT_RECIPIENT_FORBIDDEN",
      "Consent, referral, alumni, and testimonial messages must go to the candidate/alumni, not partners or employers."
    );
  }
}

function n09AssertChannelRules(input: N09CreateActionPacketMessageBridgeInput): void {
  n09AssertChannelAllowed({
    channel: input.recommendedChannel,
    purpose: input.recommendedPurpose,
    isBulk: false,
    isUrgent: input.recommendedChannel === "whatsapp",
    isEmergency: false,
    isCeremonial: false
  });

  n09AssertCandidateChannelAllowed({
    recipientKind: input.recipientKind,
    recommendedChannel: input.recommendedChannel
  });

  if (
    input.recommendedChannel === "sms" &&
    input.recommendedPurpose !== "security_account_backup" &&
    input.recommendedPurpose !== "fast_submission_ready" &&
    input.recommendedPurpose !== "founder_urgent_alert" &&
    input.recommendedPurpose !== "system_health_alert"
  ) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_SMS_BACKUP_ONLY",
      "SMS bridge recommendations are backup-only and limited to security, urgent deadline, founder alert, or system health cases."
    );
  }
}

export function n09AssertBridgeSafe(input: N09CreateActionPacketMessageBridgeInput): void {
  n09AssertProductionReadyFalse(input as { productionReady?: boolean; production_ready?: boolean });

  n09AssertSafeText(input.actionPacketRef, "actionPacketRef");
  n09AssertSafeText(input.bridgeReasonSafe, "bridgeReasonSafe");

  n09AssertNoUnsafeSummary(input.bridgeReasonSafe, "bridgeReasonSafe");
  n09AssertNoUnsafeSummary(input.candidateSafeSummary, "candidateSafeSummary");
  n09AssertNoUnsafeSummary(input.founderOperatorSummary, "founderOperatorSummary");
  n09AssertNoUnsafeSummary(input.blockedReasonSafe, "blockedReasonSafe");

  n09AssertTemplateWhenMessageNeeded(input);
  n09AssertChannelRules(input);
  n09AssertSourceProofConsentRules(input);

  if (input.messageNeeded === false && !n09IsBlank(input.recommendedTemplateRef)) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_TEMPLATE_WITHOUT_MESSAGE_FORBIDDEN",
      "Bridge records that do not need a message cannot carry a recommended template."
    );
  }

  if (input.recommendedChannel === "failed_safe" && input.messageNeeded === true) {
    throw new N09MessagePolicyError(
      "N09_BRIDGE_FAILED_SAFE_CANNOT_SEND",
      "failed_safe bridge records cannot produce outbound messages."
    );
  }
}

export function n09BuildActionPacketBridgePublic(input: N09CreateActionPacketMessageBridgeInput) {
  n09AssertBridgeSafe(input);

  const bridge = {
    bridgeRef: n09MakeRef("n09_bridge", `${input.actionPacketRef}_${Date.now()}`),
    tenantRef: input.audit.tenantRef,
    actionPacketRef: input.actionPacketRef,
    approvalRequestRef: input.approvalRequestRef ?? "",
    founderDecisionRef: input.founderDecisionRef ?? "",
    bridgeStatus: input.messageNeeded ? "ready_for_message_policy" : "no_message_required",
    messageNeeded: input.messageNeeded,
    recipientKind: input.recipientKind,
    recipientRef: input.recipientRef,
    recommendedChannel: input.recommendedChannel,
    recommendedPurpose: input.recommendedPurpose,
    recommendedTemplateRef: input.recommendedTemplateRef ?? "",
    sourceVerifiedRequired:
      input.sourceVerifiedRequired === true ||
      SOURCE_VERIFIED_PURPOSES.has(input.recommendedPurpose),
    sourceVerified: input.sourceVerified ?? false,
    proofRequired:
      input.proofRequired === true ||
      PROOF_REQUIRED_PURPOSES.has(input.recommendedPurpose),
    proofRef: input.proofRef ?? "",
    consentRequired: input.consentRequired ?? false,
    consentRef: input.consentRef ?? "",
    messageRef: "",
    bridgeReasonSafe: input.bridgeReasonSafe,
    candidateSafeSummary: input.candidateSafeSummary ?? "",
    founderOperatorSummary: input.founderOperatorSummary ?? "",
    blockedReasonSafe: input.blockedReasonSafe ?? "",
    productionReady: false as const
  };

  n09AssertProductionReadyFalse(bridge);
  return bridge;
}
