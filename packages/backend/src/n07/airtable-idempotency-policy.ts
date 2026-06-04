export function buildN07AirtableIdempotencyKey(input: {
  sourceEntityType: string;
  sourceEntityId: string;
  targetBaseName: string;
  targetTableName: string;
  operation: string;
}) {
  if (!input.sourceEntityType || !input.sourceEntityId || !input.targetBaseName || !input.targetTableName || !input.operation) {
    throw new Error("N07 Airtable idempotency key requires source, target, and operation");
  }

  return [
    "n07_airtable",
    input.sourceEntityType,
    input.sourceEntityId,
    input.targetBaseName,
    input.targetTableName,
    input.operation
  ].join(":");
}