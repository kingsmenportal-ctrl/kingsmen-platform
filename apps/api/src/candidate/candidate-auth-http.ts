import type { IncomingMessage, ServerResponse } from "node:http";
import {
  CandidateAuthService,
  clearCandidateSessionCookie,
  readCandidateSessionCookie,
  serializeCandidateSessionCookie
} from "./candidate-auth-service";

const MAX_LOGIN_BODY_BYTES = 16_384;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

type JsonBody = { email?: unknown; password?: unknown };
type SendJson = (response: ServerResponse, status: number, body: unknown) => void;

function allowedOrigin(request: IncomingMessage): boolean {
  const expected = process.env.KINGSMEN_CANDIDATE_PORTAL_ORIGIN?.trim();
  const origin = request.headers.origin;
  return Boolean(expected && origin && origin === expected);
}

function requestKey(request: IncomingMessage, email: string): string {
  // Avoid retaining raw IP addresses or email addresses in limiter keys.
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  const address = request.socket.remoteAddress ?? "unknown";
  return createHash("sha256").update(address).update("\0").update(email.trim().toLowerCase()).digest("hex");
}

function rateLimited(request: IncomingMessage, email: string): boolean {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
  const key = requestKey(request, email);
  if (!attempts.has(key) && attempts.size >= 10_000) {
    const oldestKey = attempts.keys().next().value;
    if (oldestKey) attempts.delete(oldestKey);
  }
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS_PER_WINDOW;
}

async function readLoginBody(request: IncomingMessage): Promise<JsonBody> {
  const contentType = request.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new Error("UNSUPPORTED_MEDIA_TYPE");
  let body = "";
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_LOGIN_BODY_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
    body += buffer.toString("utf8");
  }
  let parsed: unknown;
  try { parsed = body.trim() ? JSON.parse(body) : null; } catch { throw new Error("INVALID_JSON"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_JSON");
  return parsed as JsonBody;
}

function cookieToken(request: IncomingMessage): string | null {
  return readCandidateSessionCookie(request.headers.cookie);
}

export async function handleCandidateAuthRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  service: CandidateAuthService | null,
  sendJson: SendJson
): Promise<boolean> {
  if (!["/api/candidate-auth/login", "/api/candidate-auth/logout", "/api/candidate-auth/session"].includes(pathname)) return false;

  // Authentication responses must never be stored by browsers, shared proxies, or CDNs.
  response.setHeader("cache-control", "no-store, no-cache, must-revalidate, private");
  response.setHeader("pragma", "no-cache");
  response.setHeader("x-content-type-options", "nosniff");

  const method = request.method ?? "GET";
  const expectedMethod = pathname.endsWith("/session") ? "GET" : "POST";
  if (method !== expectedMethod) {
    response.setHeader("allow", expectedMethod);
    sendJson(response, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." });
    return true;
  }
  if (pathname !== "/api/candidate-auth/session" && !allowedOrigin(request)) {
    sendJson(response, 403, { ok: false, code: "ORIGIN_NOT_ALLOWED", message: "Request origin is not allowed." });
    return true;
  }
  if (!service) {
    sendJson(response, 503, { ok: false, code: "CANDIDATE_AUTH_NOT_CONFIGURED", message: "Candidate sign-in is not configured." });
    return true;
  }

  if (pathname.endsWith("/login")) {
    let body: JsonBody;
    try {
      body = await readLoginBody(request);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      const status = reason === "REQUEST_BODY_TOO_LARGE" ? 413 : reason === "UNSUPPORTED_MEDIA_TYPE" ? 415 : 400;
      sendJson(response, status, { ok: false, code: reason || "INVALID_REQUEST", message: "The sign-in request is invalid." });
      return true;
    }
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (email.length > 320 || password.length > 1024 || !email.trim() || !password) {
      sendJson(response, 400, { ok: false, code: "INVALID_REQUEST", message: "Email and password are required." });
      return true;
    }
    if (rateLimited(request, email)) {
      response.setHeader("retry-after", "900");
      sendJson(response, 429, { ok: false, code: "LOGIN_RATE_LIMITED", message: "Too many sign-in attempts. Try again later." });
      return true;
    }
    try {
      const result = await service.login(email, password, {
        userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"].slice(0, 512) : undefined
      });
      if (!result.ok) {
        sendJson(response, 401, { ok: false, code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." });
        return true;
      }
      response.setHeader("set-cookie", serializeCandidateSessionCookie(result.token, Math.max(0, Math.floor((Date.parse(result.expiresAt) - Date.now()) / 1000))));
      sendJson(response, 200, { ok: true, expiresAt: result.expiresAt });
    } catch {
      sendJson(response, 503, { ok: false, code: "CANDIDATE_AUTH_UNAVAILABLE", message: "Sign-in is temporarily unavailable." });
    }
    return true;
  }

  if (pathname.endsWith("/logout")) {
    const token = cookieToken(request);
    try {
      if (token) await service.logout(token);
      response.setHeader("set-cookie", clearCandidateSessionCookie());
      sendJson(response, 200, { ok: true, signedOut: true });
    } catch {
      sendJson(response, 503, { ok: false, code: "CANDIDATE_AUTH_UNAVAILABLE", message: "Sign-out is temporarily unavailable." });
    }
    return true;
  }

  const token = cookieToken(request);
  try {
    const result = await service.authenticateToken(token);
    if (!result.authenticated) {
      sendJson(response, 401, { ok: false, code: "NOT_AUTHENTICATED" });
      return true;
    }
    sendJson(response, 200, { ok: true, authenticated: true, expiresAt: result.expiresAt });
  } catch {
    sendJson(response, 503, { ok: false, code: "CANDIDATE_AUTH_UNAVAILABLE", message: "Session verification is temporarily unavailable." });
  }
  return true;
}
