import crypto from "crypto";

export type PayFastFields = Record<string, string | number | boolean | undefined | null>;

export function buildPayFastCanonicalString(fields: PayFastFields, passphrase?: string): string {
  const entries = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== undefined && value !== null && String(value).length > 0)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`);

  if (passphrase) {
    entries.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`);
  }

  return entries.join("&");
}

export function createPayFastSignature(fields: PayFastFields, passphrase?: string): string {
  const canonical = buildPayFastCanonicalString(fields, passphrase);
  return crypto.createHash("md5").update(canonical).digest("hex");
}

/** Compare provider signatures without leaking the first differing character via timing. */
export function verifyPayFastSignature(fields: PayFastFields, receivedSignature: string, passphrase?: string): boolean {
  if (!/^[a-fA-F0-9]{32}$/.test(receivedSignature)) return false;
  const calculated = createPayFastSignature(fields, passphrase);
  const expected = Buffer.from(calculated, "hex");
  const received = Buffer.from(receivedSignature, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function redactPayFastSecrets(fields: PayFastFields): PayFastFields {
  const copy: PayFastFields = { ...fields };
  delete copy.merchant_key;
  delete copy.passphrase;
  return copy;
}
