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

export function verifyPayFastSignature(fields: PayFastFields, receivedSignature: string, passphrase?: string): boolean {
  // PayFast currently specifies an MD5 hex signature. Reject malformed input before
  // decoding, then compare fixed-length buffers in constant time to avoid a
  // character-by-character timing leak in the authentication check.
  if (!/^[a-f0-9]{32}$/i.test(receivedSignature)) return false;

  const calculated = Buffer.from(createPayFastSignature(fields, passphrase), "hex");
  const received = Buffer.from(receivedSignature, "hex");
  return calculated.length === received.length && crypto.timingSafeEqual(calculated, received);
}

export function redactPayFastSecrets(fields: PayFastFields): PayFastFields {
  const copy: PayFastFields = { ...fields };
  delete copy.merchant_key;
  delete copy.passphrase;
  return copy;
}
