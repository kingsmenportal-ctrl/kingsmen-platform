const FORBIDDEN_AIRTABLE_FIELDS = new Set([
  "password",
  "secret",
  "service_role",
  "serviceRole",
  "access_token",
  "refresh_token",
  "raw_document",
  "rawDocument",
  "signed_upload_url",
  "signed_read_url",
  "private_proof_payload",
  "payment_webhook_signature",
  "candidate_identity_without_consent",
  "partner_share_without_consent"
]);

const FORBIDDEN_TRUTH_AUTHORITY_FIELDS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "verify_document",
  "reject_document",
  "approve_refund",
  "change_source_confidence",
  "official_status_claim"
]);

export function transformN07AirtableMirrorPayload(input: {
  baseName: string;
  tableName: string;
  sourceEntityType: string;
  sourceEntityId: string;
  payload: Record<string, unknown>;
}) {
  const output: Record<string, unknown> = {};
  const strippedFields: string[] = [];

  for (const [key, value] of Object.entries(input.payload)) {
    if (FORBIDDEN_AIRTABLE_FIELDS.has(key) || FORBIDDEN_TRUTH_AUTHORITY_FIELDS.has(key)) {
      strippedFields.push(key);
      continue;
    }

    output[key] = value;
  }

  return {
    baseName: input.baseName,
    tableName: input.tableName,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: input.sourceEntityId,
    payload: output,
    strippedFields,
    mirrorOnly: true,
    canGovernTruth: false,
    productionReady: false
  } as const;
}

export function assertN07AirtableTransformSafe(result: {
  mirrorOnly: boolean;
  canGovernTruth: boolean;
  payload: Record<string, unknown>;
}) {
  if (result.mirrorOnly !== true || result.canGovernTruth !== false) {
    throw new Error("N07 transform blocked: Airtable payload must remain mirror-only");
  }

  for (const key of Object.keys(result.payload)) {
    if (FORBIDDEN_AIRTABLE_FIELDS.has(key) || FORBIDDEN_TRUTH_AUTHORITY_FIELDS.has(key)) {
      throw new Error(`N07 transform blocked: forbidden Airtable field survived transform: ${key}`);
    }
  }

  return true;
}