export const FINANCE_ENTRY_TYPES = ["FEE", "PAYMENT", "REFUND", "ADJUSTMENT"] as const;
export const FINANCE_DIRECTIONS = ["IN", "OUT"] as const;
export const FINANCE_STATUSES = ["RECORDED", "PENDING", "CONFIRMED", "FAILED", "CANCELLED"] as const;
export const FINANCE_MAX_AMOUNT_CENTS = 1_000_000_000;

export type FinanceEntryInput = {
  type: unknown; direction: unknown; status?: unknown; amountCents: unknown;
  description: unknown; reference?: unknown; evidenceNote?: unknown;
  opportunityId?: unknown; occurredOn: unknown;
};
export type FinanceStatusUpdateInput = {
  status: unknown; reference?: unknown; evidenceNote?: unknown;
  existingReference?: unknown; existingEvidenceNote?: unknown;
};

export function isValidFinanceDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(value + "T00:00:00Z");
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

export function validateFinanceEntryInput(input: FinanceEntryInput): string | null {
  const type = typeof input.type === "string" ? input.type.toUpperCase() : "";
  const direction = typeof input.direction === "string" ? input.direction.toUpperCase() : "";
  const status = typeof input.status === "string" ? input.status.toUpperCase() : "RECORDED";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const reference = typeof input.reference === "string" ? input.reference.trim() : "";
  const evidenceNote = typeof input.evidenceNote === "string" ? input.evidenceNote.trim() : "";
  if (!(FINANCE_ENTRY_TYPES as readonly string[]).includes(type) || !(FINANCE_DIRECTIONS as readonly string[]).includes(direction)) return "Choose a valid entry type and money direction.";
  if (!(FINANCE_STATUSES as readonly string[]).includes(status)) return "Choose a valid ledger status.";
  if (!Number.isSafeInteger(input.amountCents) || (input.amountCents as number) <= 0 || (input.amountCents as number) > FINANCE_MAX_AMOUNT_CENTS) return "Amount must be positive integer cents, no more than R10,000,000.";
  if (description.length < 2 || description.length > 180 || reference.length > 120 || evidenceNote.length > 1000) return "Description must be 2–180 characters; reference max 120 and evidence note max 1,000.";
  if (!isValidFinanceDate(input.occurredOn)) return "Enter a valid transaction date.";
  if (status === "CONFIRMED" && !reference && !evidenceNote) return "A reference or evidence note is required before recording a user-confirmed status.";
  if (typeof input.opportunityId !== "undefined" && typeof input.opportunityId !== "string") return "Linked opportunity identifier must be text.";
  return null;
}

export function validateFinanceStatusUpdate(input: FinanceStatusUpdateInput): string | null {
  const status = typeof input.status === "string" ? input.status.toUpperCase() : "";
  const reference = typeof input.reference === "string" ? input.reference.trim() : "";
  const evidenceNote = typeof input.evidenceNote === "string" ? input.evidenceNote.trim() : "";
  const existingReference = typeof input.existingReference === "string" ? input.existingReference.trim() : "";
  const existingEvidenceNote = typeof input.existingEvidenceNote === "string" ? input.existingEvidenceNote.trim() : "";
  if (!(FINANCE_STATUSES as readonly string[]).includes(status)) return "Choose a valid ledger status.";
  if (reference.length > 120 || evidenceNote.length > 1000) return "Reference max 120 characters and evidence note max 1,000.";
  if (status === "CONFIRMED" && !reference && !evidenceNote && !existingReference && !existingEvidenceNote) return "A reference or evidence note is required before recording a user-confirmed status.";
  return null;
}
