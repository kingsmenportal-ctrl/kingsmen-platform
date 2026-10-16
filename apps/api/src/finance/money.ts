export function centsToRand(amountCents: number): string {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error("Amount must be a non-negative safe integer number of cents.");
  }
  return (amountCents / 100).toFixed(2);
}

/**
 * Parse a ZAR decimal without locale guessing or rounding extra precision.
 * Accepted forms: 0, 0.0, 0.00, 12, 12.3, 12.34.
 */
export function randToCents(value: string | number): number {
  const text = typeof value === "number"
    ? (Number.isFinite(value) ? String(value) : "")
    : value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Invalid ZAR amount: use a non-negative decimal with at most two fractional digits.");
  }
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error("ZAR amount exceeds safe integer precision.");
  return cents;
}

export function assertPositiveOrZeroCents(amountCents: number): void {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error("Amount must be zero or positive safe integer cents.");
  }
}
