export function centsToRand(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export function randToCents(value: string | number): number {
  const numeric = typeof value === "number" ? value : Number(value.replace(",", "."));
  if (!Number.isFinite(numeric)) throw new Error("Invalid ZAR amount.");
  return Math.round(numeric * 100);
}

export function assertPositiveOrZeroCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("Amount must be zero or positive cents.");
  }
}