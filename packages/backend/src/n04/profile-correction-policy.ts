const SENSITIVE_FIELDS = new Set([
  "full_name",
  "email",
  "phone",
  "id_number_hash",
  "guardian_contact"
]);

const FORBIDDEN_PROFILE_EDIT_ACTIONS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "change_source_confidence",
  "publish_success_story",
  "share_identity_with_partner"
]);

export function assertN04ProfileCorrectionSafe(input: {
  field: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  action?: string;
  auditId?: string;
  popiaAccessLogId?: string;
  oldValueSummary?: string;
  newValueSummary?: string;
  reviewed?: boolean;
}) {
  if (!input.auditId) {
    throw new Error("N04 profile correction requires auditId");
  }

  if (!input.popiaAccessLogId) {
    throw new Error("N04 profile correction requires POPIA access log");
  }

  if (!input.oldValueSummary || !input.newValueSummary) {
    throw new Error("N04 profile correction must preserve old and new value summaries");
  }

  if (input.actorType === "candidate" && FORBIDDEN_PROFILE_EDIT_ACTIONS.has(input.action || "")) {
    throw new Error(`N04 profile edit cannot perform truth-authority action: ${input.action}`);
  }

  if (SENSITIVE_FIELDS.has(input.field) && input.reviewed !== true) {
    throw new Error(`N04 sensitive profile change requires review: ${input.field}`);
  }

  return true;
}