import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export type PayFastEnvironment = "sandbox" | "live";
export type PayFastFields = Record<string, string>;

export type PayFastRuntime = {
  environment: PayFastEnvironment;
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  allowedCidrs: string[];
  apiBaseUrl: string;
};

export function getPayFastRuntime(): PayFastRuntime | null {
  const environment = process.env.PAYFAST_ENVIRONMENT?.trim().toLowerCase();
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim();
  const passphrase = process.env.PAYFAST_PASSPHRASE?.trim();
  const returnUrl = process.env.PAYFAST_RETURN_URL?.trim();
  const cancelUrl = process.env.PAYFAST_CANCEL_URL?.trim();
  const notifyUrl = process.env.PAYFAST_NOTIFY_URL?.trim();
  const allowedCidrs = (process.env.PAYFAST_ITN_ALLOWED_CIDRS || "").split(",").map(x => x.trim()).filter(Boolean);
  if ((environment !== "sandbox" && environment !== "live") || !merchantId || !merchantKey ||
      !passphrase || !returnUrl || !cancelUrl || !notifyUrl || allowedCidrs.length === 0) return null;
  return {
    environment, merchantId, merchantKey, passphrase, returnUrl, cancelUrl, notifyUrl, allowedCidrs,
    apiBaseUrl: environment === "sandbox" ? "https://api.payfast.co.za" : "https://api.payfast.co.za"
  };
}

export function payFastProcessUrl(environment: PayFastEnvironment): string {
  return environment === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";
}

function encodePayFastValue(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+").replace(/[!'()*]/g, ch => "%" + ch.charCodeAt(0).toString(16).toUpperCase());
}

export function createPayFastItnSignature(fields: PayFastFields, passphrase: string): string {
  const parts = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== "")
    .map(([key, value]) => key + "=" + encodePayFastValue(value));
  if (passphrase) parts.push("passphrase=" + encodePayFastValue(passphrase));
  return createHash("md5").update(parts.join("&")).digest("hex");
}

export function verifyPayFastItnSignature(fields: PayFastFields, passphrase: string): boolean {
  const received = fields.signature || "";
  if (!/^[a-f0-9]{32}$/i.test(received)) return false;
  const calculated = createPayFastItnSignature(fields, passphrase);
  return timingSafeEqual(Buffer.from(received.toLowerCase()), Buffer.from(calculated.toLowerCase()));
}

function ipv4Number(ip: string): number | null {
  if (isIP(ip) !== 4) return null;
  return ip.split(".").reduce((value, part) => ((value << 8) | Number(part)) >>> 0, 0);
}

function cidrContains(ip: string, cidr: string): boolean {
  const [network, prefixText] = cidr.split("/");
  const ipNum = ipv4Number(ip);
  const networkNum = ipv4Number(network);
  const prefix = prefixText === undefined ? 32 : Number(prefixText);
  if (ipNum === null || networkNum === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNum & mask) >>> 0 === (networkNum & mask) >>> 0;
}

export function isTrustedPayFastItnSource(request: Request, runtime: PayFastRuntime): boolean {
  // Netlify sets this client-IP header at the edge. Do not trust arbitrary X-Forwarded-For input.
  const source = request.headers.get("x-nf-client-connection-ip")?.trim();
  if (!source || isIP(source) !== 4) return false;
  return runtime.allowedCidrs.some(cidr => cidrContains(source, cidr));
}

export async function validatePayFastItnAtProvider(rawBody: string, environment: PayFastEnvironment): Promise<boolean> {
  const endpoint = environment === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "text/plain" },
      body: rawBody,
      cache: "no-store",
      signal: controller.signal
    });
    return response.ok && (await response.text()).trim() === "VALID";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function payFastApiSignature(fields: Record<string, string>, passphrase: string): string {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + "=" + encodePayFastValue(value));
  if (passphrase) parts.push("passphrase=" + encodePayFastValue(passphrase));
  return createHash("md5").update(parts.join("&")).digest("hex");
}

export function randToMinor(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const result = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return Number.isSafeInteger(result) ? result : null;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function payFastApiHeaders(runtime: PayFastRuntime, bodyFields: Record<string, string> = {}): Record<string, string> {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const fields = { "merchant-id": runtime.merchantId, version: "v1", timestamp, ...bodyFields };
  return {
    "merchant-id": runtime.merchantId,
    version: "v1",
    timestamp,
    signature: payFastApiSignature(fields, runtime.passphrase),
    "content-type": "application/json",
    accept: "application/json"
  };
}
