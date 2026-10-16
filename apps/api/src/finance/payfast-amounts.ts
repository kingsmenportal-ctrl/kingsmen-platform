import { randToCents } from "./money";

export interface PayFastAmountReconciliation {
  valid: boolean;
  grossCents: number | null;
  feeCents: number | null;
  netCents: number | null;
  reason?: string;
}

function parseSignedCents(value: unknown): number | null {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text) || text === "-0" || text.startsWith("-0.") && Number(text) === 0) return null;
  const negative = text.startsWith("-");
  try {
    const cents = randToCents(negative ? text.slice(1) : text);
    return negative ? -cents : cents;
  } catch {
    return null;
  }
}

/** PayFast fees are represented as signed amounts; reconcile gross + fee = net. */
export function reconcilePayFastAmounts(gross: unknown, fee: unknown, net: unknown, expectedGrossCents: number): PayFastAmountReconciliation {
  const grossCents = parseSignedCents(gross);
  const feeCents = parseSignedCents(fee);
  const netCents = parseSignedCents(net);
  if (!Number.isSafeInteger(expectedGrossCents) || expectedGrossCents <= 0) {
    return { valid: false, grossCents, feeCents, netCents, reason: "Invalid expected order amount." };
  }
  if (grossCents === null || feeCents === null || netCents === null) {
    return { valid: false, grossCents, feeCents, netCents, reason: "Gross, fee, and net must be valid decimal amounts." };
  }
  if (grossCents !== expectedGrossCents) {
    return { valid: false, grossCents, feeCents, netCents, reason: "Gross amount does not match the order." };
  }
  if (grossCents + feeCents !== netCents || netCents < 0) {
    return { valid: false, grossCents, feeCents, netCents, reason: "Gross plus signed fee does not equal net." };
  }
  return { valid: true, grossCents, feeCents, netCents };
}
