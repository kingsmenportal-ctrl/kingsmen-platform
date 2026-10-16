import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a PayFast ITN signature against a canonical parameter string.
 * Configure the exact PayFast passphrase and parameter encoding per the provider's
 * current ITN specification; do not accept a webhook if configuration is missing.
 */
export function verifyPayFastSignature(
  parameters: Record<string, string>,
  receivedSignature: string,
  passphrase: string
): boolean {
  if (!passphrase || !receivedSignature || !/^[a-f0-9]{32}$/i.test(receivedSignature)) return false;
  const canonical = Object.keys(parameters)
    .filter((key) => key !== "signature")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(parameters[key].trim()).replace(/%20/g, "+")}`)
    .join("&");
  const expected = createHmac("md5", passphrase).update(canonical).digest("hex");
  const expectedBytes = Buffer.from(expected.toLowerCase(), "utf8");
  const suppliedBytes = Buffer.from(receivedSignature.toLowerCase(), "utf8");
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export function assertPayFastAmountMatches(expectedCents: number, grossAmount: string): void {
  if (!Number.isSafeInteger(expectedCents) || expectedCents < 0) throw new Error("INVALID_EXPECTED_AMOUNT");
  if (!/^\d+\.\d{2}$/.test(grossAmount)) throw new Error("INVALID_PAYFAST_AMOUNT");
  const [whole, fraction] = grossAmount.split(".");
  const receivedCents = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(receivedCents) || receivedCents !== expectedCents) throw new Error("PAYFAST_AMOUNT_MISMATCH");
}
