import type { IncomingMessage, ServerResponse } from "node:http";

export type JsonRecord = Record<string, unknown>;
export type ComponentRequest = IncomingMessage & { body?: unknown };
export type ComponentHandler = (request: ComponentRequest, response: ServerResponse) => Promise<void>;

export function sendComponentJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

export function readComponentBody(request: ComponentRequest): JsonRecord {
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_JSON_OBJECT");
  return body as JsonRecord;
}

export function requiredString(value: unknown, field: string, max = 200): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) {
    throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  return value.trim();
}

export function amountCents(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error("INVALID_AMOUNT_CENTS");
  return value as number;
}

export function zarCurrency(value: unknown): "ZAR" {
  if (value !== "ZAR") throw new Error("CURRENCY_MUST_BE_ZAR");
  return "ZAR";
}

export function idempotencyKey(value: unknown): string {
  const key = requiredString(value, "idempotency_key", 128);
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error("INVALID_IDEMPOTENCY_KEY");
  return key;
}

export function safeErrorCode(error: unknown): string {
  return error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "COMPONENT_REQUEST_FAILED";
}
