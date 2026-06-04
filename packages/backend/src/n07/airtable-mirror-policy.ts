const AIRTABLE_FORBIDDEN_TRUTH_ACTIONS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "verify_document",
  "reject_document",
  "clear_fraud",
  "change_source_confidence",
  "approve_refund",
  "publish_success_story",
  "share_partner_identity"
]);

export function assertN07AirtableMirrorSafe(input: {
  action: string;
  postgresTruthPreserved: boolean;
  airtableMirrorOnly: boolean;
  providerLiveClaim?: boolean;
  productionReady?: boolean;
}) {
  if (input.postgresTruthPreserved !== true) {
    throw new Error("N07 Airtable blocked: PostgreSQL must remain truth");
  }

  if (input.airtableMirrorOnly !== true) {
    throw new Error("N07 Airtable blocked: Airtable is async mirror only");
  }

  if (AIRTABLE_FORBIDDEN_TRUTH_ACTIONS.has(input.action)) {
    throw new Error(`N07 Airtable blocked: mirror cannot govern truth action ${input.action}`);
  }

  if (input.providerLiveClaim === true) {
    throw new Error("N07 Airtable blocked: provider live claim requires proof gate");
  }

  if (input.productionReady === true) {
    throw new Error("N07 Airtable boundary cannot claim productionReady=true");
  }

  return true;
}